import { Hono } from "hono";
import { jsonOnlyMiddleware } from "@/app/middlewares/json-only";
import { registerErrorHandling } from "@/app/middlewares/error-handler";
import * as ctrl from "./assets.controller";

export const routes = new Hono().basePath("/assets");
registerErrorHandling(routes);

// Map paths → controllers
routes.get("/web", jsonOnlyMiddleware, ctrl.listWebAssets);
routes.get("/web/:id", jsonOnlyMiddleware, ctrl.getWebAssetById);
routes.get("/hosts", jsonOnlyMiddleware, ctrl.listHostAssets);
routes.get("/hosts/:id", jsonOnlyMiddleware, ctrl.getHostAssetById);

// Upload endpoints (no jsonOnlyMiddleware - they handle their own validation)
routes.post("/web/upload", ctrl.uploadWebAssets);
routes.post("/hosts/upload", ctrl.uploadHostAssets);