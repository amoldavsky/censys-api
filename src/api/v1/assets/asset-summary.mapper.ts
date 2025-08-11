import type { WebAssetSummary, HostAssetSummary } from "@/api/v1/assets/models/asset-summary.schema";
import type {
  WebAssetSummaryResponseDTO,
  HostAssetSummaryResponseDTO
} from "@/api/v1/assets/models/asset-summary.dto";

/**
 * Convert WebAssetSummary domain model to response DTO
 */
export function toWebAssetSummaryResponse(summary: WebAssetSummary): WebAssetSummaryResponseDTO {
  return {
    id: summary.id,
    summary: summary.summary,
    severity: summary.severity,
    evidence: summary.evidence,
    evidence_extras: summary.evidence_extras,
    findings: summary.findings,
    recommendations: summary.recommendations,
    assumptions: summary.assumptions,
    data_coverage: summary.data_coverage,
    created_at: summary.created_at,
    updated_at: summary.updated_at,
    ...summary // Include any additional fields
  };
}

/**
 * Convert HostAssetSummary domain model to response DTO
 */
export function toHostAssetSummaryResponse(summary: HostAssetSummary): HostAssetSummaryResponseDTO {
  return {
    id: summary.id,
    summary: summary.summary,
    severity: summary.severity,
    evidence: summary.evidence,
    evidence_extras: summary.evidence_extras,
    findings: summary.findings,
    recommendations: summary.recommendations,
    assumptions: summary.assumptions,
    data_coverage: summary.data_coverage,
    created_at: summary.created_at,
    updated_at: summary.updated_at,
    ...summary // Include any additional fields
  };
}
