import type { WebAsset, HostAsset } from "@/api/v1/assets/models/asset.schema";
import type {
  WebAssetResponseDTO,
  HostAssetResponseDTO,
  ListAssetsResponseDTO
} from "@/api/v1/assets/models/asset.dto";

// Web Asset Mappers
export function toWebAssetResponse(asset: WebAsset & { id?: string; source?: string; createdAt?: Date; updatedAt?: Date }): WebAssetResponseDTO {
  return {
    id: asset.id || "unknown",
    source: asset.source || "unknown",
    createdAt: asset.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: asset.updatedAt?.toISOString() || new Date().toISOString(),
    domains: asset.domains,
    certificateAuthority: asset.certificate_authority?.name as string | undefined,
    status: asset.validity_period?.status as string | undefined,
    risks: asset.security_analysis?.risk_level as string | undefined,
  };
}

export function toWebAssetListResponse(items: (WebAsset & { id?: string; source?: string; createdAt?: Date; updatedAt?: Date })[]): ListAssetsResponseDTO<WebAssetResponseDTO> {
  return {
    items: items.map(toWebAssetResponse),
    total: items.length,
  };
}

// Host Asset Mappers
export function toHostAssetResponse(asset: HostAsset & { id?: string; source?: string; createdAt?: Date; updatedAt?: Date }): HostAssetResponseDTO {
  return {
    id: asset.id || "unknown",
    source: asset.source || "unknown",
    createdAt: asset.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: asset.updatedAt?.toISOString() || new Date().toISOString(),
    ip: asset.ip,
    asName: asset.autonomous_system?.name as string | undefined,
    services: asset.services,
    risk: asset.threat_intelligence?.risk_level as string | undefined,
    location: asset.location,
  };
}

export function toHostAssetListResponse(items: (HostAsset & { id?: string; source?: string; createdAt?: Date; updatedAt?: Date })[]): ListAssetsResponseDTO<HostAssetResponseDTO> {
  return {
    items: items.map(toHostAssetResponse),
    total: items.length,
  };
}

