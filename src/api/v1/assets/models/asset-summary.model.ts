import mongoose, { Schema, Model } from "mongoose";

//--------- Base Summary Type
export type _BaseAssetSummary = {
  _id: string;      // asset id (matches the asset it summarizes)
  summary: string;
  severity: "low" | "medium" | "high" | "critical";
  evidence: Record<string, any>;
  evidence_extras?: string;
  findings: string[];
  recommendations: string[];
  assumptions: string[];
  data_coverage: {
    fields_present_pct: number;
    missing_fields: string[];
  };
  createdAt: Date;
  updatedAt: Date;
};

// Web Asset Summary Schema
const WebAssetSummarySchema = new Schema<_BaseAssetSummary>(
  {
    _id: { type: String, required: true },
    summary: { type: String, required: true },
    severity: { 
      type: String, 
      required: true, 
      enum: ["low", "medium", "high", "critical"] 
    },
    evidence: { type: Schema.Types.Mixed, required: true },
    evidence_extras: { type: String },
    findings: { type: [String], required: true },
    recommendations: { type: [String], required: true },
    assumptions: { type: [String], required: true },
    data_coverage: {
      fields_present_pct: { type: Number, required: true, min: 0, max: 100 },
      missing_fields: { type: [String], required: true }
    }
  },
  {
    versionKey: false,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    strict: false,  // Allow additional fields not defined in schema
  }
);
WebAssetSummarySchema.index({ createdAt: -1 });

// Host Asset Summary Schema
const HostAssetSummarySchema = new Schema<_BaseAssetSummary>(
  {
    _id: { type: String, required: true },
    summary: { type: String, required: true },
    severity: { 
      type: String, 
      required: true, 
      enum: ["low", "medium", "high", "critical"] 
    },
    evidence: { type: Schema.Types.Mixed, required: true },
    evidence_extras: { type: String },
    findings: { type: [String], required: true },
    recommendations: { type: [String], required: true },
    assumptions: { type: [String], required: true },
    data_coverage: {
      fields_present_pct: { type: Number, required: true, min: 0, max: 100 },
      missing_fields: { type: [String], required: true }
    }
  },
  {
    versionKey: false,
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    strict: false,  // Allow additional fields not defined in schema
  }
);
HostAssetSummarySchema.index({ createdAt: -1 });

//--------- Types
export type WebAssetSummaryDoc = _BaseAssetSummary;
export type HostAssetSummaryDoc = _BaseAssetSummary;

//--------- Models
export const WebAssetSummaryModel: Model<WebAssetSummaryDoc> =
  (mongoose.models.WebAssetSummary as Model<WebAssetSummaryDoc>) ??
  mongoose.model<WebAssetSummaryDoc>("WebAssetSummary", WebAssetSummarySchema, "web_asset_summaries");

export const HostAssetSummaryModel: Model<HostAssetSummaryDoc> =
  (mongoose.models.HostAssetSummary as Model<HostAssetSummaryDoc>) ??
  mongoose.model<HostAssetSummaryDoc>("HostAssetSummary", HostAssetSummarySchema, "host_asset_summaries");
