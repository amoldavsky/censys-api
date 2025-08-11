import * as store from "@/api/v1/assets/asset-summary.store";
import {
  type WebAssetSummary,
  type HostAssetSummary,
  WebAssetSummarySchema,
  HostAssetSummarySchema
} from "@/api/v1/assets/models/asset-summary.schema";
import logger from "@/utils/logger";

// --- Web Asset Summary Services ---

/**
 * Get a web asset summary by asset ID
 */
export async function getWebAssetSummary(assetId: string): Promise<WebAssetSummary | null> {
  const doc = await store.getWebAssetSummaryById(assetId);
  if (!doc) return null;

  // Transform MongoDB document to domain model
  const summary: WebAssetSummary = {
    id: doc._id,
    summary: doc.summary,
    severity: doc.severity,
    evidence: doc.evidence,
    evidence_extras: doc.evidence_extras,
    findings: doc.findings,
    recommendations: doc.recommendations,
    assumptions: doc.assumptions,
    data_coverage: doc.data_coverage,
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
    ...doc // Include any additional fields
  };

  // Validate against schema
  return WebAssetSummarySchema.parse(summary);
}

/**
 * Save a web asset summary
 */
export async function saveWebAssetSummary(summary: WebAssetSummary): Promise<void> {
  // Validate the summary before saving
  const validatedSummary = WebAssetSummarySchema.parse(summary);
  
  await store.saveWebAssetSummary(validatedSummary);
  logger.info({ assetId: summary.id }, "Web asset summary saved successfully");
}

/**
 * List all web asset summaries
 */
export async function listWebAssetSummaries(): Promise<WebAssetSummary[]> {
  const docs = await store.listWebAssetSummaries();
  
  return docs.map(doc => {
    const summary: WebAssetSummary = {
      id: doc._id,
      summary: doc.summary,
      severity: doc.severity,
      evidence: doc.evidence,
      evidence_extras: doc.evidence_extras,
      findings: doc.findings,
      recommendations: doc.recommendations,
      assumptions: doc.assumptions,
      data_coverage: doc.data_coverage,
      created_at: doc.createdAt.toISOString(),
      updated_at: doc.updatedAt.toISOString(),
      ...doc // Include any additional fields
    };

    return WebAssetSummarySchema.parse(summary);
  });
}

// --- Host Asset Summary Services ---

/**
 * Get a host asset summary by asset ID
 */
export async function getHostAssetSummary(assetId: string): Promise<HostAssetSummary | null> {
  const doc = await store.getHostAssetSummaryById(assetId);
  if (!doc) return null;

  // Transform MongoDB document to domain model
  const summary: HostAssetSummary = {
    id: doc._id,
    summary: doc.summary,
    severity: doc.severity,
    evidence: doc.evidence,
    evidence_extras: doc.evidence_extras,
    findings: doc.findings,
    recommendations: doc.recommendations,
    assumptions: doc.assumptions,
    data_coverage: doc.data_coverage,
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
    ...doc // Include any additional fields
  };

  // Validate against schema
  return HostAssetSummarySchema.parse(summary);
}

/**
 * Save a host asset summary
 */
export async function saveHostAssetSummary(summary: HostAssetSummary): Promise<void> {
  // Validate the summary before saving
  const validatedSummary = HostAssetSummarySchema.parse(summary);
  
  await store.saveHostAssetSummary(validatedSummary);
  logger.info({ assetId: summary.id }, "Host asset summary saved successfully");
}

/**
 * List all host asset summaries
 */
export async function listHostAssetSummaries(): Promise<HostAssetSummary[]> {
  const docs = await store.listHostAssetSummaries();
  
  return docs.map(doc => {
    const summary: HostAssetSummary = {
      id: doc._id,
      summary: doc.summary,
      severity: doc.severity,
      evidence: doc.evidence,
      evidence_extras: doc.evidence_extras,
      findings: doc.findings,
      recommendations: doc.recommendations,
      assumptions: doc.assumptions,
      data_coverage: doc.data_coverage,
      created_at: doc.createdAt.toISOString(),
      updated_at: doc.updatedAt.toISOString(),
      ...doc // Include any additional fields
    };

    return HostAssetSummarySchema.parse(summary);
  });
}
