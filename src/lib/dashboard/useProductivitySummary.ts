import { useCallback, useEffect, useRef, useState } from "react";
import { getRefreshSec, getSheetUrl } from "./store";
import type { ProductivitySummary } from "../../../backend/kpis/productivity.metrics";

interface State {
  summary: ProductivitySummary | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useProductivitySummary() {
  const [state, setState] = useState<State>({
    summary: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const url = getSheetUrl();
      const res = await fetch("http://localhost:3001/api/v1/dashboard/productivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json();
      
      setState({ 
        summary: json.summary || null, 
        loading: false, 
        error: null, 
        lastUpdated: new Date() 
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar produtividade",
      }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    void fetchData();
    const sec = getRefreshSec();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => void fetchData(), sec * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchData]);

  return { ...state, refresh: fetchData };
}
