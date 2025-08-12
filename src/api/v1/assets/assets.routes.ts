import { Hono } from "hono";
import { jsonOnlyMiddleware } from "@/app/middlewares/json-only";
import * as ctrl from "./assets.controller";

export const routes = new Hono().basePath("/assets");

// Map paths → controllers
routes.get("/web", jsonOnlyMiddleware, ctrl.listWebAssets);
routes.get("/web/:id", jsonOnlyMiddleware, ctrl.getWebAssetById);
routes.get("/web/:id/summary", jsonOnlyMiddleware, ctrl.getWebAssetSummary);
routes.delete("/web/:id", jsonOnlyMiddleware, ctrl.deleteWebAsset);

routes.get("/hosts", jsonOnlyMiddleware, ctrl.listHostAssets);
routes.get("/hosts/:id", jsonOnlyMiddleware, ctrl.getHostAssetById);
routes.get("/hosts/:id/summary", jsonOnlyMiddleware, ctrl.getHostAssetSummary);
routes.delete("/hosts/:id", jsonOnlyMiddleware, ctrl.deleteHostAsset);

// Upload endpoints (no jsonOnlyMiddleware)
routes.post("/web/upload", ctrl.uploadWebAssets);
routes.post("/hosts/upload", ctrl.uploadHostAssets);