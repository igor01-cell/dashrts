import type { GaiolaDTO } from "../schemas/gaiola.schema";
import type { InsightDTO } from "../schemas/insight.schema";

export function generateInsights(rows: GaiolaDTO[]): InsightDTO[] {
  const out: InsightDTO[] = [];
  if (rows.length === 0) {
    out.push({
      level: "info",
      title: "Sem dados disponíveis",
      description: "Conecte uma planilha publicada para ver insights operacionais em tempo real.",
    });
    return out;
  }

  const total = rows.length;
  const lost = rows.filter((r) => r.isLost);
  const atRisk = rows.filter((r) => r.isAtRisk && !r.isLost);
  const eha = rows.filter((r) => r.buffer === "EHA");
  const rts = rows.filter((r) => r.buffer === "RTS");
  const salvados = rows.filter((r) => r.buffer === "SALVADOS");

  if (lost.length > 0) {
    const pct = (lost.length / total) * 100;
    const pacotesPerdidos = lost.reduce((s, r) => s + r.estimatedPackages, 0);
    out.push({
      level: "danger",
      title: `Alto risco operacional · ${lost.length} gaiola(s) em LOST`,
      description: `${pct.toFixed(0)}% do volume monitorado está acima de 14 dias, somando aprox. ${pacotesPerdidos.toLocaleString("pt-BR")} pacotes. Ação imediata recomendada.`,
    });
  }

  if (atRisk.length > 0) {
    out.push({
      level: "warning",
      title: `Tendência de crescimento de LOST · ${atRisk.length} gaiola(s)`,
      description: `Aging entre 10 e 14 dias. Promoção a LOST projetada para as próximas 96 horas se não houver tratativa.`,
    });
  }

  const ehaShare = eha.length / total;
  const rtsShare = rts.length / total;
  if (ehaShare > 0.5) {
    out.push({
      level: "warning",
      title: "Gargalo identificado no buffer EHA",
      description: `${Math.round(ehaShare * 100)}% das gaiolas estão concentradas no EHA. Avalie redistribuição para o RTS para descongestionar a área.`,
    });
  } else if (rtsShare > 0.6) {
    out.push({
      level: "info",
      title: "Concentração elevada no RTS",
      description: `${Math.round(rtsShare * 100)}% das gaiolas estão no RTS. Volume de tratativa acima do habitual.`,
    });
  }

  if (salvados.length > 0) {
    const semId = salvados.filter((r) => r.categoria === "Salvados sem ID").length;
    const oldSalvados = salvados.filter((r) => r.agingDays > 21).length;
    if (oldSalvados > 0) {
      out.push({
        level: "danger",
        title: `${oldSalvados} salvado(s) com mais de 21 dias`,
        description: `Acúmulo crônico no buffer reverso indica baixa taxa de expedição para leilão. Revisar fluxo de saída.`,
      });
    }
    if (semId > 0) {
      out.push({
        level: "warning",
        title: `${semId} salvado(s) sem ID`,
        description: `Itens sem identificação requerem catalogação manual antes de seguirem para leilão.`,
      });
    } else if (salvados.length > 0) {
      out.push({
        level: "success",
        title: "Salvados 100% identificados",
        description: `Todas as ${salvados.length} gaiolas de salvados estão com ID válido. Fluxo para leilão fluindo bem.`,
      });
    }
  }

  const perfilCount: Record<string, number> = { P: 0, M: 0, G: 0 };
  rows.forEach((r) => {
    if (r.perfil in perfilCount) perfilCount[r.perfil]++;
  });
  const topPerfil = Object.entries(perfilCount).sort((a, b) => b[1] - a[1])[0];
  if (topPerfil && topPerfil[1] > 0) {
    out.push({
      level: "info",
      title: `Perfil dominante: ${topPerfil[0]}`,
      description: `${topPerfil[1]} gaiolas com perfil ${topPerfil[0]} (${Math.round((topPerfil[1] / total) * 100)}% do total).`,
    });
  }

  const turnoCount: Record<string, number> = {};
  rows.forEach((r) => {
    turnoCount[r.turno] = (turnoCount[r.turno] ?? 0) + 1;
  });
  const topTurno = Object.entries(turnoCount).sort((a, b) => b[1] - a[1])[0];
  if (topTurno && topTurno[0] !== "—") {
    out.push({
      level: "info",
      title: `Maior fluxo no turno ${topTurno[0]}`,
      description: `${topTurno[1]} gaiolas registradas. Considere reforço de equipe nesse turno.`,
    });
  }

  const ruaCount: Record<string, number> = {};
  rows.forEach((r) => {
    ruaCount[r.rua] = (ruaCount[r.rua] ?? 0) + 1;
  });
  const topRua = Object.entries(ruaCount)
    .filter(([k]) => k && k !== "—")
    .sort((a, b) => b[1] - a[1])[0];
  if (topRua && topRua[1] >= 3) {
    out.push({
      level: "info",
      title: `Hot spot detectado: rua ${topRua[0]}`,
      description: `${topRua[1]} gaiolas concentradas em uma única rua. Verificar se há gargalo de fluxo.`,
    });
  }

  const oldest = [...rows].sort((a, b) => b.agingDays - a.agingDays)[0];
  if (oldest && oldest.agingDays > 0) {
    out.push({
      level: oldest.isLost ? "danger" : oldest.isAtRisk ? "warning" : "info",
      title: `Gaiola mais antiga: ${oldest.codigo}`,
      description: `Está há ${oldest.agingDays.toFixed(1)} dia(s) na ${oldest.buffer} (rua ${oldest.rua}, perfil ${oldest.perfil}).`,
    });
  }

  return out;
}
