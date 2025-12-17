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

export interface Message {
  id: string; // Unique ID for key mapping
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
}