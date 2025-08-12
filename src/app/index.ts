import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { routes as assetsRoutes } from "@/api/v1/assets/assets.routes";
import { routes as chatRoutes } from "@/api/v1/chat/chat.routes";
import * as mongoose from "@/db/mongoose";
import { routes as opsRoutes } from "@/api/ops/ops.routes";
import * as jobsService from "./services/jobs";
import { pinoLogger } from "./middlewares/pino-logger";
import logger from "@/utils/logger";
import { fail } from "@/utils/response";


// Initialize Hono app
const app = new Hono();

// Initialize database connection
await mongoose.connect();

// Pino logger middleware
app.use("*", pinoLogger);
// cors middleware
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Application start time for uptime calculation
const appStartTime = Date.now();

// Root endpoint - basic info
app.get("/", (c) =>
  c.json({
    message: "Censys API Server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - appStartTime) / 1000),
  })
);

// --- Ops Endpoints ---
app.route("/", opsRoutes); // /livez, /readyz, /info


// --- API v1 ---
app.route("/api/v1", assetsRoutes);
app.route("/api/v1", chatRoutes);

// 404 handler
app.notFound((c) => fail(c, "Not Found", 404));

// Error handler (last)
app.onError((err, c) => {
  logger.error({ err, path: c.req.path, method: c.req.method }, "Unhandled error");
  return fail(c, "Internal server error", 500);
});

// Start server (for Bun)
const port = parseInt(process.env.PORT || "3000");

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, "Starting graceful shutdown");
  try {
    await jobsService.shutdown();
    logger.info("Jobs service shutdown completed");

    await mongoose.disconnect();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error({ error }, "Error during shutdown");
  }
  logger.info("Graceful shutdown completed");
  process.exit(0);
};
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Export the app for Bun
export default { port, fetch: app.fetch };