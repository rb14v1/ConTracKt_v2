# api/services.py
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import json
import os
from datetime import datetime
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import F
from django.conf import settings
from pgvector.django import CosineDistance
from .models import DocumentChunk
import re
from openai import AzureOpenAI

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
    
# --- NEW: Dedicated LLM Client Setup ---
# Initialize a separate session for the LLM using the new specific keys
azure_client = AzureOpenAI(
    azure_endpoint=os.getenv("AZURE_OPENAI_END_POINT"), 
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),  
    api_version="2024-12-01-preview" # Use the latest stable version available in your portal
)

# CRITICAL: This must match the name you typed when you deployed the model in Azure Portal
# e.g., "gpt-5-deployment" or "my-gpt-model"
DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-5") 

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
       [[REASON: one sentence reasoning...]]
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
    Uses Azure OpenAI to dynamically decide retrieval depth.
    """
    system_instruction = """
    You are a Search Optimization Engine. Analyze the user's query and output ONLY a single integer representing the optimal number of document chunks ('top_k') to retrieve.

    RULES:
    - If the query seeks a specific fact (e.g., "What is the date?", "Who is..."), output 10.
    - If the query asks for a comparison (e.g., "Compare X and Y"), output 25.
    - If the query is broad, exhaustive, or asks for lists (e.g., "List all...", "Summary of..."), output 600.
    
    Output ONLY the integer. No text.
    """

    try:
        response = azure_client.chat.completions.create(
            model=DEPLOYMENT_NAME,
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": user_query}
            ],
            temperature=0.0, # Deterministic
            max_tokens=10
        )
        
        answer = response.choices[0].message.content.strip()
        
        # Extract number safely
        match = re.search(r'\d+', answer)
        if match:
            k = int(match.group())
            return max(5, min(k, 1000))
        return 20 
        
    except Exception as e:
        print(f"⚠️ Intent Error (Azure): {e}")
        return 20