import { GaiolaDTO } from "../../../../../backend/schemas/gaiola.schema";
import { calcularTurno, isSalvado, formatHourStr, Turno } from "../utils";

export interface ProductivityKPIs {
  produtosProcessados: number;
  gaiolasProcessadas: number;
  produtosPorEHA: number;
  produtosRTS: number;
  salvadosExpedidos: number;
}

export interface HourlyProductivity {
  hour: string;
  total: number;
}

export interface PerfilData {
  name: string;
  count: number;
}

export interface CategoryData {
  name: string;
  count: number;
}

export interface ComputedDashboardData {
  kpis: ProductivityKPIs;
  hourlyChart: HourlyProductivity[];
  perfilChart: PerfilData[];
  categoryChart: CategoryData[];
}

/**
 * SERVICE: Responsável por toda a transformação (agrupamentos, filtros) isolando isso do JSX.
 */
export function computeDashboardData(
  rawData: GaiolaDTO[],
  turnoFilter: Turno
): ComputedDashboardData {
  const kpis: ProductivityKPIs = {
    produtosProcessados: 0,
    gaiolasProcessadas: 0,
    produtosPorEHA: 0,
    produtosRTS: 0,
    salvadosExpedidos: 0,
  };

  const hourlyMap: Record<string, number> = {};
  const perfilMap: Record<string, number> = { P: 0, M: 0, G: 0 };
  const catMap: Record<string, number> = {};

  rawData.forEach((gaiola) => {
    // 1. Aplica Filtro de Turno (calculado na hora)
    const turno = calcularTurno(gaiola.horaSaida);
    if (turnoFilter !== "Todos" && turno !== turnoFilter) {
      return; // Pula se não for do turno selecionado
    }

    // 2. Separa Salvados
    if (isSalvado(gaiola)) {
      kpis.salvadosExpedidos++;
      return; // NÃO participam de mais NENHUM cálculo operacional
    }

    // A partir daqui, são operações normais (NÃO SALVADOS)
    kpis.gaiolasProcessadas++;
    kpis.produtosProcessados += gaiola.estimatedPackages || 0;

    if (gaiola.buffer.toUpperCase() === "EHA") {
      kpis.produtosPorEHA += gaiola.estimatedPackages || 0;
    }

    if (gaiola.buffer.toUpperCase() === "RTS") {
      kpis.produtosRTS += gaiola.estimatedPackages || 0;
    }

    // 3. Gráfico Principal (Produtividade por Hora)
    const hour = formatHourStr(gaiola.horaSaida);
    hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;

    // 4. Gráfico Perfil
    if (gaiola.perfil === "P" || gaiola.perfil === "M" || gaiola.perfil === "G") {
      perfilMap[gaiola.perfil]++;
    }

    // 5. Gráfico Categoria
    // Opcional: Omitir "Outros" se for zero ou agrupar? Vamos agrupar as permitidas.
    // Categorias válidas no prompt: Tratativas, Avarias, Off com ID, Off sem ID
    const cat = gaiola.categoria;
    catMap[cat] = (catMap[cat] || 0) + 1;
  });

  const hourlyChart = Object.entries(hourlyMap)
    .map(([hour, total]) => ({ hour, total }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  const perfilChart = Object.entries(perfilMap).map(([name, count]) => ({
    name,
    count,
  }));

  // Filtra as categorias exigidas pelo prompt
  const allowedCategories = ["Tratativas", "Avaria", "Off com ID", "Off sem ID"];
  const categoryChart = Object.entries(catMap)
    .filter(([name]) => allowedCategories.some(c => name.includes(c)))
    .map(([name, count]) => ({ name, count }));

  return {
    kpis,
    hourlyChart,
    perfilChart,
    categoryChart,
  };
}
