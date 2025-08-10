import type { Context } from "hono";
import { ok, fail } from "../../../utils/response";
import { CreateAssetRequestDTO } from "./models/asset.dto";
import { toAssetListResponse, toAssetResponse } from "./assets.mapper";
import * as svc from "./assets.service";

/**
 * @swagger
 * /api/v1/assets:
 *   get:
 *     summary: List assets
 *     tags: [Assets]
 *     responses:
 *       200: { description: List of assets }
 */
export async function listAssets(c: Context) {
  const items = await svc.getAssets();
  return ok(c, toAssetListResponse(items));
}

/**
 * @swagger
 * /api/v1/assets/{id}:
 *   get:
 *     summary: Get asset by id
 *     tags: [Assets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Asset }
 *       404: { description: Not found }
 */
export async function getAssetById(c: Context) {
  const id = c.req.param("id");
  const asset = await svc.getAssetById(id);
  if (!asset) return fail(c, "Asset not found", 404);
  return ok(c, toAssetResponse(asset));
}

/**
 * @swagger
 * /api/v1/assets:
 *   post:
 *     summary: Create asset
 *     tags: [Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateAssetRequestDTO' }
 *     responses:
 *       201: { description: Created }
 *       412: { description: Malformed request }
 */
export async function createAsset(c: Context) {
  const body = await c.req.json();
  const parsed = CreateAssetRequestDTO.safeParse(body);
  if (!parsed.success) return fail(c, "Malformed request", 412, parsed.error.flatten());
  const created = await svc.createAssetFromFiles(parsed.data.files);
  return ok(c, toAssetResponse(created), 201);
}

/**
 * @swagger
 * /api/v1/assets/web:
 *   get:
 *     summary: List web assets
 *     tags: [Assets]
 */
export async function listWebAssets(c: Context) {
  const items = await svc.getWebAssets();
  return ok(c, toAssetListResponse(items));
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
  return ok(c, toAssetListResponse(items));
}