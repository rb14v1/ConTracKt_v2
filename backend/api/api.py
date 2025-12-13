# api/api.py
from ninja import NinjaAPI, File, UploadedFile
from django.shortcuts import get_object_or_404
from django.contrib.postgres.search import SearchVector
from .models import Document, DocumentChunk
from .schemas import ChatIn, ChatOut, DocumentOut
from .services import search_hybrid, get_embedding, search_vector_db, call_llm, create_presigned_url
from pypdf import PdfReader
import time
import io
import tiktoken


api = NinjaAPI(title="RAG AI API")

@api.post("/upload", response=DocumentOut)
def upload_document(request, file: UploadedFile = File(...)):
    """
    1. Uploads PDF to S3
    2. Extracts text
    3. Chunks & Embeds into PGVector
    """
    start_time = time.time()
    
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
    
    k_value = 20
    # 1. INCREASE TOP_K to 8 or 10
    # Why? To ensure we catch chunks from ALL documents, not just the first two matches.
    search_results = await sync_to_async(search_hybrid)(
        payload.query, 
        top_k=k_value
    )
    
    # 2. CONTEXT INJECTION (The Silver Bullet)
    # We must explicitly tell the LLM: "This text comes from File X"
    context_chunks = []
    current_char_count = 0
    
    # 1. Sort results by relevance score (Highest first)
    # This ensures we keep the BEST facts if we run out of space
    sorted_results = sorted(search_results, key=lambda x: getattr(x, 'score', 0), reverse=True)
    for c in sorted_results:
        chunk_text = f"[[SOURCE: {c.document.title}]]\n{c.text_content}\n\n"
        chunk_len = len(chunk_text)
        
        # 2. Check if adding this chunk exceeds our limit
        if current_char_count + chunk_len > MAX_CONTEXT_CHARS:
            print(f"⚠️ Context limit reached. Dropping lower ranked chunk from {c.document.title}")
            continue # Skip this chunk, try the next (or break)
            
        context_chunks.append(chunk_text)
        current_char_count += chunk_len

    # 3. Join the pruned context
    context_str = "".join(context_chunks)
    
    # 3. Call LLM
    answer = await sync_to_async(call_llm)(context_str, payload.query)
    
    # 4. Format Sources
    seen_urls = set()
    sources = []
    for res in search_results:
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