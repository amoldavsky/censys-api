import * as db from "@/db/mongoose";
import {WebAssetModel, HostAssetModel, type WebAssetDoc, type HostAssetDoc} from "@/api/v1/assets/models/asset.model";
import type {HostAsset, WebAsset} from "@/api/v1/assets/models/asset.schema";
import logger from "@/utils/logger";

async function ensureConnected() {
  if (!db.isConnected()) await db.connect();
}

// --- Overwrite (no upsert) ---
export async function overwriteWebAsset(asset: { id: string; source: string }): Promise<void> {
  await ensureConnected();
  await WebAssetModel.updateOne(
    { _id: asset.id },
    { $set: { source: asset.source }, $currentDate: { updatedAt: true } },
    { upsert: false }
  ).exec();
}

export async function insertWebAssets(assets: (WebAsset & { id: string })[]): Promise<void> {
  await ensureConnected();
  if (!assets.length) return;

  logger.debug({ assetCount: assets.length }, "Processing assets for bulk write");

  const result = await WebAssetModel.bulkWrite(
    assets.map(a => ({
      replaceOne: {
        filter: { _id: a.id },
        replacement: {
          _id: a.id,
          source: "upload",
          createdAt: new Date(), // Will be ignored if document exists due to timestamps
          updatedAt: new Date(),
          ...a  // Spread all the uploaded asset data - this overwrites everything
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  logger.info({
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount
  }, "Bulk write operation completed");
}

export async function insertHostAssets(assets: HostAsset[]): Promise<void> {
  await ensureConnected();
  if (!assets.length) return;
  await HostAssetModel.bulkWrite(
    assets.map(a => ({
      replaceOne: {
        filter: { _id: a.ip },
        replacement: {
          _id: a.ip,
          source: "upload",
          createdAt: new Date(), // Will be ignored if document exists due to timestamps
          updatedAt: new Date(),
          ...a  // Spread all the uploaded asset data - this overwrites everything
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

// --- Reads ---
export async function getWebAssetById(id: string): Promise<WebAssetDoc | null> {
  await ensureConnected();
  const doc = await WebAssetModel.findById(id).lean().exec();
  return doc;
}

export async function getHostAssetById(id: string): Promise<HostAssetDoc | null> {
  await ensureConnected();
  const doc = await HostAssetModel.findById(id).lean().exec();
  return doc;
}

export async function listWebAssets(): Promise<WebAssetDoc[]> {
  await ensureConnected();
  const docs = await WebAssetModel.find({}).sort({ createdAt: -1 }).lean().exec();
  return docs;
}

export async function listHostAssets(): Promise<HostAssetDoc[]> {
  await ensureConnected();
  const docs = await HostAssetModel.find({}).sort({ createdAt: -1 }).lean().exec();
  return docs;
}