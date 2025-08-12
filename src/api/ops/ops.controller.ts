import type { Context } from "hono";
import { ok, fail } from "@/utils/response";
import { ping as dbPing, isConnected as dbIsConnected } from "@/db/mongoose";
import * as jobsService from "@/app/services/jobs";

/**
 * Liveness: is the process up?
 * Exposed at GET /healthz
 */
/**
 * Liveness probe handler.
 * @param c Hono context.
 * @returns JSON response with service health status.
 */
export async function health(c: Context) {
  const db_connected = dbIsConnected();
  const queue = jobsService.getQueueStats();
  const jobs_ok = !queue.isPaused; // minimal signal
  return ok(c, {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    db_connected,
    jobs_ok,
    queue,
  });
}

/**
 * Readiness probe handler (checks DB).
 * @param c Hono context.
 * @returns JSON response indicating readiness status.
 */
export async function ready(c: Context) {
    try {
      await dbPing();
      return ok(c, { status: 'ready' });
    } catch (err) {
      return fail(c, 'not-ready', 503, { error: 'database' });
    }
}

/**
 * Service info endpoint.
 * @param c Hono context.
 * @returns JSON response with service metadata.
 */
export async function info(c: Context) {
  return ok(c, {
      service: Bun.env.SERVICE_NAME ?? 'censys-api',
      version: Bun.env.APP_VERSION ?? '1.0.0',
      commit: Bun.env.GIT_SHA ?? 'unknown',
      env: Bun.env.NODE_ENV ?? 'development',
      runtime: 'Bun',
      node_version: process.version,
    });
}

/**
 * Lightweight jobs queue status.
 * @param c Hono context.
 * @returns JSON response with queue statistics.
 */
export async function jobsStatus(c: Context) {
  const stats = jobsService.getQueueStats();
  return ok(c, stats);
}