// src/hooks/useChat.ts
import { useState } from 'react';
import { sendMessage } from '../api/client';
import type { Message } from '../api/types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am ConTrackt AI. I am ready to analyze your documents.',
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);

  // Use a prefix key that ChatBubble looks for
  const addSystemMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: `SYSTEM_UPDATE: ${text}`, // <--- Key for styling
      timestamp: new Date()
    }]);
  };

  const resetChat = () => {
  setMessages((prev) => [prev[0]]); // keep system intro message
};


  const handleSend = async (text: string, category?: string, docIds?: number[]) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await sendMessage(text, category, docIds);
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

  return { messages, loading, handleSend, addSystemMessage, resetChat };
};