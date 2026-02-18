import { useState, useEffect } from 'react';
import { fetchDocuments } from '../api/client';
import type { Document } from '../api/types';

export const useDocuments = (category: string, isOpen: boolean) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [limit] = useState(8); // Items per page
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    // Reset page to 1 if category changes
    setPage(1);
  }, [category]);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const categoryToSend = category === 'all' ? undefined : category;
        const result = await fetchDocuments(categoryToSend, page, limit);
        
        // Handle both Array response (legacy) and PaginatedResponse (new)
        if (Array.isArray(result)) {
            // Fallback if backend doesn't support pagination yet
            setDocuments(result);
            setTotalPages(1);
        } else {
            setDocuments(result.data);
            setTotalPages(result.total_pages);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, category, page, limit]);

  return {
    documents,
    loading,
    error,
    page,
    setPage,
    totalPages
  };
};