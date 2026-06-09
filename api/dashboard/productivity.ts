import { fetchAndParseProductivity } from "../../backend/services/productivity.service";

export default async function handler(req: any, res: any) {
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
    const sheetUrl = req.body?.url;

    if (!sheetUrl || typeof sheetUrl !== "string") {
      return res.status(400).json({ error: "URL da planilha ausente ou inválida" });
    }

    const gaiolas = await fetchAndParseProductivity(sheetUrl);

    const { buildProductivitySummary } = await import(
      "../../backend/kpis/productivity.metrics"
    );
    const summary = buildProductivitySummary(gaiolas);

    const { generateProductivityInsights } = await import(
      "../../backend/insights/productivity.insights"
    );
    const insights = generateProductivityInsights(summary);

    return res.status(200).json({
      data: gaiolas,
      summary,
      insights,
    });
  } catch (error: any) {
    console.error("[API /dashboard/productivity] Erro:", error?.message, error?.stack);
    return res.status(500).json({
      error: "Falha na ingestão de produtividade",
      details: error?.message ?? "Erro desconhecido",
    });
  }
}
