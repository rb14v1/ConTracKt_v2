import { useEffect, useState } from "react";
import { fetchAlerts } from "../api/client";
import type { Alert } from "../api/types";

export const useAlerts = (status: 'critical' | 'upcoming') => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0); // 🔥 NEW: Store the total count

  // Fetch when page or status changes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchAlerts(status, page);
        setAlerts(data.data); 
        setTotalPages(data.total_pages);
        setTotalCount(data.total); // 🔥 NEW: Catch the value from API
      } catch (err) {
        console.error("Failed to load alerts", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [status, page]);

  // Handlers
  const nextPage = () => {
    if (page < totalPages) setPage(p => p + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(p => p - 1);
  };

  return { alerts, loading, page, totalPages, totalCount, nextPage, prevPage };
};