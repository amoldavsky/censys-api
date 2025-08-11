import { Hono } from "hono";
import { jsonOnlyMiddleware } from "@/app/middlewares/json-only";
import { registerErrorHandling } from "@/app/middlewares/error-handler";
import * as ctrl from "./chat.controller";

export const routes = new Hono().basePath("/chat");
registerErrorHandling(routes);

// Chat endpoint - requires JSON content type
routes.post("/", jsonOnlyMiddleware, ctrl.chat);
