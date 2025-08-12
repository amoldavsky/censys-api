import * as store from "@/api/v1/assets/assets.store";
import {
  type HostAsset,
  HostAssetSchema,
  type WebAsset,
  WebAssetSchema
} from "@/api/v1/assets/models/asset.schema";
import type {WebAssetDoc} from "@/api/v1/assets/models/asset.model";
import logger from "@/utils/logger";


export async function getWebAssets(): Promise<WebAsset[]> {
  return (await store.listWebAssets()).map((a: any) => {
    const parsed = WebAssetSchema.parse(a);
    return { ...parsed, id: a._id };
  });
}

export async function getHostAssets(): Promise<HostAsset[]> {
  return (await store.listHostAssets()).map((a: any) => {
    // Ensure id field exists before parsing (use _id as fallback for existing records)
    if (!a.id) {
      a.id = a._id;
    }

    // Use safeParse to handle any schema issues gracefully
    const parseResult = HostAssetSchema.safeParse(a);
    if (!parseResult.success) {
      logger.error({ assetId: a._id, error: parseResult.error }, "Schema validation failed for host asset during listing");
      // Return a minimal valid object to prevent the entire list from failing
      return {
        id: a._id,
        ip: a.ip || a._id,
        location: {},
        autonomous_system: {},
      };
    }
    return { ...parseResult.data, id: a._id };
  });
}

export async function getWebAssetById(id: string): Promise<WebAsset | null> {
  const assetStored = await store.getWebAssetById(id);
  if (!assetStored) return null;

  // Use safeParse to handle extra fields gracefully
  const parseResult = WebAssetSchema.safeParse(assetStored);
  if (!parseResult.success) {
    logger.error({ assetId: id, error: parseResult.error }, "Schema validation failed for web asset");
    // Return null if validation fails to maintain type safety
    return null;
  }
  return { ...parseResult.data, id: assetStored._id };
}

export async function getHostAssetById(id: string): Promise<HostAsset | null> {
  const assetStored = await store.getHostAssetById(id);
  if (!assetStored) return null;

  // Ensure id field exists before parsing (use _id as fallback for existing records)
  if (!assetStored.id) {
    assetStored.id = assetStored._id;
  }

  // Use safeParse to handle extra fields gracefully
  const parseResult = HostAssetSchema.safeParse(assetStored);
  if (!parseResult.success) {
    logger.error({ assetId: id, error: parseResult.error }, "Schema validation failed for host asset");
    // Return null if validation fails to maintain type safety
    return null;
  }
  return { ...parseResult.data, id: assetStored._id };
}

// Bulk upsert (create or update) web assets
export async function insertWebAssets(assets: WebAsset[]): Promise<WebAsset[]> {
  if (!assets.length) {
    await store.insertWebAssets([]);
    return [];
  }

  // Ensure assets have IDs; derive shortest domain for web assets if not provided
  const assetsWithIds = assets.map(asset => {
    if (!asset.id) {
      const domains = asset.domains || [];
      if (!domains.length) throw new Error("Web asset must have at least one domain to derive id");
      const shortest = domains.reduce((s, d) => (d.length < s.length ? d : s));
      return { ...asset, id: shortest };
    }
    return asset;
  });

  logger.info({ assetCount: assetsWithIds.length }, "Attempting to upsert web assets");
  await store.insertWebAssets(assetsWithIds);
  logger.info("Bulk write operation completed");

  // Fetch and return all assets that were processed (both created and updated)
  const results: WebAsset[] = [];
  for (const a of assetsWithIds) {
    const doc = await store.getWebAssetById(a.id!);
    if (!doc) continue; // should not happen with upsert: true
    const parsed = WebAssetSchema.parse(doc);
    results.push({ ...parsed, id: doc._id, source: "upload" as const });
  }

  logger.info({ processedCount: results.length }, "Successfully processed web assets");
  return results;
}

export async function insertHostAssets(assets: HostAsset[]): Promise<HostAsset[]> {
  if (!assets.length) {
    await store.insertHostAssets([]);
    return [];
  }

  // Validate that all assets have IDs (should be set by controller)
  const assetsWithIds = assets.map(asset => {
    if (!asset.id) {
      throw new Error("Host asset must have an id field");
    }
    return asset;
  });

  logger.info({ assetCount: assetsWithIds.length }, "Attempting to upsert host assets");
  await store.insertHostAssets(assetsWithIds);
  logger.info("Bulk write operation completed");

  // Fetch and return all assets that were processed (both created and updated)
  const results: HostAsset[] = [];
  for (const a of assetsWithIds) {
    const doc = await store.getHostAssetById(a.id!);
    if (!doc) continue; // should not happen with upsert: true

    // Ensure id field exists before parsing (use _id as fallback)
    const docWithId = { ...doc, id: doc._id };
    const parsed = HostAssetSchema.parse(docWithId);
    results.push({ ...parsed, id: doc._id, source: "upload" as const });
  }

  logger.info({ processedCount: results.length }, "Successfully processed host assets");
  return results;
}

export async function deleteWebAsset(id: string): Promise<boolean> {
  const deleted = await store.deleteWebAsset(id);
  if (deleted) {
    logger.info({ assetId: id }, "Web asset deleted successfully");
  }
  return deleted;
}

export async function deleteHostAsset(id: string): Promise<boolean> {
  const deleted = await store.deleteHostAsset(id);
  if (deleted) {
    logger.info({ assetId: id }, "Host asset deleted successfully");
  }
  return deleted;
}