# api/models.py
from django.db import models
from pgvector.django import VectorField, HnswIndex

class Document(models.Model):
    """The Parent: Stores file metadata"""
    title = models.CharField(max_length=255)
    s3_key = models.CharField(max_length=1024) # Path in S3
    uploaded_at = models.DateTimeField(auto_now_add=True)
    total_pages = models.IntegerField(default=0)
    
    def __str__(self):
        return self.title

class DocumentChunk(models.Model):
    """The Child: Stores text and embeddings"""
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.IntegerField()
    text_content = models.TextField()
    
    # 1024 is the dimension for Amazon Titan v2 Embeddings. 
    # If using Cohere, change to 1024 (v3-english) or appropriate size.
    embedding = VectorField(dimensions=1024) 

    class Meta:
        indexes = [
            # USE THIS instead of models.Index
            HnswIndex(
                name='cosine_idx',
                fields=['embedding'],
                m=16,
                ef_construction=64,
                opclasses=['vector_cosine_ops']
            )
        ]