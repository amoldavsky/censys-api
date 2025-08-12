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
import { jobs, type Job } from "@/app/services/jobs";
import {type HostAsset, HostAssetSchema, type WebAsset, WebAssetSchema} from "@/api/v1/assets/models/asset.schema";
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
/**
 * List web assets.
 * @param c Hono context.
 * @returns JSON response with web assets list.
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
/**
 * Get a web asset by id.
 * @param c Hono context.
 * @returns JSON response with web asset or 404 if not found.
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
/**
 * List host assets.
 * @param c Hono context.
 * @returns JSON response with host assets list.
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
/**
 * Get a host asset by id.
 * @param c Hono context.
 * @returns JSON response with host asset or 404 if not found.
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
 *     summary: Upload JSON (object with array or bare array) of web assets (create new or update existing)
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
 *       200: { description: Created new or updated existing web assets }
 *       415: { description: Only JSON file is accepted }
 *       412: { description: Malformed JSON or no array found }
 */
/**
 * Upload and upsert web assets from multipart JSON file.
 * @param c Hono context.
 * @returns JSON response with processed web assets or error.
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

    const assetsStored = await svc.insertWebAssets(assets); // create new or update existing
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
 *     summary: Upload JSON (object with array or bare array) of host assets (create new or update existing)
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
 *       200: { description: Created new or updated existing host assets }
 *       415: { description: Only JSON file is accepted }
 *       412: { description: Malformed JSON or no array found }
 */
/**
 * Upload and upsert host assets from multipart JSON file.
 * @param c Hono context.
 * @returns JSON response with processed host assets or error.
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
  if (!assetsRaw) {
    logger.error({ payload: Object.keys(payload) }, "Expected 'hosts' array in payload");
    return fail(c, "Expected a JSON object containing a 'hosts' array", 412);
  }

  if (!Array.isArray(assetsRaw)) {
    logger.error({ assetsRawType: typeof assetsRaw }, "Expected 'hosts' to be an array");
    return fail(c, "Expected 'hosts' to be an array", 412);
  }

  try {
    logger.info({ hostCount: assetsRaw.length }, "Processing host assets");

    const assets: HostAsset[] = assetsRaw.map((r: any, index: number) => {
      try {
        // Ensure ID is set before validation (use ip as fallback if id is missing)
        if (!r.id && r.ip) {
          r.id = r.ip;
        } else if (!r.id && !r.ip) {
          throw new Error(`Host asset at index ${index} must have either 'id' or 'ip' field`);
        }
        return HostAssetSchema.parse(r);
      } catch (parseErr) {
        logger.error({ index, parseErr, asset: r }, "Schema validation failed for host asset");
        throw parseErr;
      }
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
    logger.error({ error: err }, "Host assets upload error");
    return fail(c, "Failed to save host assets", 500);
  }
}

/**
 * @swagger
 * /api/v1/assets/web/{id}:
 *   delete:
 *     summary: Delete a web asset and its summary
 *     tags: [Assets]
 */
/**
 * Delete a web asset and its summary; cancels active jobs.
 * @param c Hono context.
 * @returns JSON response confirming deletion or 404 if not found.
 */
export async function deleteWebAsset(c: Context) {
  try {
    const id = c.req.param("id");

    // Find and cancel any in-progress summary jobs
    const activeJobs = jobsService.findJobsByAssetId(id);
    activeJobs.forEach(job => {
      jobsService.cancelJob(job.id);
      logger.info({ jobId: job.id, assetId: id }, "Cancelled summary job for web asset deletion");
    });

    // Delete summary first
    await summarySvc.deleteWebAssetSummary(id);

    // Delete asset
    const deleted = await svc.deleteWebAsset(id);
    if (!deleted) return fail(c, "Asset not found", 404);

    return ok(c, { message: "Web asset deleted successfully" });
  } catch (err) {
    logger.error({ error: err }, "Web asset deletion error");
    return fail(c, "Failed to delete web asset", 500);
  }
}

/**
 * @swagger
 * /api/v1/assets/hosts/{id}:
 *   delete:
 *     summary: Delete a host asset and its summary
 *     tags: [Assets]
 */
/**
 * Delete a host asset and its summary; cancels active jobs.
 * @param c Hono context.
 * @returns JSON response confirming deletion or 404 if not found.
 */
export async function deleteHostAsset(c: Context) {
  try {
    const id = c.req.param("id");

    // Find and cancel any in-progress summary jobs
    const activeJobs = jobsService.findJobsByAssetId(id);
    activeJobs.forEach(job => {
      jobsService.cancelJob(job.id);
      logger.info({ jobId: job.id, assetId: id }, "Cancelled summary job for host asset deletion");
    });

    // Delete summary first
    await summarySvc.deleteHostAssetSummary(id);

    // Delete asset
    const deleted = await svc.deleteHostAsset(id);
    if (!deleted) return fail(c, "Asset not found", 404);

    return ok(c, { message: "Host asset deleted successfully" });
  } catch (err) {
    logger.error({ error: err }, "Host asset deletion error");
    return fail(c, "Failed to delete host asset", 500);
  }
}

/**
 * @swagger
 * /api/v1/assets/web/{id}/summary:
 *   get:
 *     summary: Get a web asset summary by id
 *     tags: [Assets]
 */
/**
 * Get web asset summary or job status.
 * @param c Hono context.
 * @returns JSON response with summary, job status, or 404 if not found.
 */
export async function getWebAssetSummary(c: Context) {
  const id = c.req.param("id");

  // Check if summary exists
  const summary = await summarySvc.getWebAssetSummary(id);
  if (summary) {
    // Add status field to indicate completion - added because we do not have a proper jobs queue system with persisted tracking
    const summaryWithStatus = { ...summary, status: "complete" as const };
    return ok(c, toWebAssetSummaryResponse(summaryWithStatus));
  }

  // Check if there's an active summary generation job
  const activeJob = findActiveSummaryJob(id, 'web');
  if (activeJob) {
    return ok(c, { status: activeJob.status });
  }

  // No summary and no active job
  return fail(c, "not found", 404);
}

/**
 * @swagger
 * /api/v1/assets/hosts/{id}/summary:
 *   get:
 *     summary: Get a host asset summary by id
 *     tags: [Assets]
 */
/**
 * Get host asset summary or job status.
 * @param c Hono context.
 * @returns JSON response with summary, job status, or 404 if not found.
 */
export async function getHostAssetSummary(c: Context) {
  const id = c.req.param("id");

  // Check if summary exists
  const summary = await summarySvc.getHostAssetSummary(id);
  if (summary) {
    // Add status field to indicate completion - added because we do not have a proper jobs queue system with persisted tracking
    const summaryWithStatus = { ...summary, status: "complete" as const };
    return ok(c, toHostAssetSummaryResponse(summaryWithStatus));
  }

  // Check if there's an active summary generation job
  const activeJob = findActiveSummaryJob(id, 'host');
  if (activeJob) {
    return ok(c, { status: activeJob.status });
  }

  // Check if there's a failed job that could be retried
  const failedJob = findFailedSummaryJob(id, 'host');
  if (failedJob) {
    return ok(c, {
      status: "failed",
      message: "Summary generation failed.",
      canRetry: true
    });
  }

  // No summary and no job found - asset might not exist
  const asset = await svc.getHostAssetById(id);
  if (!asset) {
    return fail(c, "Asset not found", 404);
  }

  // Asset exists but no summary job was created
  return ok(c, {
    status: "not_started",
    message: "Summary generation has not been initiated for this asset"
  });
}

// --- Helper Functions ---

/**
 * Find active summary job for a specific asset
 * Located in controller layer since it's used for response logic
 */
function findActiveSummaryJob(assetId: string, assetType: 'web' | 'host'): Job | null {
  for (const job of jobs.values()) {
    if (job.type === 'asset-summary' &&
        (job.status === 'pending' || job.status === 'processing') &&
        job.payload?.asset?.id === assetId &&
        job.payload?.assetType === assetType) {
      return job;
    }
  }
  return null;
}

/**
 * Find failed summary job for a specific asset
 */
function findFailedSummaryJob(assetId: string, assetType: 'web' | 'host'): Job | null {
  for (const job of jobs.values()) {
    if (job.type === 'asset-summary' &&
        job.status === 'failed' &&
        job.payload?.asset?.id === assetId &&
        job.payload?.assetType === assetType) {
      return job;
    }
  }
  return null;
}