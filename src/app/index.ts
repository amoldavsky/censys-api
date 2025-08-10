import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { routes as assetsRoutes } from "@/api/v1/assets/assets.routes.ts";
import * as mongoose from "../db/mongoose.ts";
import { routes as opsRoutes } from "../api/ops/ops.routes.ts";

// Initialize Hono app
const app = new Hono();

// Initialize database connection
await mongoose.connect();

// Initialize logger
// const appLogger = createLogger("censys-api");

// logger middleware
app.use("*", logger());
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

// 404 handler
app.notFound((c) => c.json({ error: "Not Found" }, 404));

// Error handler (last)
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal Server Error" }, 500);
});

// Start server (for Bun)
const port = parseInt(process.env.PORT || "3000");

// // Graceful shutdown
// const gracefulShutdown = async (signal: string) => {
//   // appLogger.info(`${signal} received. Starting graceful shutdown...`);
//   try {
//     await databaseService.disconnect();
//     appLogger.info("Database connection closed");
//   } catch (error) {
//     appLogger.error(error, "Error during database shutdown");
//   }
//   appLogger.info("Graceful shutdown completed");
//   process.exit(0);
// };
// process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
// process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Export the app for Bun
export default { port, fetch: app.fetch };