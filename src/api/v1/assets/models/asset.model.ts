import mongoose, { Schema, type InferSchemaType, Model } from "mongoose";

// Keep file shape aligned with DTO; tighten as needed
const FileSchema = new Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number },
    content: { type: String },
  },
  { _id: false }
);

const AssetSchema = new Schema(
  {
    // Use domain id as Mongo _id (string)
    _id: { type: String, required: true },
    type: { type: String, required: true, enum: ["web", "host"], index: true },
    status: { type: String, required: true, enum: ["pending", "processing", "ready", "error"], index: true },
    files: { type: [FileSchema], default: [] },
    processingResults: { type: Schema.Types.Mixed },
  },
  { versionKey: false, timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

AssetSchema.index({ createdAt: -1 });

export type AssetDoc = InferSchemaType<typeof AssetSchema> & { _id: string };
export const AssetModel: Model<AssetDoc> =
  (mongoose.models.Asset as Model<AssetDoc>) ?? mongoose.model<AssetDoc>("Asset", AssetSchema);