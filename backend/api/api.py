# api/api.py
from ninja import NinjaAPI, File, UploadedFile
from django.shortcuts import get_object_or_404
from django.contrib.postgres.search import SearchVector
from .models import Document, DocumentChunk
from .schemas import ChatIn, ChatOut, DocumentOut
from .services import search_hybrid, get_embedding, call_llm, create_presigned_url, determine_search_depth
from pypdf import PdfReader
import time


api = NinjaAPI(title="ConTracKt AI API")

@api.post("/upload", response=DocumentOut)
def upload_document(request, file: UploadedFile = File(...)):
    """
    1. Uploads PDF to S3
    2. Extracts text
    3. Chunks & Embeds into PGVector
    """
    start_time = time.time()
    if file.size > 10 * 1024 * 1024:
        raise ValueError("File too large. Maximum size is 10MB.")
    # A. Read PDF (Ideally, move this to Celery for large files)
    pdf_reader = PdfReader(file.file)
    file_content = file.file.read() # Read binary for S3
    
    # B. Save Parent Record
    doc = Document.objects.create(
        title=file.name,
        s3_key=f"uploads/{file.name}",
        total_pages=len(pdf_reader.pages)
    )
    
    # C. Chunking & Embedding Loop
    # (Simple page-level chunking for speed)
    chunks_to_create = []
    
    for i, page in enumerate(pdf_reader.pages):
        text = page.extract_text()
        if len(text) > 50: # Ignore empty pages
            vec = get_embedding(text) # Call AWS Titan
            
            chunks_to_create.append(DocumentChunk(
                document=doc,
                chunk_index=i + 1,
                text_content=text,
                embedding=vec
            ))
            
    # D. Bulk Insert (Much faster than loop save)
    DocumentChunk.objects.bulk_create(chunks_to_create)
    
    # E. UPDATE SEARCH VECTORS (The Hybrid Step)
    # We trigger a fast SQL update to populate the keyword index
    DocumentChunk.objects.filter(document=doc).update(
        search_vector=SearchVector('text_content')
    )
    
    return doc

MAX_CONTEXT_CHARS = 50000

@api.post("/chat", response=ChatOut)
async def chat_endpoint(request, payload: ChatIn):
    start = time.time()
    from asgiref.sync import sync_to_async
    
    # 1. DYNAMIC DEPTH ANALYSIS
    # Ask LLM how deep we need to dig (Returns e.g., 10, 20, or 60)
    k_value = await sync_to_async(determine_search_depth)(payload.query)
    print(f"🧠 Query Intent Analysis: Retrieving Top-{k_value} chunks.")
    
    # 2. HYBRID SEARCH (OVERSAMPLING)
    # We fetch 3x the required chunks. Why? Because if Doc A has 50 matches and Doc B has 1,
    # a standard search might fill up with only Doc A. We need extra candidates for diversity.
    raw_results = await sync_to_async(search_hybrid)(
        payload.query, 
        top_k=k_value * 3
    )
    
    # 3. DIVERSITY RE-RANKING (The Fix for "Missed Files")
    # Goal: Ensure every matching document gets at least one slot in the context.
    # Logic: Group chunks by Document -> Pick 1 from A, 1 from B, 1 from C -> Repeat.
    
    grouped_results = {}
    for res in raw_results:
        title = res.document.title
        if title not in grouped_results:
            grouped_results[title] = []
        grouped_results[title].append(res)
        
    final_context_list = []
    has_more_chunks = True
    
    # Round-Robin Selection Loop
    while has_more_chunks and len(final_context_list) < k_value:
        has_more_chunks = False
        # Sort keys to ensure deterministic order
        for title in sorted(grouped_results.keys()):
            if grouped_results[title]:
                # Take the highest scoring remaining chunk from this doc
                chunk = grouped_results[title].pop(0)
                final_context_list.append(chunk)
                has_more_chunks = True
                
                if len(final_context_list) >= k_value:
                    break
    
    # 4. CONTEXT CONSTRUCTION (With Safety Pruning)
    context_chunks = []
    current_char_count = 0
    
    for c in final_context_list:
        # Tag content so LLM knows where it came from
        chunk_text = f"[[SOURCE: {c.document.title}]]\n{c.text_content}\n\n"
        chunk_len = len(chunk_text)
        
        # STOP if we exceed the safety limit (e.g. 50,000 chars)
        if current_char_count + chunk_len > MAX_CONTEXT_CHARS:
            print(f"⚠️ Context limit ({MAX_CONTEXT_CHARS}) reached. Pruning remaining chunks.")
            continue
            
        context_chunks.append(chunk_text)
        current_char_count += chunk_len

    context_str = "".join(context_chunks)
    
    # 5. CALL LLM
    answer = await sync_to_async(call_llm)(context_str, payload.query)
    
    # 6. FORMAT SOURCES
    # We return sources for ALL chunks we actually used (final_context_list)
    seen_urls = set()
    sources = []
    for res in final_context_list:
        unique_key = f"{res.document.title}-{res.chunk_index}"
        if unique_key not in seen_urls:
            sources.append({
                "title": res.document.title, 
                "page": res.chunk_index, 
                "score": getattr(res, 'score', 0.0), 
                "file_url": create_presigned_url(res.document.s3_key)
            })
            seen_urls.add(unique_key)
    
    return {
        "answer": answer,
        "sources": sources,
        "processing_time": time.time() - start
    }