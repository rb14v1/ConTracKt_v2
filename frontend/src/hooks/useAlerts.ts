// src/hooks/useAlerts.ts
import { useEffect, useState } from "react";
import { fetchAlerts } from "../api/client";
import type { Alert } from "../api/types";

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts()
      .then(setAlerts)
      .finally(() => setLoading(false));
  }, []);

  return { alerts, loading };
};
