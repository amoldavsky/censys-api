import { z } from "zod";

// Web Asset Response DTO
export const WebAssetResponseDTO = z.object({
  id: z.string(),
  source: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  domains: z.array(z.string()).optional(),
  certificateAuthority: z.string().optional(),
  status: z.string().optional(),
  risks: z.string().optional(),
});
export type WebAssetResponseDTO = z.infer<typeof WebAssetResponseDTO>;

// Host Asset Response DTO
export const HostAssetResponseDTO = z.object({
  id: z.string(),
  source: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  ip: z.string().optional(),
  asName: z.string().optional(),
  services: z.array(z.any()).optional(),
  risk: z.string().optional(),
  location: z.any().optional(),
});
export type HostAssetResponseDTO = z.infer<typeof HostAssetResponseDTO>;

// Generic list response type - can be used with any asset DTO array
export type ListAssetsResponseDTO<T> = {
  items: T[];
  total: number;
};