# api/api.py
import io
from ninja import NinjaAPI, File, UploadedFile, Form, Query
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.contrib.postgres.search import SearchVector
from django.utils import timezone
from django.core.paginator import Paginator
from datetime import date, timedelta
from typing import List, Optional
from .models import Document, DocumentChunk
from .schemas import ChatIn, ChatOut, DocumentOut, CategoryEnum, AlertOut, PaginatedDocuments, PaginatedAlerts
from .services import upload_contract_to_s3, generate_presigned_viewable_url, search_hybrid, get_embedding, call_llm, determine_search_depth, extract_dates_from_text
from pypdf import PdfReader
import time
import re
import os
from asgiref.sync import sync_to_async

api = NinjaAPI(title="ConTracKt AI API")

@api.post("/upload", response=DocumentOut)
def upload_document(
    request, 
    file: UploadedFile = File(...), 
    category: CategoryEnum = Form(CategoryEnum.GENERAL)
):
    """
    Uploads PDF using the robust S3 Client logic
    """
    if file.size > 10 * 1024 * 1024:
        raise ValueError("File too large. Maximum size is 10MB.")
    
    # 1. This creates a raw bytes object that persists even if a stream closes
    file_content = file.read()
    
    # 2. Create independent streams (Clones)
    s3_buffer = io.BytesIO(file_content)   # Clone for S3
    pdf_buffer = io.BytesIO(file_content)  # Clone for PDF Reader
    # 3. Prepare Key (Clean filename)
    clean_name = file.name.replace(" ", "_").replace("(", "").replace(")", "")
    s3_key = f"uploads/{clean_name}"

    # This returns "s3://bucket/uploads/filename.pdf"
    # 4. Upload using the S3 Clone
    s3_uri = upload_contract_to_s3(
        file_buffer=s3_buffer, # <--- Pass the clone
        bucket_name=settings.AWS_S3_BUCKET_NAME,
        file_key=s3_key,
        content_type='application/pdf'
    )
    
    # 5. Read PDF Content (Reset cursor first)
    pdf_reader = PdfReader(pdf_buffer)
    text_sample = ""
    if len(pdf_reader.pages) > 0:
        text_sample += pdf_reader.pages[0].extract_text() or ""
        
    date_meta = extract_dates_from_text(text_sample)

    # 6. Save to DB
    # Note: We store the full S3 URI in 's3_key' field to match your retrieval logic
    doc = Document.objects.create(
        title=file.name,
        s3_key=s3_uri,  # <--- Storing "s3://..."
        total_pages=len(pdf_reader.pages),
        category=category.value,
        effective_date=date_meta.get('effective_date'), 
        expiry_date=date_meta.get('expiry_date')
    )
    
    # 7. Chunking & Embedding
    chunks = []
    for i, page in enumerate(pdf_reader.pages):
        text = page.extract_text()
        if len(text) > 50:
            vec = get_embedding(text)
            chunks.append(DocumentChunk(
                document=doc,
                chunk_index=i + 1,
                text_content=text,
                embedding=vec
            ))
            
    DocumentChunk.objects.bulk_create(chunks)
    DocumentChunk.objects.filter(document=doc).update(search_vector=SearchVector('text_content'))
    
    return doc

# --- 2. NEW FEATURE: LIST DOCUMENTS ---
# --- 2. LIST DOCUMENTS (With Dropdown Filter) ---
# --- UPDATED: LIST DOCUMENTS (Server-Side Pagination) ---
@api.get("/documents", response=PaginatedDocuments) # <--- Return new Schema
def list_documents(
    request, 
    category: Optional[CategoryEnum] = Query(None), 
    page: int = 1,      # Default page 1
    limit: int = 10     # Default 10 items
):
    """
    Lists contracts with Filter & Pagination.
    """
    # 1. Filter Logic
    qs = Document.objects.all().order_by('-uploaded_at')
    
    if category:
        qs = qs.filter(category=category.value)
        
    # 2. Pagination Logic
    paginator = Paginator(qs, limit)
    
    # Handle "page out of range" gracefully (optional, or let it crash to 404)
    if page < 1: page = 1
    current_page_data = paginator.get_page(page)

    # 3. Build Response List for THIS page only
    response_list = []
    for doc in current_page_data.object_list:
        response_list.append({
            "id": doc.id,
            "title": doc.title,
            "category": doc.category,
            "uploaded_at": doc.uploaded_at,
            "total_pages": doc.total_pages,
            "effective_date": doc.effective_date,
            "expiry_date": doc.expiry_date,
            "file_url": generate_presigned_viewable_url(doc.s3_key)
        })
        
    # 4. Return Structure
    return {
        "data": response_list,
        "total": paginator.count,
        "page": page,
        "limit": limit,
        "total_pages": paginator.num_pages
    }
    
# --- 3. INTELLIGENT CHAT (With Auto-Fallback) ---
@api.post("/chat", response=ChatOut)
async def chat_endpoint(request, payload: ChatIn):
    start = time.time()
    
    # Helper Pipeline
    async def run_pipeline(query, category_filter_val, doc_ids_val):
        k_value = await sync_to_async(determine_search_depth)(query)
        
        raw_results = await sync_to_async(search_hybrid)(
            query, 
            top_k=k_value * 3,
            category_filter=category_filter_val,
            doc_ids=doc_ids_val # <--- Passing IDs to service
        )
        
        # ... (Context Building Logic same as before) ...
        grouped_results = {}
        for res in raw_results:
            title = res.document.title
            if title not in grouped_results: grouped_results[title] = []
            grouped_results[title].append(res)
            
        final_context_list = []
        has_more = True
        while has_more and len(final_context_list) < k_value:
            has_more = False
            for title in sorted(grouped_results.keys()):
                if grouped_results[title]:
                    chunk = grouped_results[title].pop(0)
                    final_context_list.append(chunk)
                    has_more = True
                    if len(final_context_list) >= k_value: break
        
        context_chunks = []
        char_count = 0
        MAX_CHARS = 50000
        for c in final_context_list:
            txt = f"[[SOURCE: {c.document.title}]]\n{c.text_content}\n\n"
            if char_count + len(txt) > MAX_CHARS: break
            context_chunks.append(txt)
            char_count += len(txt)
            
        context_str = "".join(context_chunks)
        
        llm_resp = await sync_to_async(call_llm)(context_str, query)
        return llm_resp, final_context_list

    # --- MAIN EXECUTION ---
    
    # 1. Get User Inputs
    user_cat = payload.category_filter.value if payload.category_filter else None
    user_doc_ids = payload.doc_ids if payload.doc_ids else None
    
    # 2. Run Pipeline (Strict Mode)
    raw_answer, context_nodes = await run_pipeline(payload.query, user_cat, user_doc_ids)
    
    # 3. Fallback Logic Check
    # "Context missing" means the LLM didn't find the answer.
    failed_search = "[[REASON: Context missing]]" in raw_answer or "[[REASON: Outside of knowledge base]]" in raw_answer
    
    did_fallback = False
    
    # 🔥 STRICT RULE: 
    # Only try Global Fallback if user searched by Category (user_cat).
    # IF user_doc_ids IS SET, WE DO NOT FALLBACK. (Respect "No other docs")
    if failed_search and user_cat is not None and user_doc_ids is None:
        print(f"⚠️ Search in category '{user_cat}' failed. Attempting Global Search...")
        
        # Run again with NO filters
        fallback_answer, fallback_nodes = await run_pipeline(payload.query, None, None)
        
        # Only use fallback if it actually found something
        if "[[REASON: Context missing]]" not in fallback_answer:
            raw_answer = fallback_answer
            context_nodes = fallback_nodes
            did_fallback = True
            
    # ... (Rest of parsing/formatting code logic remains exactly the same) ...
    # (Clean Answer Parts, Source Reasoning, etc.)
    
    clean_answer_parts = []
    source_reasoning_map = {}
    segments = re.split(r'(### SOURCE: .*)', raw_answer)
    current_title = None
    
    for seg in segments:
        if seg.startswith("### SOURCE:"):
            current_title = seg.replace("### SOURCE:", "").strip()
            clean_answer_parts.append(seg)
        else:
            text_body = seg.strip()
            if not current_title or not text_body: continue
            
            if "[[EMPTY]]" in text_body or len(text_body) < 10:
                if clean_answer_parts and clean_answer_parts[-1].startswith("### SOURCE:"):
                    clean_answer_parts.pop() 
                current_title = None
                continue

            reason_match = re.search(r'\[\[REASON:(.*?)\]\]', text_body, re.DOTALL)
            if reason_match:
                reason_text = reason_match.group(1).strip()
                source_reasoning_map[current_title] = reason_text
                clean_text = text_body.replace(reason_match.group(0), "").strip()
                clean_answer_parts.append(clean_text)
            else:
                source_reasoning_map[current_title] = "Contextual match found by AI analysis."
                clean_answer_parts.append(text_body)

    final_clean_answer = "\n".join(clean_answer_parts)
    
    if did_fallback:
        notice = f"⚠️ **Note:** I couldn't find this in *{user_cat}*, so I searched **ALL** categories and found this:\n\n"
        final_clean_answer = notice + final_clean_answer
    
    seen_urls = set()
    sources = []
    
    for res in context_nodes:
        if res.document.title in source_reasoning_map:
            unique_key = f"{res.document.title}-{res.chunk_index}"
            if unique_key not in seen_urls:
                clean_snippet = res.text_content[:600].replace("\n", " ") + "..."
                ai_reason = source_reasoning_map.get(res.document.title, "Matched relevant context.")
                
                sources.append({
                    "title": res.document.title, 
                    "page": res.chunk_index, 
                    "score": getattr(res, 'score', 0.0), 
                    "file_url": generate_presigned_viewable_url(res.document.s3_key),
                    "snippet": clean_snippet,
                    "reason": ai_reason
                })
                seen_urls.add(unique_key)
    
    return {
        "answer": final_clean_answer,
        "sources": sources,
        "processing_time": time.time() - start
    }
        
@api.get("/alerts", response=PaginatedAlerts)
def get_contract_alerts(
    request, 
    status: str = "all", # 'critical', 'upcoming', or 'all'
    page: int = 1, 
    limit: int = 10
):
    """
    Fetches contracts expiring soon.
    - Critical: 0-20 days
    - Upcoming: 21-60 days
    """
    today = timezone.now().date()
    
    # 1. Base Query
    docs = Document.objects.filter(expiry_date__isnull=False)
    
    # 2. Apply "Smart Filters" on DB Level (Much Faster)
    if status == 'critical':
        # 0 to 20 days
        limit_date = today + timedelta(days=20)
        docs = docs.filter(expiry_date__gte=today, expiry_date__lte=limit_date)
    elif status == 'upcoming':
        # 21 to 60 days
        start_date = today + timedelta(days=21)
        end_date = today + timedelta(days=60)
        docs = docs.filter(expiry_date__gte=start_date, expiry_date__lte=end_date)
    else:
        # Default: Show everything in next 60 days
        limit_date = today + timedelta(days=60)
        docs = docs.filter(expiry_date__gte=today, expiry_date__lte=limit_date)

    # 3. Sort by soonest expiry
    docs = docs.order_by('expiry_date')

    # 4. Paginate
    paginator = Paginator(docs, limit)
    if page < 1: page = 1
    current_page = paginator.get_page(page)
    
    # 5. Build Response (Only generate S3 links for these 10 items!)
    alerts = []
    for d in current_page.object_list:
        days_left = (d.expiry_date - today).days
        
        # Determine status string dynamically
        if 0 <= days_left <= 20:
            alert_status = "Critical 🚨"
        elif 21 <= days_left <= 60:
            alert_status = "Reminder 📅"
        else:
            alert_status = "Healthy"

        alerts.append({
            "id": d.id,
            "title": d.title,
            "category": d.category,
            "expiry_date": d.expiry_date,
            "days_remaining": days_left,
            "status": alert_status,
            "file_url": generate_presigned_viewable_url(d.s3_key) 
        })
        
    return {
        "data": alerts,
        "total": paginator.count,
        "page": page,
        "limit": limit,
        "total_pages": paginator.num_pages
    }