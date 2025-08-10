import * as store from "@/api/v1/assets/assets.store";
import {
  type HostAsset,
  HostAssetSchema,
  type WebAsset,
  WebAssetSchema
} from "@/api/v1/assets/models/asset.schema";
import type {WebAssetDoc} from "@/api/v1/assets/models/asset.model.ts";


export async function getWebAssets(): Promise<WebAsset[]> {
  return (await store.listWebAssets()).map((a: any) => {
    return WebAssetSchema.parse(a);
  });
}

export async function getHostAssets(): Promise<HostAsset[]> {
  return (await store.listHostAssets()).map((a: any) => {
    return HostAssetSchema.parse(a);
  });
}

export async function getWebAssetById(id: string): Promise<WebAsset | null> {
  const assetStored = store.getWebAssetById(id);
  return WebAssetSchema.parse(assetStored);
}

export async function getHostAssetById(id: string): Promise<HostAsset | null> {
  const assetStored = await store.getHostAssetById(id);
  return HostAssetSchema.parse(assetStored);
}

// Bulk insert (overwrite) web assets
export async function insertWebAssets(assets: WebAsset[]): Promise<WebAsset[]> {
  await store.insertWebAssets(assets);
  const assetsStored = await Promise.all(assets.map(i => {
    const assetDoc = store.getWebAssetById(i.fingerprint_sha256);
    return WebAssetSchema.parse(assetDoc);
  }));
  return assetsStored;
}

export async function insertHostAssets(assets: HostAsset[]): Promise<HostAsset[]> {
  await store.insertHostAssets(assets);
  const assetsStored = await Promise.all(assets.map(i => {
    const assetDoc = store.getHostAssetById(i.ip);
    return HostAssetSchema.parse(assetDoc);
  }));
  return assetsStored;
}