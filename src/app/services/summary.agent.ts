import type { WebAsset, HostAsset } from "@/api/v1/assets/models/asset.schema";
import logger from "@/utils/logger";

export interface SummaryJobPayload {
  asset: WebAsset | HostAsset;
  assetType: 'web' | 'host';
}

/**
 * Generate asset summary - placeholder implementation
 */
export async function generateSummary(payload: SummaryJobPayload): Promise<void> {
  const { asset, assetType } = payload;

  logger.info({ assetId: asset.id, assetType }, "Generating asset summary");

  // TODO: Implement actual agentic summary generation
  // Placeholder: simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  logger.info({ assetId: asset.id, assetType }, "Summary generation completed");
}
