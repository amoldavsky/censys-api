import * as db from "../../../db/mongoose";
import { AssetModel, type AssetDoc } from "./models/asset.model";
import type { Asset, AssetStatusT as AssetStatus, AssetTypeT as AssetType } from "./models/asset.schema";

type AssetLean = Pick<AssetDoc, "_id" | "type" | "status" | "files" | "processingResults"> & {
  createdAt?: Date | string;
};

function toDomain(doc: AssetLean): Asset {
  return {
    id: doc._id,
    type: doc.type as AssetType,
    files: (doc as any).files ?? [],
    status: doc.status as AssetStatus,
    createdAt: (doc as any).createdAt instanceof Date
      ? (doc as any).createdAt.toISOString()
      : new Date((doc as any).createdAt).toISOString(),
    processingResults: (doc as any).processingResults,
  } as Asset;
}

async function ensureConnected() {
  if (!db.isConnected()) await db.connect();
}

export async function upsertAsset(asset: Asset): Promise<void> {
  await ensureConnected();
  const createdAt = asset.createdAt ? new Date(asset.createdAt) : undefined;
  await AssetModel.updateOne(
    { _id: asset.id },
    {
      $set: {
        type: asset.type,
        status: asset.status,
        files: asset.files,
        processingResults: asset.processingResults ?? undefined,
      },
      ...(createdAt ? { $setOnInsert: { _id: asset.id, createdAt } } : { $setOnInsert: { _id: asset.id } }),
    },
    { upsert: true }
  ).exec();
}

export async function getAssetById(id: string): Promise<Asset | null> {
  await ensureConnected();
  const doc = await AssetModel.findById(id).lean().exec();
  return doc ? toDomain(doc as any) : null;
}

export async function listAssets(): Promise<Asset[]> {
  await ensureConnected();
  const docs = await AssetModel.find({}).sort({ createdAt: -1 }).lean().exec();
  return docs.map((d) => toDomain(d as any));
}

export async function removeAsset(id: string): Promise<boolean> {
  await ensureConnected();
  const res = await AssetModel.deleteOne({ _id: id }).exec();
  return (res.deletedCount ?? 0) > 0;
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
  await ensureConnected();
  const $set: Record<string, any> = {};
  if (updates.type !== undefined) $set.type = updates.type;
  if (updates.files !== undefined) $set.files = updates.files;
  if (updates.status !== undefined) $set.status = updates.status;
  if (updates.processingResults !== undefined) $set.processingResults = updates.processingResults;
  if (updates.createdAt !== undefined) $set.createdAt = new Date(updates.createdAt);

  const doc = await AssetModel.findOneAndUpdate({ _id: id }, { $set }, { new: true })
    .lean()
    .exec();

  return doc ? toDomain(doc as any) : null;
}

export async function findAssetsByStatus(status: AssetStatus): Promise<Asset[]> {
  await ensureConnected();
  const docs = await AssetModel.find({ status }).lean().exec();
  return docs.map((d) => toDomain(d as any));
}

export async function findAssetsByType(type: AssetType): Promise<Asset[]> {
  await ensureConnected();
  const docs = await AssetModel.find({ type }).lean().exec();
  return docs.map((d) => toDomain(d as any));
}

export async function clearAssets(): Promise<void> {
  await ensureConnected();
  await AssetModel.deleteMany({}).exec();
}