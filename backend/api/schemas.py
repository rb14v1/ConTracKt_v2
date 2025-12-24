# api/schemas.py
from ninja import Schema
from typing import List, Optional
from datetime import datetime, date
from enum import Enum

class CategoryEnum(str, Enum):
    EMPLOYEE_CONTRACTS = "employee_contracts"
    NDA = "nda"
    LOAN_AGREEMENTS = "loan_agreements"
    GENERAL = "general"
    
class DocumentOut(Schema):
    id: int
    title: str
    category: str # <--- Return this so UI knows what it is
    uploaded_at: datetime
    total_pages: int
    effective_date: Optional[date] = None
    expiry_date: Optional[date] = None
    file_url: Optional[str] = None

class ChatIn(Schema):
    query: str
    category_filter: Optional[CategoryEnum] = None # <--- Optional filter for the user
    doc_ids: Optional[List[int]] = None

class SourceNode(Schema):
    title: str
    page: int
    score: float
    file_url: Optional[str] = None
    snippet: Optional[str] = None
    reason: Optional[str] = None

class ChatOut(Schema):
    answer: str
    sources: List[SourceNode]
    processing_time: float

class AlertOut(Schema):
    id: int
    title: str
    category: str
    expiry_date: Optional[date]
    days_remaining: int
    status: str  # 'Critical' (0-20) or 'Upcoming' (21-60) 