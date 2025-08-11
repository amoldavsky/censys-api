import type { Context } from "hono";
import { ok, fail } from "@/utils/response";
import {
  toWebAssetListResponse,
  toWebAssetResponse,
  toHostAssetListResponse,
  toHostAssetResponse
} from "@/api/v1/assets/assets.mapper";
import {
  toWebAssetSummaryResponse,
  toHostAssetSummaryResponse
} from "@/api/v1/assets/asset-summary.mapper";
import * as svc from "@/api/v1/assets/assets.service";
import * as summarySvc from "@/api/v1/assets/asset-summary.service";
import {type HostAsset, HostAssetSchema, type WebAsset, WebAssetSchema} from "@/api/v1/assets/models/asset.schema.ts";
import * as jobsService from "@/app/services/jobs";
import * as summaryAgent from "@/app/services/summary.agent";
import logger from "@/utils/logger";

// Register job handlers
jobsService.registerHandler('asset-summary', (payload) => summaryAgent.generateSummary(payload));


/**
 * @swagger
 * /api/v1/assets/web:
 *   get:
 *     summary: List web assets
 *     tags: [Assets]
 */
export async function listWebAssets(c: Context) {
  const items = await svc.getWebAssets();
  return ok(c, toWebAssetListResponse(items));
}

/**
 * @swagger
 * /api/v1/assets/web/{id}:
 *   get:
 *     summary: Get a web asset by id
 *     tags: [Assets]
 */
export async function getWebAssetById(c: Context) {
  const id = c.req.param("id");
  const asset = await svc.getWebAssetById(id);
  if (!asset) return fail(c, "not found", 404);
  return ok(c, toWebAssetResponse(asset));
}

/**
 * @swagger
 * /api/v1/assets/hosts:
 *   get:
 *     summary: List host assets
 *     tags: [Assets]
 */
export async function listHostAssets(c: Context) {
  const items = await svc.getHostAssets();
  return ok(c, toHostAssetListResponse(items));
}

/**
 * @swagger
 * /api/v1/assets/hosts/{id}:
 *   get:
 *     summary: Get a host asset by id
 *     tags: [Assets]
 */
export async function getHostAssetById(c: Context) {
  const id = c.req.param("id");
  const asset = await svc.getHostAssetById(id);
  if (!asset) return fail(c, "not found", 404);
  return ok(c, toHostAssetResponse(asset));
}

/**
 * @swagger
 * /api/v1/assets/web/upload:
 *   post:
 *     summary: Upload JSON (object with array or bare array) of web assets (overwrite existing only)
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JSON with an array field (e.g. `hosts`) or a bare array of items with `ip`
 *     responses:
 *       200: { description: Overwrote existing web assets; non-existing are ignored }
 *       415: { description: Only JSON file is accepted }
 *       412: { description: Malformed JSON or no array found }
 */
export async function uploadWebAssets(c: Context) {
  const ct = c.req.header("content-type") || "";
  if (!ct.startsWith("multipart/form-data")) return fail(c, "Only multipart/form-data is accepted for file uploads", 415);

  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail(c, "Missing file", 412);

  // Check file type - allow if no type specified, if it's application/json, or if filename ends with .json
  const isJsonFile = !file.type ||
                     file.type === "application/json" ||
                     file.name.toLowerCase().endsWith('.json');
  if (!isJsonFile) return fail(c, "Only JSON file is accepted", 415);

  let payload: any;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    return fail(c, "Malformed JSON file", 412);
  }

  const assetsRaw = payload.certificates;
  if (!assetsRaw) return fail(c, "Expected a JSON array (bare array) or an object containing an array (e.g. `hosts`)", 412);

  try {
    logger.info({ certificateCount: assetsRaw.length }, "Processing web assets from certificates");

    const assets: WebAsset[] = assetsRaw.map ((r: any, index: number) => {
      try {
        // Generate ID from domains if not provided
        if (!r.id && r.domains && r.domains.length > 0) {
          r.id = r.domains.reduce((shortest: string, current: string) =>
            current.length < shortest.length ? current : shortest
          );
        }
        return WebAssetSchema.parse(r);
      } catch (parseErr) {
        logger.error({ index, parseErr }, "Schema validation failed for web asset");
        throw parseErr;
      }
    });

    logger.info({ assetCount: assets.length }, "Schema validation passed for web assets");

    const assetsStored = await svc.insertWebAssets(assets); // overwrite existing only
    logger.info({ storedCount: assetsStored.length }, "Successfully stored web assets");

    // Queue summary generation jobs for each uploaded asset
    assetsStored.forEach(asset => {
      const jobId = jobsService.submitJob('asset-summary', {
        asset,
        assetType: 'web'
      });
      logger.info({ jobId, assetId: asset.id }, "Queued summary job for web asset");
    });

    return ok(c, toWebAssetListResponse(assetsStored), 200);
  } catch (err) {
    logger.error({ error: err }, "Web assets upload error");
    if (err instanceof Error && err.message.includes("must have at least one domain")) {
      return fail(c, "Web asset must have at least one domain", 412);
    }
    return fail(c, "Failed to save web assets", 500);
  }
}

/**
 * @swagger
 * /api/v1/assets/hosts/upload:
 *   post:
 *     summary: Upload JSON (object with array or bare array) of host assets (overwrite existing only)
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: JSON with an array field (e.g. `domains`) or a bare array of items with `domain`
 *     responses:
 *       200: { description: Overwrote existing host assets; non-existing are ignored }
 *       415: { description: Only JSON file is accepted }
 *       412: { description: Malformed JSON or no array found }
 */
export async function uploadHostAssets(c: Context) {
  const ct = c.req.header("content-type") || "";
  if (!ct.startsWith("multipart/form-data")) return fail(c, "Only multipart/form-data is accepted for file uploads", 415);

  const form = await c.req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail(c, "Missing file", 412);

  // Check file type - allow if no type specified, if it's application/json, or if filename ends with .json
  const isJsonFile = !file.type ||
                     file.type === "application/json" ||
                     file.name.toLowerCase().endsWith('.json');
  if (!isJsonFile) return fail(c, "Only JSON file is accepted", 415);

  let payload: any;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    return fail(c, "Malformed JSON file", 412);
  }

  const assetsRaw = payload.hosts;
  if (!assetsRaw) return fail(c, "Data malformed", 412);

  try {
    const assets: HostAsset[] = assetsRaw.map ((r: any) => {
      return HostAssetSchema.parse(r)
    });
    const assetsStored = await svc.insertHostAssets(assets);

    // Queue summary generation jobs for each uploaded asset
    assetsStored.forEach(asset => {
      const jobId = jobsService.submitJob('asset-summary', {
        asset,
        assetType: 'host'
      });
      logger.info({ jobId, assetId: asset.id }, "Queued summary job for host asset");
    });

    return ok(c, toHostAssetListResponse(assetsStored), 200);
  } catch (err) {
    return fail(c, "Failed to save host assets", 500);
  }
}

/**
 * @swagger
 * /api/v1/assets/web/{id}/summary:
 *   get:
 *     summary: Get a web asset summary by id
 *     tags: [Assets]
 */
export async function getWebAssetSummary(c: Context) {
  const id = c.req.param("id");
  const summary = await summarySvc.getWebAssetSummary(id);
  if (!summary) return fail(c, "not found", 404);
  return ok(c, toWebAssetSummaryResponse(summary));
}

/**
 * @swagger
 * /api/v1/assets/hosts/{id}/summary:
 *   get:
 *     summary: Get a host asset summary by id
 *     tags: [Assets]
 */
export async function getHostAssetSummary(c: Context) {
  const id = c.req.param("id");
  const summary = await summarySvc.getHostAssetSummary(id);
  if (!summary) return fail(c, "not found", 404);
  return ok(c, toHostAssetSummaryResponse(summary));
}