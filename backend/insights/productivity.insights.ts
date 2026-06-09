import { GaiolaDTO } from "../schemas/gaiola.schema";
import { ProductivitySummary } from "../kpis/productivity.metrics";

export function generateProductivityInsights(summary: ProductivitySummary): any[] {
  const insights = [];

  // 1. Produtividade T1 vs T2 vs T3
  const turnos = summary.turnos;
  const tVals = [
    { n: "T1", v: turnos.T1 },
    { n: "T2", v: turnos.T2 },
    { n: "T3", v: turnos.T3 }
  ].sort((a, b) => b.v - a.v);

  if (tVals[0].v > 0) {
    insights.push({
      level: "success",
      title: `Turno de Maior Performance: ${tVals[0].n}`,
      description: `O turno ${tVals[0].n} liderou a produtividade com ${tVals[0].v} gaiolas processadas.`
    });
  }

  // 2. Alerta de itens críticos
  if (summary.kpis.criticalGaiolas > 0) {
    insights.push({
      level: "danger",
      title: "Alerta de Aging Operacional",
      description: `Existem ${summary.kpis.criticalGaiolas} gaiolas (aprox. ${summary.kpis.criticalProdutos} pacotes) com aging acima de 5 dias na operação de produtividade.`
    });
  } else {
    insights.push({
      level: "success",
      title: "Aging Controlado",
      description: "Todas as gaiolas processadas estão dentro da meta de 5 dias."
    });
  }

  // 3. Pico de Produtividade (Horário)
  if (summary.hourlyChart && summary.hourlyChart.length > 0) {
    const sortedHours = [...summary.hourlyChart].sort((a, b) => b.total - a.total);
    if (sortedHours[0].total > 0) {
      insights.push({
        level: "info",
        title: `Pico de Produtividade: ${sortedHours[0].hour}`,
        description: `O maior volume de processamento ocorreu às ${sortedHours[0].hour}, com ${sortedHours[0].total} gaiolas processadas.`
      });
    }
  }

  return insights;
}
