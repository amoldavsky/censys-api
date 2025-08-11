import * as store from "@/api/v1/assets/assets.store";
import {
  type HostAsset,
  HostAssetSchema,
  type WebAsset,
  WebAssetSchema
} from "@/api/v1/assets/models/asset.schema";
import type {WebAssetDoc} from "@/api/v1/assets/models/asset.model.ts";
import logger from "@/utils/logger";


export async function getWebAssets(): Promise<WebAsset[]> {
  return (await store.listWebAssets()).map((a: any) => {
    const parsed = WebAssetSchema.parse(a);
    return { ...parsed, id: a._id };
  });
}

export async function getHostAssets(): Promise<HostAsset[]> {
  return (await store.listHostAssets()).map((a: any) => {
    const parsed = HostAssetSchema.parse(a);
    return { ...parsed, id: a._id };
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

  // Use safeParse to handle extra fields gracefully
  const parseResult = HostAssetSchema.safeParse(assetStored);
  if (!parseResult.success) {
    logger.error({ assetId: id, error: parseResult.error }, "Schema validation failed for host asset");
    // Return null if validation fails to maintain type safety
    return null;
  }
  return { ...parseResult.data, id: assetStored._id };
}

// Bulk insert (overwrite) web assets
export async function insertWebAssets(assets: WebAsset[]): Promise<WebAsset[]> {
  if (!assets.length) return [];

  // Validate that all assets have IDs (should be set by controller)
  const assetsWithIds = assets.map(asset => {
    if (!asset.id) {
      throw new Error("Web asset must have an id field");
    }
    return asset;
  });

  logger.info({ assetCount: assetsWithIds.length }, "Attempting to insert/update web assets");
  await store.insertWebAssets(assetsWithIds);
  logger.info("Bulk write operation completed");

  // Return the assets with source: "upload" added
  const assetsStored = assetsWithIds.map(asset => ({
    ...asset,
    source: "upload" as const
  }));

  logger.info({ processedCount: assetsStored.length }, "Successfully processed web assets");
  return assetsStored;
}

export async function insertHostAssets(assets: HostAsset[]): Promise<HostAsset[]> {
  if (!assets.length) return [];

  // Ensure all assets have an id field (use ip as id if not provided)
  const assetsWithIds = assets.map(asset => ({
    ...asset,
    id: asset.id || asset.ip
  }));

  logger.info({ assetCount: assetsWithIds.length }, "Attempting to insert/update host assets");
  await store.insertHostAssets(assetsWithIds);
  logger.info("Bulk write operation completed");

  // Return the assets with source: "upload" added
  const assetsStored = assetsWithIds.map(asset => ({
    ...asset,
    source: "upload" as const
  }));

  logger.info({ processedCount: assetsStored.length }, "Successfully processed host assets");
  return assetsStored;
}