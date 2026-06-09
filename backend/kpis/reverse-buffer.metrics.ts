import type { GaiolaDTO } from "../schemas/gaiola.schema";
import type { ReverseBufferMetricsDTO } from "../schemas/insight.schema";

export function computeReverseBufferMetrics(
  rows: GaiolaDTO[],
  now: Date = new Date(),
): ReverseBufferMetricsDTO {
  void now;
  const total = rows.length;
  const totalPacotes = rows.reduce((s, r) => s + r.estimatedPackages, 0);
  const avgAging = total
    ? rows.reduce((s, r) => s + r.agingDays, 0) / total
    : 0;
  const oldestDays = rows.reduce((max, r) => Math.max(max, r.agingDays), 0);

  const ageBuckets = {
    recent: rows.filter((r) => r.agingDays >= 14 && r.agingDays < 21).length,
    aged: rows.filter((r) => r.agingDays >= 21 && r.agingDays < 30).length,
    old: rows.filter((r) => r.agingDays >= 30 && r.agingDays < 60).length,
    critical: rows.filter((r) => r.agingDays >= 60).length,
  };

  const semId = rows.filter((r) => r.categoria === "Salvados sem ID").length;
  const semIdPct = total ? (semId / total) * 100 : 0;

  const recent7d = rows.filter(
    (r) => r.agingDays >= 14 && r.agingDays < 21,
  ).length;
  const estimatedExpeditionRate = recent7d / 7;

  return {
    total,
    totalPacotes,
    avgAging,
    oldestDays,
    ageBuckets,
    semId,
    semIdPct,
    estimatedExpeditionRate,
  };
}

export const computeSalvadosMetrics = computeReverseBufferMetrics;
