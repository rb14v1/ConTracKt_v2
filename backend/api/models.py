# api/models.py
from django.db import models
from pgvector.django import VectorField, HnswIndex
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex

class Document(models.Model):
    # Enforcing strict categories keeps your data clean
    CATEGORY_CHOICES = [
        ('employee_contracts', 'Employee Contracts'),
        ('nda', 'NDA'),
        ('loan_agreements', 'Loan Agreements'),
        ('general', 'General/Others'),
    ]

    title = models.CharField(max_length=255)
    s3_key = models.CharField(max_length=1024)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    total_pages = models.IntegerField(default=0)
    
    # 🔥 NEW: The filter tag (Indexed for speed)
    category = models.CharField(
        max_length=50, 
        choices=CATEGORY_CHOICES, 
        default='general',
        db_index=True # <--- CRITICAL for efficient filtering
    )
    
    effective_date = models.DateField(null=True, blank=True, db_index=True)
    expiry_date = models.DateField(null=True, blank=True, db_index=True)
    
    def __str__(self):
        return f"[{self.category}] {self.title}"

class DocumentChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.IntegerField()
    text_content = models.TextField()
    
    embedding = VectorField(dimensions=1024) 
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
            GinIndex(fields=['search_vector'], name='keyword_idx'),
        ]