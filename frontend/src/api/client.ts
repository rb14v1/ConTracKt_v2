// src/api/client.ts
import axios from 'axios';
import type { ChatResponse, Document, Alert, ChatPayload, PaginatedResult } from './types';

// Ensure this matches your backend URL exactly
const BASE_URL = import.meta.env.VITE_API_URL; 

if (!BASE_URL) {
  throw new Error("VITE_API_URL not defined");
}

const api = axios.create({
  baseURL: BASE_URL,
});

export const uploadFile = async (file: File, category: string = 'general') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category); 
  
  // Axios and the browser will set it automatically with the correct boundary.
  const response = await api.post('/upload', formData);
  
  return response.data;
};

export const sendMessage = async (query: string, category?: string, docIds?: number[]): Promise<ChatResponse> => {
  const payload: ChatPayload = { query };
  
  if (category && category !== 'all') {
      payload.category_filter = category;
  }
  
  if (docIds && docIds.length > 0) {
      payload.doc_ids = docIds;
  }

  const response = await api.post<ChatResponse>('/chat', payload);
  return response.data;
};

// Update fetchDocuments in client.ts
// We default to page 1 and limit 10 for "lazy loading" chunks
export const fetchDocuments = async (
  category?: string, 
  page: number = 1, 
  limit: number = 10
): Promise<PaginatedResult<Document>> => {
  const params: any = { page, limit };
  
  if (category && category !== 'all') {
    params.category = category;
  }

  const response = await api.get<PaginatedResult<Document>>('/documents', { params });
  return response.data;
};

export const fetchAlerts = async (
    status: 'critical' | 'upcoming' = 'critical', 
    page: number = 1, 
    limit: number = 10
): Promise<PaginatedResult<Alert>> => {
    const response = await api.get<PaginatedResult<Alert>>('/alerts', { 
        params: { status, page, limit } 
    });
    return response.data;
};