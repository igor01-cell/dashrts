import { GaiolaDTO } from "../schemas/gaiola.schema";

export interface HourlyData {
  hour: string;
  total: number;
  P: number;
  M: number;
  G: number;
  categorias: Record<string, number>;
}

export interface ProductivitySummary {
  kpis: {
    totalProcessed: number;
    totalP: number;
    totalM: number;
    totalG: number;
    criticalGaiolas: number;
    criticalProdutos: number;
  };
  turnos: {
    T1: number;
    T2: number;
    T3: number;
  };
  categoryTotals: { name: string; count: number }[];
  hourlyChart: HourlyData[];
}

function getTurnoClass(date: Date | null): "T1" | "T2" | "T3" | "Indefinido" {
  if (!date) return "Indefinido";
  const hours = date.getHours();
  // T1: 06:00 to 14:59
  if (hours >= 6 && hours < 15) return "T1";
  // T2: 15:00 to 21:59
  if (hours >= 15 && hours < 22) return "T2";
  // T3: 22:00 to 05:59
  return "T3";
}

export function buildProductivitySummary(rows: GaiolaDTO[]): ProductivitySummary {
  const turnCounts = { T1: 0, T2: 0, T3: 0, Indefinido: 0 };
  const hourlyMap: Record<string, HourlyData> = {};
  const catCounts: Record<string, number> = {};
  
  let totalP = 0;
  let totalM = 0;
  let totalG = 0;
  
  let criticalGaiolas = 0;
  let criticalProdutos = 0;

  rows.forEach((row) => {
    // 1. Turno
    const turno = getTurnoClass(row.dataHora);
    turnCounts[turno]++;

    // 2. Perfil (P, M, G)
    if (row.perfil === "P") totalP++;
    if (row.perfil === "M") totalM++;
    if (row.perfil === "G") totalG++;

    // 3. Critical Aging (> 5 dias)
    if (row.agingDays > 5) {
      criticalGaiolas++;
      criticalProdutos += row.estimatedPackages;
    }

    // 4. Categorias (Total)
    catCounts[row.categoria] = (catCounts[row.categoria] || 0) + 1;

    // 5. Hourly Aggregation
    if (row.dataHora) {
      const hourStr = row.dataHora.getHours().toString().padStart(2, "0") + ":00";
      
      if (!hourlyMap[hourStr]) {
        hourlyMap[hourStr] = { hour: hourStr, total: 0, P: 0, M: 0, G: 0, categorias: {} };
      }
      
      const hData = hourlyMap[hourStr];
      hData.total++;
      
      if (row.perfil === "P") hData.P++;
      if (row.perfil === "M") hData.M++;
      if (row.perfil === "G") hData.G++;
      
      hData.categorias[row.categoria] = (hData.categorias[row.categoria] || 0) + 1;
    }
  });

  const hourlyChart = Object.values(hourlyMap).sort((a, b) => a.hour.localeCompare(b.hour));

  const categoryTotals = Object.entries(catCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    kpis: {
      totalProcessed: rows.length,
      totalP,
      totalM,
      totalG,
      criticalGaiolas,
      criticalProdutos,
    },
    turnos: {
      T1: turnCounts.T1,
      T2: turnCounts.T2,
      T3: turnCounts.T3,
    },
    categoryTotals,
    hourlyChart,
  };
}
