import type { Context } from "hono";
import { ok, fail } from "../../utils/response";

/**
 * @swagger
 * /api/v1/assets/health:
 *   get:
 *     summary: Get service health status
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service health information
 */
export async function health(c: Context) {
  const data = await getServiceHealth();
  return ok(c, data);
}

export async function ready(c: Context) {
  const dbPing = async () => {
      const isHealthy = await databaseService.healthCheck();
      if (!isHealthy) throw new Error("Database health check failed");
      return isHealthy;
    };
    try {
      await dbPing();
      return ok(c, { status: 'ready' });
    } catch (err) {
      return fail(c, 'not-ready', 503, { error: 'database' });
    }
}

export async function info(c: Context) {
  return ok(c, {
      service: Bun.env.SERVICE_NAME ?? 'censys-api',
      version: Bun.env.APP_VERSION ?? '1.0.0',
      commit: Bun.env.GIT_SHA ?? 'unknown',
      env: Bun.env.NODE_ENV ?? 'development',
      runtime: 'Bun',
      nodeVersion: process.version,
    });
}