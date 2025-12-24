// src/api/client.ts
import axios from 'axios';
import type { ChatResponse, Document, Alert, ChatPayload } from './types';

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

export const fetchDocuments = async (category?: string) => {
  const params: any = {};
  if (category && category !== 'all') {
    params.category = category;
  }
  const response = await api.get<Document[]>('/documents', { params });
  return response.data;
};

export const fetchAlerts = async () => {
  const response = await api.get<Alert[]>('/alerts');
  return response.data;
};