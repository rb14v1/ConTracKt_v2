# api/schemas.py
from ninja import Schema
from typing import List, Optional
from datetime import datetime

class DocumentOut(Schema):
    """Schema for listing uploaded documents"""
    id: int
    title: str
    uploaded_at: datetime
    total_pages: int

class ChatIn(Schema):
    """Schema for user question"""
    query: str
    
class SourceNode(Schema):
    """Sub-schema for citing sources"""
    title: str
    page: int
    score: float # Similarity score
    file_url: Optional[str] = None
    snippet: Optional[str] = None
    reason: Optional[str] = None

class ChatOut(Schema):
    """Schema for AI response"""
    answer: str
    sources: List[SourceNode]
    processing_time: float