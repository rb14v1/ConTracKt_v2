# api/models.py
from django.db import models
from pgvector.django import VectorField, HnswIndex
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex

class Document(models.Model):
    """The Parent: Stores file metadata"""
    title = models.CharField(max_length=255)
    s3_key = models.CharField(max_length=1024) # Path in S3
    uploaded_at = models.DateTimeField(auto_now_add=True)
    total_pages = models.IntegerField(default=0)
    
    def __str__(self):
        return self.title

class DocumentChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.IntegerField()
    text_content = models.TextField()
    
    embedding = VectorField(dimensions=1024) 
    
    # 1. ADD THIS FIELD (Stores keyword tokens)
    search_vector = SearchVectorField(null=True)

    class Meta:
        indexes = [
            HnswIndex(
                name='cosine_idx',
                fields=['embedding'],
                m=16,
                ef_construction=64,
                opclasses=['vector_cosine_ops']
            ),
            # 2. ADD THIS INDEX (Makes keyword search fast)
            GinIndex(fields=['search_vector'], name='keyword_idx'),
        ]