import { useState } from 'react';
import { sendMessage } from '../api/client';
import type{ Message } from '../api/types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am ConTrackt AI. I can analyze your documents instantly. Upload a file to get started!',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Message
    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // 2. API Call
      const data = await sendMessage(text);
      
      // 3. Add AI Response
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "⚠️ I encountered an error connecting to the server.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, handleSend };
};