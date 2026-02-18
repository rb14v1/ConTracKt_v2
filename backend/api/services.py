# api/services.py
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import json
import os
from datetime import datetime
from urllib.parse import urlparse
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import F
from django.conf import settings
from pgvector.django import CosineDistance
from .models import DocumentChunk
import re
from openai import AzureOpenAI

# --- 1. S3 CLIENT HELPER (Standard & Secure) ---
def get_s3_client():
    """
    Initializes and returns a fresh S3 client using Django Settings.
    Removed explicit s3v4 config to allow Boto3 to auto-negotiate the correct signature.
    """
    try:
        return boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION_NAME
            # REMOVED: config=Config(signature_version='s3v4') 
        )
    except AttributeError:
        print("❌ ERROR: Missing AWS credentials in settings.py")
        raise
    except Exception as e:
        print(f"❌ ERROR: Could not connect to S3: {e}")
        raise e
    
# --- 2. ROBUST UPLOAD FUNCTION ---
def upload_contract_to_s3(file_buffer, bucket_name: str, file_key: str, content_type: str = 'application/pdf'):
    """
    Uploads a file buffer to S3.
    """
    s3 = get_s3_client()

    # Reset cursor to start of file
    file_buffer.seek(0)

    try:
        s3.upload_fileobj(
            Fileobj=file_buffer,
            Bucket=bucket_name,
            Key=file_key,
            ExtraArgs={'ContentType': content_type}
        )

        # Return the S3 URI
        s3_uri = f"s3://{bucket_name}/{file_key}"
        return s3_uri

    except ClientError as e:
        print(f"❌ S3 Upload Failed: {e}")
        raise e
    except Exception as e:
        print(f"❌ Unexpected Upload Error: {e}")
        raise e

# --- 3. SMART PRESIGNED URL GENERATOR (Backward Compatible) ---
def generate_presigned_viewable_url(s3_url_or_key: str, expiration: int = 3600) -> str:
    """
    Generates a https:// link. 
    Handles BOTH new s3:// URIs AND old 'uploads/file.pdf' keys.
    """
    if not s3_url_or_key:
        return None

    try:
        s3 = get_s3_client()
        bucket_name = settings.AWS_S3_BUCKET_NAME

        # LOGIC: Check if it's a full S3 URI or just a Key
        if s3_url_or_key.startswith('s3://'):
            # New Format: Parse it
            parsed = urlparse(s3_url_or_key)
            bucket = parsed.netloc
            key = parsed.path.lstrip('/')
        else:
            # Old/Legacy Format: Treat input as the Key directly
            bucket = bucket_name
            key = s3_url_or_key

        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=expiration
        )
        return url
        
    except Exception as e:
        print(f"❌ Presigned URL Error for '{s3_url_or_key}': {e}")
        return None

# --- 4. BEDROCK & LLM CLIENTS ---

# Initialize Bedrock using Settings
bedrock_client = boto3.client(
    'bedrock-runtime',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION_NAME
)
        
# --- Helper Functions ---

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

def search_vector_db(query_text: str, top_k: int = 5, category_filter: str = None, doc_ids: list[int] = None):
    """
    Search Logic Hierarchy:
    1. doc_ids (Strict)
    2. category (Scoped)
    3. All (Global)
    """
    query_vec = get_embedding(query_text)
    
    qs = DocumentChunk.objects.select_related('document')
    
    # 🔥 RULE 1 & 2: If doc_ids exist, search ONLY these. Ignore Category.
    if doc_ids and len(doc_ids) > 0:
        qs = qs.filter(document_id__in=doc_ids)
        
    # 🔥 RULE 3: No doc_ids, but Category exists -> Search Category.
    elif category_filter and category_filter != 'all':
        qs = qs.filter(document__category=category_filter)
        
    # 🔥 RULE 4: Neither exists -> Search All (No filter applied)

    results = qs.annotate(
        distance=CosineDistance('embedding', query_vec)
    ).order_by('distance')[:top_k]
    
    return results


def search_hybrid(query_text: str, top_k: int = 15, category_filter: str = None, doc_ids: list[int] = None):
    """
    Hybrid Search honoring the same hierarchy
    """
    # 1. Run Vector Search (Passes strict logic down)
    vector_results = search_vector_db(query_text, top_k=20, category_filter=category_filter, doc_ids=doc_ids)
    
    # 2. Run Keyword Search (Apply SAME strict logic)
    keyword_qs = DocumentChunk.objects.select_related('document').annotate(
        rank=SearchRank(F('search_vector'), SearchQuery(query_text))
    )
    
    # Apply exactly the same filters to keywords
    if doc_ids and len(doc_ids) > 0:
        keyword_qs = keyword_qs.filter(document_id__in=doc_ids)
    elif category_filter and category_filter != 'all':
        keyword_qs = keyword_qs.filter(document__category=category_filter)
        
    keyword_results = keyword_qs.filter(rank__gt=0).order_by('-rank')[:20]

    # ... (RRF Logic below remains exactly the same) ...
    k_constant = 60
    rrf_scores = {}

    for rank, item in enumerate(vector_results):
        if item.id not in rrf_scores: rrf_scores[item.id] = 0
        rrf_scores[item.id] += 1 / (k_constant + rank + 1)

    for rank, item in enumerate(keyword_results):
        if item.id not in rrf_scores: rrf_scores[item.id] = 0
        rrf_scores[item.id] += 1 / (k_constant + rank + 1)

    sorted_ids = sorted(rrf_scores, key=rrf_scores.get, reverse=True)[:top_k]

    candidates = DocumentChunk.objects.filter(id__in=sorted_ids).select_related('document')
    candidate_map = {c.id: c for c in candidates}
    
    final_results = []
    for _id in sorted_ids:
        if _id in candidate_map:
            chunk = candidate_map[_id]
            chunk.score = rrf_scores[_id] 
            final_results.append(chunk)

    return final_results
        
# --- NEW: Dedicated LLM Client Setup ---
# Initialize a separate session for the LLM using the new specific keys
azure_client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_END_POINT"), 
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),  
    api_version="2024-12-01-preview" # Use the latest stable version available in your portal
)

# CRITICAL: This must match the name you typed when you deployed the model in Azure Portal
# e.g., "gpt-5-deployment" or "my-gpt-model"
DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME") 

def call_llm(context_text: str, user_query: str) -> str:
    # 1. TIME INJECTION
    current_date = datetime.now().strftime("%A, %B %d, %Y")
    
    """
    Calls Azure OpenAI (GPT Chat Model)
    """
    
    # 2. System Prompt (Cleaned up for Chat API)
    # We don't need the <|begin_of_text|> tags anymore; the Chat API handles roles natively.
    system_instruction = f"""
    You are an expert AI analyst. 
    Current Date: {current_date}
    
    INSTRUCTIONS:
    1. PRIMARY GOAL: Answer the user's question accurately based on the provided context.
    
    2. HANDLING GREETINGS vs UNKNOWN INFO:
       - If user greets ("Hi", "Hello"):
         HEADER: ### SOURCE: General Analysis
         REASON: [[REASON: Greeting]]
         ANSWER: Hello! I am ready to analyze your documents.
         
       - If question is NOT in context:
         HEADER: ### SOURCE: General Analysis
         REASON: [[REASON: Outside of knowledge base]]
         ANSWER: I apologize, but I cannot find information regarding that topic in your uploaded documents.

    3. DOCUMENT ANSWERS (Strict Format):
       ### SOURCE: [Insert Exact Filename from tag]
       [[REASON: two apt reasoning for the user query...]]
       [Answer derived from this document]

    CRITICAL: 
    - If a document is irrelevant, DO NOT LIST IT.
    - If no info is found:
      ### SOURCE: General Analysis
      [[REASON: Context missing]]
      I apologize, but I couldn't find specific information regarding that in the uploaded documents.
    """

    # 3. Message Construction
    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": f"Context:\n{context_text}\n\nQuestion: {user_query}"}
    ]

    try:
        response = azure_client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=messages,
            temperature=0.1,
            max_tokens=2048,
            top_p=0.9
        )
        
        answer = response.choices[0].message.content.strip()

        # --- FALLBACK RETRY LOGIC (Same as before but adapted) ---
        # If response is empty, retry with half context
        if not answer:
            print("⚠️ Empty response from Azure. Retrying with shorter context...")
            half_context = context_text[:len(context_text)//2]
            
            messages[1]['content'] = f"Context:\n{half_context}\n\nQuestion: {user_query}"
            
            response = azure_client.chat.completions.create(
                model=DEPLOYMENT_NAME,
                messages=messages,
                temperature=0.1,
                max_tokens=2048
            )
            answer = response.choices[0].message.content.strip()
            
            if not answer:
                return "Error: The query and documents are too large for the model to process at once. Please ask a more specific question."

        return answer

    except Exception as e:
        print(f"CRITICAL ERROR in call_llm (Azure): {str(e)}")
        return f"Error calling AI: System is currently overloaded. {str(e)}"


def determine_search_depth(user_query: str) -> int:
    """
    Scalable Search Depth:
    1. Gets real-time DB size.
    2. Uses LLM to classify intent (Lookup vs. Compare vs. Summary).
    3. Python calculates the safe 'top_k' count dynamically.
    """
    
    # 1. Get "Live" Scale of your Data
    # specific to the user's filtered view if possible, but global count is a good baseline
    total_chunks = DocumentChunk.objects.count() 
    
    # If DB is empty/small, just return a safe default
    if total_chunks < 10:
        return 5

    # 2. Ask LLM for INTENT only (Cheaper & More Accurate)
    system_instruction = """
    Classify the user's query into one of three categories:
    1. LOOKUP (Specific fact, date, name, single clause)
    2. COMPARE (Comparing two or more items, differences, similarities)
    3. SUMMARY (Broad questions, "List all", "Summarize", "Overview of...")
    
    Output ONLY the category name.
    """

    try:
        response = azure_client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_query}
            ],
            temperature=0.0,
            max_tokens=10 # Very cheap, very fast
        )
        
        intent = response.choices[0].message.content.strip().upper()
        
        # 3. Dynamic Math Logic (The "Smart" Part)
        if "LOOKUP" in intent:
            # We only need the best few matches
            return 8 
            
        elif "COMPARE" in intent:
            # Need a moderate amount to cover both sides
            return 25 
            
        elif "SUMMARY" in intent:
            # 🔥 DYNAMIC CALCULATION:
            # Strategy: Grab 15% of the DB, but enforce safety caps.
            # - Min: 50 (Ensure we have enough to summarize)
            # - Max: 250 (Prevent LLM Context Overflow/Crash)
            
            calculated_k = int(total_chunks * 0.15) 
            return max(50, min(calculated_k, 250))
            
        else:
            return 15 # Default fallback

    except Exception as e:
        print(f"⚠️ Intent Error (Azure): {e}")
        return 15
    

def extract_dates_from_text(text_sample: str) -> dict:
    """
    Asks LLM to find effective and expiry dates in the text.
    Returns JSON: {"effective_date": "YYYY-MM-DD", "expiry_date": "YYYY-MM-DD"}
    """
    system_instruction = """
    You are a Data Extraction Bot. Analyze the contract text and extract:
    1. Effective Date (Start Date)
    2. Expiration Date (End Date / Due Date)

    Output STRICT JSON only:
    {
      "effective_date": "YYYY-MM-DD" or null,
      "expiry_date": "YYYY-MM-DD" or null
    }
    
    RULES:
    - If the contract says "1 year from effective date", calculate it if possible, otherwise null.
    - If date is ambiguous, return null.
    - Do NOT output markdown or explanations. Just the JSON object.
    """

    try:
        response = azure_client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": f"Extract dates from this contract snippet:\n\n{text_sample}"}
            ],
            temperature=0.0, # Strict deterministic output
            max_tokens=100,
            response_format={ "type": "json_object" } # Force JSON mode (avail in newer Azure models)
        )
        
        data = json.loads(response.choices[0].message.content)
        return data
    except Exception as e:
        print(f"⚠️ Date Extraction Failed: {e}")
        return {"effective_date": None, "expiry_date": None}    