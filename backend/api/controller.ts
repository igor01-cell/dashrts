import { fetchAndParseGaiolas } from "../services/gaiola.service";
import { fetchAndParseProductivity } from "../services/productivity.service";
import { generateInsights } from "../insights/general.insights";
import { generateReverseInsights } from "../insights/reverse.insights";
import { generateSalvadosLotInsights } from "../insights/salvados-lot.insights";
import { buildTimeline } from "../kpis/timeline.metrics";
import { computeReverseBufferMetrics } from "../kpis/reverse-buffer.metrics";

export class DashboardController {
  
  static async syncDashboard(req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const sheetUrl = body.url;

      if (!sheetUrl || typeof sheetUrl !== "string") {
        return new Response(JSON.stringify({ error: "URL da planilha ausente ou inválida" }), { status: 400 });
      }

      const gaiolas = await fetchAndParseGaiolas(sheetUrl);

      const generalInsights = generateInsights(gaiolas);
      const reverseInsights = generateReverseInsights(gaiolas);
      const salvadosLotInsights = generateSalvadosLotInsights(gaiolas);
      const reverseMetrics = computeReverseBufferMetrics(gaiolas);
      const timeline = buildTimeline(gaiolas);

      return new Response(JSON.stringify({
        data: gaiolas,
        metrics: {
          reverseBuffer: reverseMetrics,
          timeline: timeline,
        },
        insights: {
          general: generalInsights,
          reverse: reverseInsights,
          salvadosLot: salvadosLotInsights,
        }
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error: any) {
      console.error("[DashboardController] Erro de sincronização:", error);
      return new Response(JSON.stringify({ error: "Falha na ingestão de dados", details: error.message }), { status: 500 });
    }
  }

  static async syncProductivity(req: Request): Promise<Response> {
    try {
      // Aceita tanto POST (com body) quanto GET (com query string) para máxima compatibilidade
      let sheetUrl: string | null = null;
      if (req.method === "POST") {
        const body = await req.json();
        sheetUrl = body.url;
      } else {
        const parsedUrl = new URL(req.url);
        sheetUrl = parsedUrl.searchParams.get("url");
      }

      if (!sheetUrl || typeof sheetUrl !== "string") {
        return new Response(JSON.stringify({ error: "URL da planilha ausente ou inválida" }), { status: 400 });
      }

      // Ingestão
      const gaiolas = await fetchAndParseProductivity(sheetUrl);

      // Consolidação/Cálculo
      const { buildProductivitySummary } = await import("../kpis/productivity.metrics");
      const summary = buildProductivitySummary(gaiolas);

      const { generateProductivityInsights } = await import("../insights/productivity.insights");
      const insights = generateProductivityInsights(summary);

      return new Response(JSON.stringify({
        data: gaiolas, // Dados brutos caso necessário
        summary,       // O novo objeto perfeitamente estruturado para o frontend
        insights       // Insights calculados por I.A. simulada
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error: any) {
      console.error("[DashboardController] Erro de sincronização de produtividade:", error);
      return new Response(JSON.stringify({ error: "Falha na ingestão de produtividade", details: error.message }), { status: 500 });
    }
  }
}

