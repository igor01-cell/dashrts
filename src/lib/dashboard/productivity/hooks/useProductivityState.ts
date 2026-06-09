import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getRefreshSec, getSheetUrl } from "../../store";
import { GaiolaDTO } from "../../../../../backend/schemas/gaiola.schema";
import { computeDashboardData } from "../services/productivity.service";
import { Turno } from "../utils";

export function useProductivityState() {
  const [rawData, setRawData] = useState<GaiolaDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  
  // Filtros
  const [turnoFilter, setTurnoFilter] = useState<Turno>("Todos");
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = getSheetUrl();
      const res = await fetch("http://localhost:3001/api/v1/dashboard/productivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.details || errJson.error || `HTTP ${res.status}`);
      }
      
      const json = await res.json();
      
      // O backend retorna os DTOs em `json.data`
      if (!Array.isArray(json.data)) {
        throw new Error("Formato de dados inválido retornado pelo backend.");
      }

      setRawData(json.data);
      setInsights(json.insights || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
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

  // Transformação com Memoização Baseada nos Filtros
  const computedData = useMemo(() => {
    return computeDashboardData(rawData, turnoFilter);
  }, [rawData, turnoFilter]);

  return {
    rawData,
    computedData,
    insights,
    loading,
    error,
    lastUpdated,
    turnoFilter,
    setTurnoFilter,
    refresh: fetchData,
  };
}
