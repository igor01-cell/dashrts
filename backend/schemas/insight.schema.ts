import { z } from "zod";

export const InsightLevelSchema = z.enum(["info", "warning", "danger", "success"]);

export const InsightDTOSchema = z.object({
  level: InsightLevelSchema,
  title: z.string(),
  description: z.string(),
});

export type InsightDTO = z.infer<typeof InsightDTOSchema>;

export const AgeBucketsSchema = z.object({
  recent: z.number(),
  aged: z.number(),
  old: z.number(),
  critical: z.number(),
});

export const ReverseBufferMetricsDTOSchema = z.object({
  total: z.number(),
  totalPacotes: z.number(),
  avgAging: z.number(),
  oldestDays: z.number(),
  ageBuckets: AgeBucketsSchema,
  semId: z.number(),
  semIdPct: z.number(),
  estimatedExpeditionRate: z.number(),
});

export type ReverseBufferMetricsDTO = z.infer<typeof ReverseBufferMetricsDTOSchema>;

export const TimelineItemSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export type TimelineItemDTO = z.infer<typeof TimelineItemSchema>;
