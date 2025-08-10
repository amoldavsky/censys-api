import { Hono } from "hono";
import { jsonOnlyMiddleware } from "@/app/middlewares/json-only";
import { registerErrorHandling } from "@/app/middlewares/error-handler";
import * as ctrl from "./assets.controller";

export const routes = new Hono().basePath("/assets");
registerErrorHandling(routes);
routes.use("*", jsonOnlyMiddleware);

// Map paths → controllers
routes.get("/web", ctrl.listWebAssets);
routes.get("/web/:id", ctrl.getWebAssetById);
routes.get("/hosts", ctrl.listHostAssets);
routes.get("/hosts/:id", ctrl.getHostAssetById);

// New JSON file upload endpoints
routes.post("/web/upload", ctrl.uploadWebAssets);
routes.post("/hosts/upload", ctrl.uploadHostAssets);