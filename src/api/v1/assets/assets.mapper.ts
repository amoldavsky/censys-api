import type { Asset } from "@/api/v1/assets/models/asset.schema";
import type { AssetResponseDTO, ListAssetsResponseDTO } from "@/api/v1/assets/models/asset.dto";

export function toAssetResponse(a: Asset): AssetResponseDTO {
  return {
    id: a.id,
    source: a.source,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export function toAssetListResponse(items: Asset[]): ListAssetsResponseDTO {
  return {
    items: items.map(toAssetResponse),
    total: items.length,
  };
}