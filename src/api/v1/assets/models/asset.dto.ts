import { z } from "zod";

export const AssetResponseDTO = z.object({
  id: z.string(),
  source: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AssetResponseDTO = z.infer<typeof AssetResponseDTO>;

export type ListAssetsResponseDTO = {
  items: AssetResponseDTO[];
  total: number;
};