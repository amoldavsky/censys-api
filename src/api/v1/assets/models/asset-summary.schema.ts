import { z } from "zod";

// Data coverage schema
const DataCoverageSchema = z.object({
  fields_present_pct: z.number().min(0).max(100),
  missing_fields: z.array(z.string()),
});

// Base asset summary schema - shared structure for store operations
const BaseAssetSummarySchema = z.object({
  id: z.string(),
  summary: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  evidence: z.any(), // Store as-is from LLM, no strict validation
  evidence_extras: z.array(z.string()).optional(),
  findings: z.array(z.string()),
  recommendations: z.array(z.string()),
  assumptions: z.array(z.string()),
  data_coverage: DataCoverageSchema,
  created_at: z.string(),
  updated_at: z.string(),
}).loose(); // Allow additional fields not explicitly defined

// Web Asset Summary Schema (for store operations)
export const WebAssetSummarySchema = BaseAssetSummarySchema;
export type WebAssetSummary = z.infer<typeof WebAssetSummarySchema>;

// Host Asset Summary Schema (for store operations)
export const HostAssetSummarySchema = BaseAssetSummarySchema;
export type HostAssetSummary = z.infer<typeof HostAssetSummarySchema>;

// Export data coverage type for reuse
export type DataCoverage = z.infer<typeof DataCoverageSchema>;
