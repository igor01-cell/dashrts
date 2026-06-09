import { useCallback, useEffect, useRef, useState } from "react";
import { getRefreshSec, getSheetUrl } from "./store";
import type { Gaiola } from "./types";

interface State {
  rows: Gaiola[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useProductivityData() {
  const [state, setState] = useState<State>({
    rows: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const url = getSheetUrl();
      const res = await fetch("/api/dashboard/productivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setState({ rows: json.data || [], loading: false, error: null, lastUpdated: new Date() });
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

