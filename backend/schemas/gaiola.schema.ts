import { z } from "zod";

export const CategoriaSchema = z.enum([
  "Avaria",
  "Tratativas",
  "Salvados sem ID",
  "Salvados com ID",
  "Off sem ID",
  "Off com ID",
  "Outros",
]);

export const BufferTypeSchema = z.enum(["SALVADOS", "EHA", "RTS"]);
export const PerfilSchema = z.enum(["P", "M", "G", "—"]);

export const RawGaiolaRowSchema = z.object({
  CODIGO: z.string().optional(),
  RUA: z.string().optional(),
  BUFFER: z.string().optional(),
  "CATEGORIA GAIOLA": z.string().optional(),
  PERFIL: z.string().optional(),
  "DATA E HORA": z.string().optional(),
  "HORA SAIDA": z.string().optional(),
  HORA_SAIDA: z.string().optional(),
  TURNO: z.string().optional(),
});

export type RawGaiolaRowDTO = z.infer<typeof RawGaiolaRowSchema>;

export const GaiolaDomainSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  rua: z.string(),
  ruaNum: z.number().nullable(),
  posicao: z.number().nullable(),
  buffer: BufferTypeSchema,
  categoria: CategoriaSchema,
  perfil: PerfilSchema,
  dataHora: z.date().nullable(),
  horaSaida: z.date().nullable(),
  turno: z.string(), // Turno original da planilha (ignorado nos KPIs)
  agingDays: z.number().min(0),
  agingHours: z.number().min(0),
  isLost: z.boolean(),
  isAtRisk: z.boolean(),
  estimatedPackages: z.number().min(0),
});

export type GaiolaDTO = z.infer<typeof GaiolaDomainSchema>;
