import { fetchAndParseGaiolas } from "../../backend/services/gaiola.service";
import { generateInsights } from "../../backend/insights/general.insights";
import { generateReverseInsights } from "../../backend/insights/reverse.insights";
import { generateSalvadosLotInsights } from "../../backend/insights/salvados-lot.insights";
import { buildTimeline } from "../../backend/kpis/timeline.metrics";
import { computeReverseBufferMetrics } from "../../backend/kpis/reverse-buffer.metrics";

export default async function handler(req: any, res: any) {
  // Habilita CORS para o mesmo domínio
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Vercel auto-parseia o body quando Content-Type é application/json
    const sheetUrl = req.body?.url;

    if (!sheetUrl || typeof sheetUrl !== "string") {
      return res.status(400).json({ error: "URL da planilha ausente ou inválida" });
    }

    const gaiolas = await fetchAndParseGaiolas(sheetUrl);
    const generalInsights = generateInsights(gaiolas);
    const reverseInsights = generateReverseInsights(gaiolas);
    const salvadosLotInsights = generateSalvadosLotInsights(gaiolas);
    const reverseMetrics = computeReverseBufferMetrics(gaiolas);
    const timeline = buildTimeline(gaiolas);

    return res.status(200).json({
      data: gaiolas,
      metrics: {
        reverseBuffer: reverseMetrics,
        timeline: timeline,
      },
      insights: {
        general: generalInsights,
        reverse: reverseInsights,
        salvadosLot: salvadosLotInsights,
      },
    });
  } catch (error: any) {
    console.error("[API /dashboard/sync] Erro:", error?.message, error?.stack);
    return res.status(500).json({
      error: "Falha na ingestão de dados",
      details: error?.message ?? "Erro desconhecido",
    });
  }
}
