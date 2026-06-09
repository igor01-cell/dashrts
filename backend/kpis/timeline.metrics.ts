import type { GaiolaDTO } from "../schemas/gaiola.schema";
import type { TimelineItemDTO } from "../schemas/insight.schema";

export function buildTimeline(rows: GaiolaDTO[], days = 30): TimelineItemDTO[] {
  const buckets = new Map<string, number>();
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }
  rows.forEach((r) => {
    if (!r.dataHora) return;
    const ageDays = (now - r.dataHora.getTime()) / 86400000;
    if (ageDays < 0 || ageDays >= days) return;
    const d = r.dataHora;
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  return Array.from(buckets.entries()).map(([date, value]) => ({ date, value }));
}
