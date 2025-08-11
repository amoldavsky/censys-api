import { z } from "zod";

// Evidence DTO - for API responses
const EvidenceResponseDTO = z.object({
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

// Data Coverage DTO
const DataCoverageResponseDTO = z.object({
  fields_present_pct: z.number(),
  missing_fields: z.array(z.string()),
});

// Base Asset Summary Response DTO
const BaseAssetSummaryResponseDTO = z.object({
  id: z.string(),
  summary: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  evidence: EvidenceResponseDTO,
  evidence_extras: z.string().optional(),
  findings: z.array(z.string()),
  recommendations: z.array(z.string()),
  assumptions: z.array(z.string()),
  data_coverage: DataCoverageResponseDTO,
  created_at: z.string(),
  updated_at: z.string(),
}).loose(); // Allow additional fields

// Web Asset Summary Response DTO
export const WebAssetSummaryResponseDTO = BaseAssetSummaryResponseDTO;
export type WebAssetSummaryResponseDTO = z.infer<typeof WebAssetSummaryResponseDTO>;

// Host Asset Summary Response DTO
export const HostAssetSummaryResponseDTO = BaseAssetSummaryResponseDTO;
export type HostAssetSummaryResponseDTO = z.infer<typeof HostAssetSummaryResponseDTO>;

// Export shared types
export type EvidenceResponseDTO = z.infer<typeof EvidenceResponseDTO>;
export type DataCoverageResponseDTO = z.infer<typeof DataCoverageResponseDTO>;
