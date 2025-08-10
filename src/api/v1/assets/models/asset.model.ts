import mongoose, { Schema, Model } from "mongoose";

//--------- Schemas
export type _BaseAsset = {
  _id: string;      // asset id (ip for web assets, domain for host assets)
  source: string;   // the source of the asset (e.g. "upload", "scan")
  createdAt: Date;
  updatedAt: Date;
};

// Web assets collection
const WebAssetSchema = new Schema<_BaseAsset>(
  {
    _id: { type: String, required: true },
    source: { type: String, required: true },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);
WebAssetSchema.index({ createdAt: -1 });

// Host assets collection
const HostAssetSchema = new Schema<_BaseAsset>(
  {
    _id: { type: String, required: true },
    source: { type: String, required: true },
  },
  {
    versionKey: false,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  }
);
HostAssetSchema.index({ createdAt: -1 });

//--------- Types
export type WebAssetDoc = _BaseAsset;
export type HostAssetDoc = _BaseAsset;

//--------- Models
export const WebAssetModel: Model<WebAssetDoc> =
  (mongoose.models.WebAsset as Model<WebAssetDoc>) ??
  mongoose.model<WebAssetDoc>("WebAsset", WebAssetSchema, "web_assets");

export const HostAssetModel: Model<HostAssetDoc> =
  (mongoose.models.HostAsset as Model<HostAssetDoc>) ??
  mongoose.model<HostAssetDoc>("HostAsset", HostAssetSchema, "host_assets");