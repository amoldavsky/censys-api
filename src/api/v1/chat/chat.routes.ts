import { Hono } from "hono";
import { jsonOnlyMiddleware } from "@/app/middlewares/json-only";
import * as ctrl from "./chat.controller";

export const routes = new Hono().basePath("/chat");

// Chat endpoint - requires JSON content type
routes.post("/", jsonOnlyMiddleware, ctrl.chat);
