import type { GaiolaDTO } from "../schemas/gaiola.schema";
import type { InsightDTO } from "../schemas/insight.schema";
import { computeReverseBufferMetrics } from "../kpis/reverse-buffer.metrics";

export function generateReverseInsights(rows: GaiolaDTO[]): InsightDTO[] {
  const out: InsightDTO[] = [];
  if (rows.length === 0) {
    out.push({
      level: "info",
      title: "Buffer reverso vazio",
      description: "Nenhum pacote no buffer reverso com os filtros atuais.",
    });
    return out;
  }

  const m = computeReverseBufferMetrics(rows);

  if (m.ageBuckets.critical > 0) {
    out.push({
      level: "danger",
      title: `${m.ageBuckets.critical} pacote(s) há mais de 60 dias`,
      description: `Antiguidade crítica no buffer reverso. Priorizar expedição imediata para leilão para liberar espaço físico.`,
    });
  }

  if (m.ageBuckets.old > 0) {
    out.push({
      level: "warning",
      title: `${m.ageBuckets.old} pacote(s) entre 30 e 60 dias`,
      description: `Antiguidade elevada. Revisar ciclo de saída para evitar acúmulo crônico.`,
    });
  }

  if (m.semId > 0) {
    out.push({
      level: m.semIdPct > 30 ? "danger" : "warning",
      title: `${m.semId} pacote(s) sem ID (${m.semIdPct.toFixed(0)}%)`,
      description: `Itens sem identificação não podem seguir para leilão. Priorizar catalogação manual.`,
    });
  } else {
    out.push({
      level: "success",
      title: "Buffer 100% identificado",
      description: `Todos os ${m.total} pacotes possuem ID válido. Fluxo para leilão desbloqueado.`,
    });
  }

  out.push({
    level: m.avgAging > 30 ? "warning" : "info",
    title: `Aging médio: ${m.avgAging.toFixed(1)} dias`,
    description: `Pacote mais antigo está há ${m.oldestDays.toFixed(0)} dia(s) no buffer.`,
  });

  if (m.estimatedExpeditionRate < 1 && m.total > 5) {
    out.push({
      level: "warning",
      title: "Baixa taxa de expedição",
      description: `Estimativa de saída de apenas ${m.estimatedExpeditionRate.toFixed(1)} pacote(s)/dia. Revisar fluxo de leilão.`,
    });
  } else if (m.estimatedExpeditionRate >= 1) {
    out.push({
      level: "info",
      title: `Saída estimada: ${m.estimatedExpeditionRate.toFixed(1)}/dia`,
      description: `Baseado nos pacotes que entraram no buffer nos últimos 7 dias.`,
    });
  }

  return out;
}
