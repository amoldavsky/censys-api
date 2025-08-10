import { z } from "zod";

// Core enums (source of truth)
export const AssetType = z.enum(["web", "host"]);
export type AssetTypeT = z.infer<typeof AssetType>;

export const AssetStatus = z.enum(["pending", "processing", "ready", "error"]);
export type AssetStatusT = z.infer<typeof AssetStatus>;

// Sub-schema for files
export const FileSchema = z.object({
  name: z.string(),
  type: z.string(),
  size: z.number().optional(),
  content: z.string().optional(), // consider storing externally if large
});
export type FileT = z.infer<typeof FileSchema>;

// Domain Asset shape used across service/repo
export const AssetSchema = z.object({
  id: z.string(),
  type: AssetType,
  status: AssetStatus,
  files: z.array(FileSchema).default([]),
  createdAt: z.string(), // ISO string
  processingResults: z.unknown().optional(),
});
export type Asset = z.infer<typeof AssetSchema>;