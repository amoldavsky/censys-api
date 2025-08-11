import { z } from "zod";

// Evidence schema - shared structure for both web and host summaries
const EvidenceSchema = z.object({
  domain: z.string().nullable().optional(),
  cert_sha256: z.string().nullable().optional(),
  issuer: z.string().nullable().optional(),
  not_before: z.string().nullable().optional(),
  not_after: z.string().nullable().optional(),
  days_to_expiry: z.number().nullable().optional(),
  key_type: z.string().nullable().optional(),
  key_bits: z.number().nullable().optional(),
  sig_alg: z.string().nullable().optional(),
  san_count: z.number().nullable().optional(),
  wildcard: z.boolean().nullable().optional(),
  https_redirect: z.boolean().nullable().optional(),
  waf_or_cdn_hint: z.string().nullable().optional(),
  ct_logs_count: z.number().nullable().optional(),
}).loose(); // Allow additional fields

// Data coverage schema
const DataCoverageSchema = z.object({
  fields_present_pct: z.number().min(0).max(100),
  missing_fields: z.array(z.string()),
});

// Base asset summary schema - shared structure
const BaseAssetSummarySchema = z.object({
  id: z.string(),
  summary: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  evidence: EvidenceSchema,
  evidence_extras: z.string().optional(),
  findings: z.array(z.string()),
  recommendations: z.array(z.string()),
  assumptions: z.array(z.string()),
  data_coverage: DataCoverageSchema,
  created_at: z.string(),
  updated_at: z.string(),
}).loose(); // Allow additional fields not explicitly defined

// Web Asset Summary Schema
export const WebAssetSummarySchema = BaseAssetSummarySchema;
export type WebAssetSummary = z.infer<typeof WebAssetSummarySchema>;

// Host Asset Summary Schema  
export const HostAssetSummarySchema = BaseAssetSummarySchema;
export type HostAssetSummary = z.infer<typeof HostAssetSummarySchema>;

// Export evidence and data coverage types for reuse
export type Evidence = z.infer<typeof EvidenceSchema>;
export type DataCoverage = z.infer<typeof DataCoverageSchema>;
