import type { Context, Next } from "hono";
import logger from "@/utils/logger";

/**
 * Minimal request logging middleware using pino.
 * @param c Hono context.
 * @param next Next middleware function.
 * @returns Promise that resolves when middleware chain completes.
 */
export async function pinoLogger(c: Context, next: Next) {
  const start = performance.now();
  try {
    await next();
  } finally {
    const ms = Math.round(performance.now() - start);
    logger.info(
      {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ms,
      },
      `${c.req.method} ${c.req.path} -> ${c.res.status} ${ms}ms`
    );
  }
}