import { GaiolaDTO } from "../../../../../backend/schemas/gaiola.schema";

export type Turno = "T1" | "T2" | "T3" | "Todos";

/**
 * REGRA CRÍTICA: Cálculo de turno baseado EXCLUSIVAMENTE na HORA_SAIDA.
 * T1: 06:00 até 14:59
 * T2: 15:00 até 21:59
 * T3: 22:00 até 05:59
 */
export function calcularTurno(horaSaida: Date | null | string): Turno {
  if (!horaSaida) return "Todos";
  
  const date = typeof horaSaida === "string" ? new Date(horaSaida) : horaSaida;
  if (isNaN(date.getTime())) return "Todos";

  const h = date.getHours();
  
  if (h >= 6 && h < 15) return "T1";
  if (h >= 15 && h < 22) return "T2";
  return "T3";
}

/**
 * REGRA CRÍTICA: Identificação de Salvados.
 * Qualquer registro com BUFFER == "SALVADOS" ou CATEGORIA == "SALVADOS".
 */
export function isSalvado(gaiola: GaiolaDTO): boolean {
  const isBufferSalvado = gaiola.buffer.toUpperCase() === "SALVADOS";
  const isCategoriaSalvado = gaiola.categoria.toUpperCase().includes("SALVAD");
  
  return isBufferSalvado || isCategoriaSalvado;
}

export function formatHourStr(date: Date | null | string): string {
  if (!date) return "00:00";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "00:00";
  return d.getHours().toString().padStart(2, "0") + ":00";
}
