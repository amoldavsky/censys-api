import type { Asset } from "./models/asset.schema";
import type { AssetResponseDTO, ListAssetsResponseDTO } from "./models/asset.dto";

export function toAssetResponse(a: Asset): AssetResponseDTO {
  return {
    id: a.id,
    type: a.type,
    status: a.status,
    files: a.files,
    createdAt: a.createdAt,
    processingResults: a.processingResults,
  };
}

export function toAssetListResponse(items: Asset[]): ListAssetsResponseDTO {
  return {
    items: items.map(toAssetResponse),
    total: items.length,
  };
}