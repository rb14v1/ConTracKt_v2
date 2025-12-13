import axios from 'axios';
import type{ ChatResponse } from './types';
const BASE_URL = import.meta.env.VITE_API_URL
const api = axios.create({
  baseURL: BASE_URL, // Adjust if your port differs
});

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const sendMessage = async (query: string): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat', { query });
  return response.data;
};