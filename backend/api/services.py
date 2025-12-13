# api/services.py
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import json
import os
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import F
from django.conf import settings
from pgvector.django import CosineDistance
from .models import DocumentChunk
import re

# 1. Initialize AWS Clients
my_config = Config(
    region_name=os.getenv('AWS_REGION_NAME'),
    signature_version='s3v4',
    retries={'max_attempts': 3}
)

session = boto3.Session(
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_REGION_NAME', 'us-east-1')
)

s3_client = session.client('s3', config=my_config)
bedrock_client = session.client('bedrock-runtime')

# --- Helper Functions ---

def upload_to_s3(file_obj, filename):
    """
    Uploads a file object to S3.
    """
    # Ensure cursor is at the start
    clean_filename = filename.replace(" ", "_").replace("(", "").replace(")", "")
    
    file_obj.seek(0)
    s3_key = f"uploads/{clean_filename}"
    
    s3_client.upload_fileobj(
        file_obj, 
        settings.AWS_S3_BUCKET_NAME, 
        s3_key
    )
    return s3_key

def get_embedding(text: str) -> list:
    """
    Generates vector embedding using Amazon Titan v2.
    """
    # Start with a clean/truncated text to avoid token limits
    cleaned_text = text[:8000] 
    
    response = bedrock_client.invoke_model(
        modelId="amazon.titan-embed-text-v2:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps({
            "inputText": cleaned_text,
            "dimensions": 1024,
            "normalize": True
        })
    )
    body = json.loads(response['body'].read())
    return body['embedding']

def search_vector_db(query_text: str, top_k: int = 5):
    """
    Semantically searches the Postgres DB using pgvector
    """
    query_vec = get_embedding(query_text)
    
    # FIX IS HERE: .select_related('document')
    # This fetches the Document title immediately, preventing the async error later.
    results = DocumentChunk.objects.select_related('document').annotate(
        distance=CosineDistance('embedding', query_vec)
    ).order_by('distance')[:top_k]
    
    return results


def search_hybrid(query_text: str, top_k: int = 15):
    """
    Performs Hybrid Search with RRF Fusion
    """
    # 1. Run Vector Search
    vector_results = search_vector_db(query_text, top_k=20)
    
    # 2. Run Keyword Search
    keyword_results = DocumentChunk.objects.annotate(
        rank=SearchRank(F('search_vector'), SearchQuery(query_text))
    ).filter(rank__gt=0).order_by('-rank')[:20]

    # 3. Apply Reciprocal Rank Fusion (RRF)
    k_constant = 60
    rrf_scores = {}

    for rank, item in enumerate(vector_results):
        if item.id not in rrf_scores: rrf_scores[item.id] = 0
        rrf_scores[item.id] += 1 / (k_constant + rank + 1)

    for rank, item in enumerate(keyword_results):
        if item.id not in rrf_scores: rrf_scores[item.id] = 0
        rrf_scores[item.id] += 1 / (k_constant + rank + 1)

    # 4. Sort IDs by Score
    sorted_ids = sorted(rrf_scores, key=rrf_scores.get, reverse=True)[:top_k]

    # 5. Fetch Objects & ATTACH SCORES (The Fix)
    candidates = DocumentChunk.objects.filter(id__in=sorted_ids).select_related('document')
    candidate_map = {c.id: c for c in candidates}
    
    final_results = []
    for _id in sorted_ids:
        if _id in candidate_map:
            chunk = candidate_map[_id]
            # --- CRITICAL FIX: Attach the score dynamically ---
            chunk.score = rrf_scores[_id] 
            final_results.append(chunk)

    return final_results

# api/services.py (Update this function)

def call_llm(context_text: str, user_query: str) -> str:
    """
    Calls the LLM (Llama 3 70B via Bedrock)
    """
    # 1. Improved Llama 3 Prompt Format
    # Llama 3 expects strict <|begin_of_text|>... formatting
    prompt = f"""
    <|begin_of_text|><|start_header_id|>system<|end_header_id|>
    You are an expert AI analyst. 
    You have been provided with context chunks from various documents. 
    Each chunk starts with a tag like [[SOURCE: filename.pdf]].
    
    INSTRUCTIONS:
    1. Answer the user's question accurately based ONLY on the provided context.
    2. STRICTLY SEPARATE your answer by the Document Title found in the [[SOURCE]] tag.
    3. CRITICAL: If a document does not contain the answer, DO NOT LIST IT. Do not write "No information available" or "Not mentioned". Just skip it entirely.
    4. Use this EXACT format for documents that have an answer:

    ### SOURCE: [Insert Exact Filename from tag]
    [Write the answer derived from this document]

    ### SOURCE: [Insert Next Filename]
    [Write answer...]

    If a document does not contain the answer, do not list it.

    Context:
    {context_text}
    <|eot_id|><|start_header_id|>user<|end_header_id|>
    {user_query}
    <|eot_id|><|start_header_id|>assistant<|end_header_id|>
    """

    body = {
        "prompt": prompt,
        "max_gen_len": 2048,
        "temperature": 0.1,
        "top_p": 0.9
    }
    total_input = len(context_text) + len(user_query)
    print(f"DEBUG: Total Input Chars: {total_input}")
    
    try:
        response = bedrock_client.invoke_model(
            modelId="meta.llama3-70b-instruct-v1:0",
            body=json.dumps(body)
        )
        response_body = json.loads(response['body'].read())
        answer = response_body.get('generation', '')

        print(f"DEBUG: Sending query to Llama 3... (Length: {len(prompt)})")
        # --- FALLBACK RETRY LOGIC ---
        segments = re.split(r'(### SOURCE: .*)', answer)
        clean_segments = []
        
        # 2. Filter out "No info" blocks
        current_header = ""
        for seg in segments:
            if seg.startswith("### SOURCE:"):
                current_header = seg
            else:
                text_body = seg.strip()
                # Dynamic Check: Look for the specific tag OR extreme brevity
                is_empty = any(phrase in text_body for phrase in [
                    "no information available", 
                    "not mentioned", 
                    "does not contain", 
                    "no specific information",
                    "not provided in this document"
                ])
                is_empty_tag = "[[EMPTY]]" in text_body
                is_too_short = len(text_body) < 10 # "No info" is usually short
                
                if current_header and text_body and not is_empty_tag and not is_empty and not is_too_short:
                    clean_segments.append(current_header)
                    clean_segments.append(seg)
                current_header = ""

        answer = "".join(clean_segments).strip()
        if not answer:
            print("⚠️ Empty response from LLM. Retrying with shorter context...")
            # Retry with HALF the context
            half_context = context_text[:len(context_text)//2]
            
            # Re-construct prompt with half context
            retry_prompt = f"""
            <|begin_of_text|><|start_header_id|>system<|end_header_id|>
            (Instructions...)
            Context: {half_context}
            <|eot_id|><|start_header_id|>user<|end_header_id|>
            {user_query}
            <|eot_id|><|start_header_id|>assistant<|end_header_id|>
            """
            
            body['prompt'] = retry_prompt
            response = bedrock_client.invoke_model(
                modelId="meta.llama3-70b-instruct-v1:0",
                body=json.dumps(body)
            )
            response_body = json.loads(response['body'].read())
            answer = response_body.get('generation', '')
            
            if not answer:
                return "Error: The query and documents are too large for the model to process at once. Please ask a more specific question."

        return answer.strip()

    except Exception as e:
        print(f"CRITICAL ERROR in call_llm: {str(e)}")
        print(f"LLM Error: {str(e)}")
        return f"Error calling LLM: \n System is currently overloaded. Please try again.{str(e)}"
    
def create_presigned_url(object_key: str, expiration: int = 3600) -> str:
    """
    Generates a temporary, viewable (pre-signed) URL.
    Adapted to work with the 's3_key' stored in Postgres.
    """
    # 1. Validation
    if not object_key:
        print(f"⚠️ Cannot generate pre-signed URL: Key is missing.")
        return None

    # 2. Check S3 Client
    # We use the global 's3_client' we initialized at the top of services.py
    if s3_client is None:
        print(f"FATAL: S3 client is not initialized.")
        return None

    try:
        # 3. Generate the pre-signed URL
        # We use the bucket from settings, and the key from the DB
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': settings.AWS_S3_BUCKET_NAME, 
                'Key': object_key
            },
            ExpiresIn=expiration
        )
        return url
        
    except ClientError as e:
        print(f"❌ Failed to generate pre-signed URL for {object_key}. Error: {e}")
        return None
    except Exception as e:
        print(f"❌ An unexpected error occurred generating pre-signed URL: {e}")
        return None
    
def determine_search_depth(user_query: str) -> int:
    """
    Uses LLM to dynamically decide how many chunks to retrieve.
    Returns an integer (e.g., 5, 20, 50).
    """
    prompt = f"""
    <|begin_of_text|><|start_header_id|>system<|end_header_id|>
    You are a Search Optimization Engine. Analyze the user's query and output ONLY a single integer representing the optimal number of document chunks ('top_k') to retrieve.

    RULES:
    - If the query seeks a specific fact (e.g., "What is the date?", "Who is..."), output 10.
    - If the query asks for a comparison (e.g., "Compare X and Y"), output 25.
    - If the query is broad, exhaustive, or asks for lists/summaries across many files (e.g., "List all...", "Find every...", "Summary of agreements"), output 60.
    
    Output ONLY the integer. No text.
    <|eot_id|><|start_header_id|>user<|end_header_id|>
    {user_query}
    <|eot_id|><|start_header_id|>assistant<|end_header_id|>
    """

    body = {
        "prompt": prompt,
        "max_gen_len": 10, # We only need a number
        "temperature": 0.0 # Deterministic
    }

    try:
        response = bedrock_client.invoke_model(
            modelId="meta.llama3-70b-instruct-v1:0",
            body=json.dumps(body)
        )
        response_body = json.loads(response['body'].read())
        answer = response_body.get('generation', '').strip()
        
        # Extract number safely
        import re
        match = re.search(r'\d+', answer)
        if match:
            k = int(match.group())
            # Safety bounds
            return max(5, min(k, 100))
        return 20 # Default fallback
        
    except Exception as e:
        print(f"⚠️ Intent Error: {e}")
        return 20 # Safe fallback    