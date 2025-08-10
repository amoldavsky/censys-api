import { Hono } from "hono";
import { jsonOnlyMiddleware } from "../../../app/middlewares/json-only";
import { registerErrorHandling } from "../../../app/middlewares/error-handler";
import * as controller from "./assets.controller.ts";

export const routes = new Hono().basePath("/assets");

// Global error handler
registerErrorHandling(routes);

// Global middleware
routes.use("*", jsonOnlyMiddleware);

// Assets
routes.get("/", controller.listAssets);
routes.post("/", controller.createAsset);

routes.get("/web", controller.listWebAssets);
routes.get("/web/:id", controller.getWebAssetById);

routes.get("/hosts", controller.listHostAssets);
routes.get("/hosts/:id", controller.getHostAssetById);
