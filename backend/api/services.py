# api/services.py
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
import json
import os
from django.conf import settings
from pgvector.django import CosineDistance
from .models import DocumentChunk

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
    1. Answer the user's question accurately.
    2. STRICTLY SEPARATE your answer by the Document Title found in the [[SOURCE]] tag.
    3. Use this EXACT format:

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

    try:
        # 2. Call Bedrock
        print(f"DEBUG: Sending query to Llama 3... (Length: {len(prompt)})")
        
        response = bedrock_client.invoke_model(
            modelId="meta.llama3-70b-instruct-v1:0",
            body=json.dumps(body)
        )
        
        # 3. Read Response
        response_body = json.loads(response['body'].read())
        print("DEBUG: Raw Bedrock Response:", response_body) # <--- THIS WILL REVEAL THE TRUTH
        
        # 4. Extract Answer
        # Llama 3 on Bedrock returns key 'generation'
        answer = response_body.get('generation', '')
        
        if not answer:
            return "Error: LLM returned empty response. Check server logs."
            
        return answer.strip()

    except Exception as e:
        print(f"CRITICAL ERROR in call_llm: {str(e)}")
        return f"Error calling LLM: {str(e)}"
    
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