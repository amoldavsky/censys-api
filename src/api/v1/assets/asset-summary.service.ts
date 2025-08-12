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
 * Retrieves a web asset summary by its asset ID.
 * @param assetId - The unique identifier of the web asset.
 * @returns The validated web asset summary or null if not found.
 */
export async function getWebAssetSummary(assetId: string): Promise<WebAssetSummary | null> {
  const doc = await store.getWebAssetSummaryById(assetId);
  if (!doc) return null;

  const summary = {
    ...doc, // Include all fields from document
    id: doc._id, // Map _id to id
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  };

  return WebAssetSummarySchema.parse(summary);
}

/**
 * Saves a validated web asset summary to the database.
 * @param summary - The web asset summary to save.
 */
export async function saveWebAssetSummary(summary: WebAssetSummary): Promise<void> {
  const validatedSummary = WebAssetSummarySchema.parse(summary);
  await store.saveWebAssetSummary(validatedSummary);
  logger.info({ assetId: summary.id }, "Web asset summary saved successfully");
}

/**
 * Lists all available web asset summaries.
 * @returns An array of validated web asset summaries.
 */
export async function listWebAssetSummaries(): Promise<WebAssetSummary[]> {
  const docs = await store.listWebAssetSummaries();

  return docs.map(doc => {
    const summary = {
      ...doc, // Include all fields from document
      id: doc._id, // Map _id to id
      created_at: doc.createdAt.toISOString(),
      updated_at: doc.updatedAt.toISOString(),
    };

    return WebAssetSummarySchema.parse(summary);
  });
}

// --- Host Asset Summary Services ---
/**
 * Retrieves a host asset summary by its asset ID.
 * @param assetId - The unique identifier of the host asset.
 * @returns The validated host asset summary or null if not found.
 */
export async function getHostAssetSummary(assetId: string): Promise<HostAssetSummary | null> {
  const doc = await store.getHostAssetSummaryById(assetId);
  if (!doc) return null;

  const summary = {
    ...doc, // Include all fields from document
    id: doc._id, // Map _id to id
    created_at: doc.createdAt.toISOString(),
    updated_at: doc.updatedAt.toISOString(),
  };

  return HostAssetSummarySchema.parse(summary);
}

/**
 * Saves a validated host asset summary to the database.
 * @param summary - The host asset summary to save.
 */
export async function saveHostAssetSummary(summary: HostAssetSummary): Promise<void> {
  const validatedSummary = HostAssetSummarySchema.parse(summary);
  await store.saveHostAssetSummary(validatedSummary);
  logger.info({ assetId: summary.id }, "Host asset summary saved successfully");
}

/**
 * Lists all available host asset summaries.
 * @returns An array of validated host asset summaries.
 */
export async function listHostAssetSummaries(): Promise<HostAssetSummary[]> {
  const docs = await store.listHostAssetSummaries();

  return docs.map(doc => {
    const summary = {
      ...doc, // Include all fields from document
      id: doc._id, // Map _id to id
      created_at: doc.createdAt.toISOString(),
      updated_at: doc.updatedAt.toISOString(),
    };

    return HostAssetSummarySchema.parse(summary);
  });
}

/**
 * Deletes a web asset summary by asset ID.
 * @param assetId - The unique identifier of the web asset.
 * @returns True if deletion succeeded, false otherwise.
 */
export async function deleteWebAssetSummary(assetId: string): Promise<boolean> {
  const deleted = await store.deleteWebAssetSummary(assetId);
  if (deleted) {
    logger.info({ assetId }, "Web asset summary deleted successfully");
  }
  return deleted;
}

/**
 * Deletes a host asset summary by asset ID.
 * @param assetId - The unique identifier of the host asset.
 * @returns True if deletion succeeded, false otherwise.
 */
export async function deleteHostAssetSummary(assetId: string): Promise<boolean> {
  const deleted = await store.deleteHostAssetSummary(assetId);
  if (deleted) {
    logger.info({ assetId }, "Host asset summary deleted successfully");
  }
  return deleted;
}
