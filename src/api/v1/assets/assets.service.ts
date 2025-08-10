import { randomUUID } from "crypto";
import * as store from "./assets.store";
import type { Asset, AssetTypeT } from "./models/asset.schema";

export async function getAssets(): Promise<Asset[]> {
  return store.listAssets();
}

export async function getAssetById(id: string): Promise<Asset | null> {
  return store.getAssetById(id);
}

export async function getWebAssets(): Promise<Asset[]> {
  return store.findAssetsByType("web" as AssetTypeT);
}

export async function getHostAssets(): Promise<Asset[]> {
  return store.findAssetsByType("host" as AssetTypeT);
}

export async function createAssetFromFiles(files: Asset["files"]): Promise<Asset> {
  const now = new Date().toISOString();
  const asset: Asset = {
    id: randomUUID(),
    type: "web" as AssetTypeT, // or decide based on files; simple default for POC
    status: "pending",
    files,
    createdAt: now,
  } as Asset;

  await store.upsertAsset(asset);
  return asset;
}