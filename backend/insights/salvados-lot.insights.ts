import type { GaiolaDTO } from "../schemas/gaiola.schema";
import type { InsightDTO } from "../schemas/insight.schema";

export function generateSalvadosLotInsights(rows: GaiolaDTO[]): InsightDTO[] {
  const out: InsightDTO[] = [];
  if (rows.length === 0) {
    out.push({
      level: "info",
      title: "Sem gaylords no buffer",
      description: "Nenhum gaylord disponível para montagem de lotes com os filtros atuais.",
    });
    return out;
  }

  const totalGaylords = rows.length;
  const totalPacotes = rows.reduce((s, r) => s + r.estimatedPackages, 0);
  const avgPorGaylord = totalPacotes / totalGaylords;

  out.push({
    level: "success",
    title: `${totalPacotes.toLocaleString("pt-BR")} pacotes disponíveis para lote`,
    description: `Distribuídos em ${totalGaylords} gaylord(s), média de ${avgPorGaylord.toFixed(0)} pacotes por gaylord.`,
  });

  const perfilCount: Record<string, number> = { P: 0, M: 0, G: 0 };
  const perfilPacotes: Record<string, number> = { P: 0, M: 0, G: 0 };
  rows.forEach((r) => {
    if (r.perfil in perfilCount) {
      perfilCount[r.perfil]++;
      perfilPacotes[r.perfil] += r.estimatedPackages;
    }
  });
  const perfilTop = Object.entries(perfilCount).sort((a, b) => b[1] - a[1])[0];
  if (perfilTop && perfilTop[1] > 0) {
    const pct = Math.round((perfilTop[1] / totalGaylords) * 100);
    out.push({
      level: "info",
      title: `Mix dominante: perfil ${perfilTop[0]} (${pct}%)`,
      description: `P: ${perfilCount.P} gaylords (${perfilPacotes.P.toLocaleString("pt-BR")} pcs) · M: ${perfilCount.M} (${perfilPacotes.M.toLocaleString("pt-BR")} pcs) · G: ${perfilCount.G} (${perfilPacotes.G.toLocaleString("pt-BR")} pcs).`,
    });
  }

  const lotesCheios = rows.filter((r) => r.perfil === "P").length;
  if (lotesCheios >= 3) {
    out.push({
      level: "success",
      title: `${lotesCheios} gaylord(s) de alto volume (perfil P)`,
      description: `Cada um ~175 pacotes. Recomendado vender como lote único — maior margem por gaylord.`,
    });
  }

  const lotesPequenos = rows.filter((r) => r.perfil === "G").length;
  if (lotesPequenos >= 2) {
    const totalP = perfilPacotes.G;
    out.push({
      level: "warning",
      title: `${lotesPequenos} gaylord(s) de baixo volume (perfil G)`,
      description: `Somam apenas ~${totalP} pacotes. Considere consolidar em um lote misto para otimizar logística de venda.`,
    });
  }

  const ruaCount: Record<string, { gaylords: number; pacotes: number }> = {};
  rows.forEach((r) => {
    if (!r.rua || r.rua === "—") return;
    if (!ruaCount[r.rua]) ruaCount[r.rua] = { gaylords: 0, pacotes: 0 };
    ruaCount[r.rua].gaylords++;
    ruaCount[r.rua].pacotes += r.estimatedPackages;
  });
  const topRua = Object.entries(ruaCount).sort((a, b) => b[1].pacotes - a[1].pacotes)[0];
  if (topRua) {
    out.push({
      level: "info",
      title: `Rua ${topRua[0]} concentra maior volume`,
      description: `${topRua[1].gaylords} gaylord(s) e ~${topRua[1].pacotes.toLocaleString("pt-BR")} pacotes. Picking otimizado começando por essa rua.`,
    });
  }

  const semId = rows.filter((r) => r.categoria === "Salvados sem ID").length;
  const comId = rows.filter((r) => r.categoria === "Salvados com ID").length;
  if (totalGaylords > 0) {
    const pctCom = (comId / totalGaylords) * 100;
    out.push({
      level: "info",
      title: `Composição: ${comId} com ID · ${semId} sem ID`,
      description: `${pctCom.toFixed(0)}% dos gaylords possuem etiqueta. Ambas as categorias seguem o mesmo fluxo de venda em lote — sem bloqueio comercial.`,
    });
  }

  return out;
}
