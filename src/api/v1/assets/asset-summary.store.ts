import * as db from "@/db/mongoose";
import {
  WebAssetSummaryModel,
  HostAssetSummaryModel,
  type WebAssetSummaryDoc,
  type HostAssetSummaryDoc
} from "@/api/v1/assets/models/asset-summary.model";
import type { WebAssetSummary, HostAssetSummary } from "@/api/v1/assets/models/asset-summary.schema";
import logger from "@/utils/logger";

async function ensureConnected() {
  if (!db.isConnected()) await db.connect();
}

// --- Web Asset Summary Operations ---

/**
 * Save or update a web asset summary
 */
export async function saveWebAssetSummary(summary: WebAssetSummary): Promise<void> {
  await ensureConnected();
  
  const summaryData = {
    _id: summary.id,
    summary: summary.summary,
    severity: summary.severity,
    evidence: summary.evidence,
    evidence_extras: summary.evidence_extras,
    findings: summary.findings,
    recommendations: summary.recommendations,
    assumptions: summary.assumptions,
    data_coverage: summary.data_coverage,
    ...summary // Spread any additional fields
  };

  await WebAssetSummaryModel.replaceOne(
    { _id: summary.id },
    summaryData,
    { upsert: true }
  ).exec();

  logger.info({ assetId: summary.id }, "Web asset summary saved");
}

/**
 * Get a web asset summary by asset ID
 */
export async function getWebAssetSummaryById(assetId: string): Promise<WebAssetSummaryDoc | null> {
  await ensureConnected();
  const doc = await WebAssetSummaryModel.findById(assetId).lean().exec();
  return doc;
}

/**
 * List all web asset summaries
 */
export async function listWebAssetSummaries(): Promise<WebAssetSummaryDoc[]> {
  await ensureConnected();
  const docs = await WebAssetSummaryModel.find({}).sort({ createdAt: -1 }).lean().exec();
  return docs;
}

/**
 * Delete a web asset summary
 */
export async function deleteWebAssetSummary(assetId: string): Promise<boolean> {
  await ensureConnected();
  const result = await WebAssetSummaryModel.deleteOne({ _id: assetId }).exec();
  return result.deletedCount > 0;
}

// --- Host Asset Summary Operations ---

/**
 * Save or update a host asset summary
 */
export async function saveHostAssetSummary(summary: HostAssetSummary): Promise<void> {
  await ensureConnected();
  
  const summaryData = {
    _id: summary.id,
    summary: summary.summary,
    severity: summary.severity,
    evidence: summary.evidence,
    evidence_extras: summary.evidence_extras,
    findings: summary.findings,
    recommendations: summary.recommendations,
    assumptions: summary.assumptions,
    data_coverage: summary.data_coverage,
    ...summary // Spread any additional fields
  };

  await HostAssetSummaryModel.replaceOne(
    { _id: summary.id },
    summaryData,
    { upsert: true }
  ).exec();

  logger.info({ assetId: summary.id }, "Host asset summary saved");
}

/**
 * Get a host asset summary by asset ID
 */
export async function getHostAssetSummaryById(assetId: string): Promise<HostAssetSummaryDoc | null> {
  await ensureConnected();
  const doc = await HostAssetSummaryModel.findById(assetId).lean().exec();
  return doc;
}

/**
 * List all host asset summaries
 */
export async function listHostAssetSummaries(): Promise<HostAssetSummaryDoc[]> {
  await ensureConnected();
  const docs = await HostAssetSummaryModel.find({}).sort({ createdAt: -1 }).lean().exec();
  return docs;
}

/**
 * Delete a host asset summary
 */
export async function deleteHostAssetSummary(assetId: string): Promise<boolean> {
  await ensureConnected();
  const result = await HostAssetSummaryModel.deleteOne({ _id: assetId }).exec();
  return result.deletedCount > 0;
}
