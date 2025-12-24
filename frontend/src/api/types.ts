// src/api/types.ts
export interface Source {
  title: string;
  page: number;
  score: number;
  file_url: string | null;
  snippet?: string;
  reason?: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  processing_time: number;
}

// Define the payload type
export interface ChatPayload {
    query: string;
    category_filter?: string;
    doc_ids?: number[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
}

// List View & Alerts
export interface Document {
  id: number;
  title: string;
  category: string;
  uploaded_at: string;
  total_pages: number;
  effective_date?: string;
  expiry_date?: string;
  file_url?: string; // The presigned URL from backend
}

export interface Alert {
  id: number;
  title: string;
  category: string;
  expiry_date: string; // YYYY-MM-DD
  days_remaining: number;
  status: string; 
  file_url?: string; // We need this for the "View PDF" button
}