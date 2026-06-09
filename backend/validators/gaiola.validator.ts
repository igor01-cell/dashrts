import {
  RawGaiolaRowSchema,
  type RawGaiolaRowDTO,
  type GaiolaDTO,
} from "../schemas/gaiola.schema";
import { LOST_THRESHOLD_DAYS, RISK_THRESHOLD_DAYS, PERFIL_PACKAGES } from "../kpis/aging.constants";

const normalize = (s: string | undefined | null): string => (s ?? "").toString().trim();
const upper = (s: string | undefined | null): string => normalize(s).toUpperCase();

function parseBuffer(v: string | undefined): "SALVADOS" | "EHA" | "RTS" {
  const u = upper(v);
  if (u.includes("SALVAD")) return "SALVADOS";
  if (u.includes("EHA")) return "EHA";
  return "RTS";
}

function parseCategoria(v: string | undefined): any {
  const u = upper(v);
  if (!u) return "Outros";
  if (u.includes("AVARIA")) return "Avaria";
  if (u.includes("TRATATIV")) return "Tratativas";
  if (u.includes("SALVAD") && u.includes("SEM")) return "Salvados sem ID";
  if (u.includes("SALVAD")) return "Salvados com ID";
  if (u.includes("OFF") && u.includes("SEM")) return "Off sem ID";
  if (u.includes("OFF") && u.includes("ID")) return "Off com ID";
  return "Outros";
}

function parsePerfil(v: string | undefined): any {
  const u = upper(v);
  if (u === "P" || u === "M" || u === "G") return u;
  return "—";
}

function parseDateBR(v: string | undefined): Date | null {
  const s = normalize(v);
  if (!s) return null;
  const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (ymd) {
    const [, yyyy, mm, dd, hh = "0", mi = "0", ss = "0"] = ymd;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmy) {
    const [, dd, mm, yyyy, hh = "0", mi = "0", ss = "0"] = dmy;
    const year = yyyy.length === 2 ? 2000 + Number(yyyy) : Number(yyyy);
    const d = new Date(year, Number(mm) - 1, Number(dd), Number(hh), Number(mi), Number(ss));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const iso = new Date(s);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

function extractRuaNum(v: string): number | null {
  const m = v.match(/(\d+)\s*$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

function mapToGrid(ruaNum: number | null): { rua: number | null; pos: number | null } {
  if (ruaNum == null) return { rua: null, pos: null };
  const idx = ((ruaNum - 1) % 70 + 70) % 70;
  return { rua: Math.floor(idx / 7) + 1, pos: (idx % 7) + 1 };
}

export function validateAndTransformRow(rawRow: unknown, idx: number, now: Date): GaiolaDTO | null {
  // Passa pelo Zod para garantir que a tipagem base de entrada não seja violada
  const parsed = RawGaiolaRowSchema.safeParse(rawRow);
  if (!parsed.success) {
    console.warn(`Row ${idx} failed raw schema validation`, parsed.error);
    return null;
  }
  const row = parsed.data;

  const codigo = normalize(row.CODIGO);
  const rua = normalize(row.RUA);
  const bufferRaw = normalize(row.BUFFER);

  if (!codigo && !rua && !bufferRaw) return null;

  const dataHora = parseDateBR(row["DATA E HORA"]);
  const horaSaidaRaw = row.HORA_SAIDA || row["HORA SAIDA"];
  const horaSaida = parseDateBR(horaSaidaRaw) || dataHora; // Fallback para DATA E HORA se HORA_SAIDA não existir
  
  const ruaNum = rua ? extractRuaNum(rua) : null;
  const grid = mapToGrid(ruaNum);
  const perfil = parsePerfil(row.PERFIL);

  let agingHours = 0;
  let agingDays = 0;
  if (dataHora) {
    agingHours = Math.max(0, (now.getTime() - dataHora.getTime()) / 36e5);
    agingDays = agingHours / 24;
  }

  return {
    id: `${codigo || "—"}-${rua || "—"}-${idx}`,
    codigo: codigo || "—",
    rua: rua || "—",
    ruaNum,
    posicao: grid.pos,
    buffer: parseBuffer(bufferRaw),
    categoria: parseCategoria(row["CATEGORIA GAIOLA"]),
    perfil,
    dataHora,
    horaSaida,
    turno: normalize(row.TURNO) || "—",
    agingDays,
    agingHours,
    isLost: agingDays > LOST_THRESHOLD_DAYS,
    isAtRisk: agingDays > RISK_THRESHOLD_DAYS,
    estimatedPackages: PERFIL_PACKAGES[perfil] ?? 0,
  };
}
