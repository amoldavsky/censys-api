import { z } from "zod";
import { FileSchema, AssetType, AssetStatus } from "./asset.schema";

// Requests (what the API accepts)
export const CreateAssetRequestDTO = z.object({
  files: z.array(FileSchema).min(1),
});
export type CreateAssetRequestDTO = z.infer<typeof CreateAssetRequestDTO>;

// Responses (what the API returns)
export const AssetResponseDTO = z.object({
  id: z.string(),
  type: AssetType,
  status: AssetStatus,
  files: z.array(FileSchema),
  createdAt: z.string(),
  processingResults: z.unknown().optional(),
});
export type AssetResponseDTO = z.infer<typeof AssetResponseDTO>;

export type ListAssetsResponseDTO = {
  items: AssetResponseDTO[];
  total: number;
};