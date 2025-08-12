import * as db from "@/db/mongoose";
import {WebAssetModel, HostAssetModel, type WebAssetDoc, type HostAssetDoc} from "@/api/v1/assets/models/asset.model";
import type {HostAsset, WebAsset} from "@/api/v1/assets/models/asset.schema";
import logger from "@/utils/logger";

async function ensureConnected() {
  if (!db.isConnected()) await db.connect();
}

// --- Upsert (create or update) ---
/**
 * Overwrite the source field for a web asset (no upsert).
 * @param asset Object containing id and source.
 * @returns Promise that resolves when update is complete.
 */
export async function overwriteWebAsset(asset: { id: string; source: string }): Promise<void> {
  await ensureConnected();
  await WebAssetModel.updateOne(
    { _id: asset.id },
    { $set: { source: asset.source }, $currentDate: { updatedAt: true } },
    { upsert: false }
  ).exec();
}

/**
 * Bulk upsert web assets using bulkWrite (ordered=false).
 * @param assets Raw assets array; id is used as _id (or legacy fingerprint).
 * @returns Promise that resolves when bulk operation is complete.
 */
export async function insertWebAssets(assets: any[]): Promise<void> {
  try {
    await ensureConnected();
    if (!assets.length) return;

    logger.debug({ assetCount: assets.length }, "Processing assets for bulk write");

  const operations = assets
    .map(a => {
      // Support legacy callers (store tests) that do not pass `id` and rely on fingerprint as _id
      // Service/controller will pass `id` explicitly (shortestDomain for web assets)
      const legacyId = (a as any).fingerprint_sha256 as string | undefined;
      const id = (a as any).id ?? legacyId;
      if (!id) return null; // skip invalid items

      // Exclude the id field from the spread to avoid conflicts with _id
      const { id: _ignored, ...assetData } = a as any;
      return {
        updateOne: {
          filter: { _id: id },
          update: {
            $set: {
              source: "upload",
              updatedAt: new Date(),
              ...assetData  // Spread all the uploaded asset data except id
            }
          },
          upsert: true,
        },
      };
    })
    .filter(Boolean) as any[];

    const result = await WebAssetModel.bulkWrite(operations, { ordered: false });
    logger.debug({
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    }, "Bulk write operation completed");
  } catch (error) {
    logger.error({ error }, "Error in insertWebAssets");
    throw error;
  }
}

/**
 * Bulk upsert host assets using bulkWrite.
 * @param assets Host assets with id set (used as _id).
 * @returns Promise that resolves when bulk operation is complete.
 */
export async function insertHostAssets(assets: (HostAsset & { id: string })[]): Promise<void> {
  await ensureConnected();
  if (!assets.length) return;

  logger.debug({ assetCount: assets.length }, "Processing host assets for bulk write");

  const result = await HostAssetModel.bulkWrite(
    assets.map(a => {
      // Exclude the id field from the spread to avoid conflicts with _id
      const { id, ...assetData } = a;
      return {
        replaceOne: {
          filter: { _id: id },
          replacement: {
            _id: id,
            source: "upload",
            createdAt: new Date(), // Will be ignored if document exists due to timestamps
            updatedAt: new Date(),
            ...assetData  // Spread all the uploaded asset data except id
          },
          upsert: true,
        },
      };
    }),
    { ordered: false }
  );

  logger.info({
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount
  }, "Host assets bulk write operation completed");
}

// --- Reads ---
/**
 * Get a web asset document by id.
 * @param id Asset identifier.
 * @returns Promise resolving to web asset document or null if not found.
 */
export async function getWebAssetById(id: string): Promise<WebAssetDoc | null> {
  await ensureConnected();
  const doc = await WebAssetModel.findById(id).lean().exec();
  return doc;
}

/**
 * Get a host asset document by id.
 * @param id Asset identifier.
 * @returns Promise resolving to host asset document or null if not found.
 */
export async function getHostAssetById(id: string): Promise<HostAssetDoc | null> {
  await ensureConnected();
  const doc = await HostAssetModel.findById(id).lean().exec();
  return doc;
}

/**
 * List all web asset documents (newest first).
 * @returns Promise resolving to array of web asset documents.
 */
export async function listWebAssets(): Promise<WebAssetDoc[]> {
  await ensureConnected();
  const docs = await WebAssetModel.find({}).sort({ createdAt: -1 }).lean().exec();
  return docs;
}

/**
 * List all host asset documents (newest first).
 * @returns Promise resolving to array of host asset documents.
 */
export async function listHostAssets(): Promise<HostAssetDoc[]> {
  await ensureConnected();
  const docs = await HostAssetModel.find({}).sort({ createdAt: -1 }).lean().exec();
  return docs;
}

// --- Deletes ---
/**
 * Delete a web asset by id.
 * @param id Asset identifier.
 * @returns Promise resolving to true if a document was deleted.
 */
export async function deleteWebAsset(id: string): Promise<boolean> {
  await ensureConnected();
  const result = await WebAssetModel.deleteOne({ _id: id }).exec();
  return result.deletedCount > 0;
}

/**
 * Delete a host asset by id.
 * @param id Asset identifier.
 * @returns Promise resolving to true if a document was deleted.
 */
export async function deleteHostAsset(id: string): Promise<boolean> {
  await ensureConnected();
  const result = await HostAssetModel.deleteOne({ _id: id }).exec();
  return result.deletedCount > 0;
}