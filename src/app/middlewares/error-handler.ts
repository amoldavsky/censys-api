import type { Context } from "hono";
import { fail } from "../../utils/response";

/**
 * Registers a global error handler via Hono's onError hook.
 * Use from where you create your app (e.g., app.ts or inside routes module).
 */
export function registerErrorHandling<T>(app: { onError: (fn: (err: Error, c: Context) => Response | Promise<Response>) => void }) {
  app.onError((err, c) => {
    // Central place to log/annotate errors (Datadog, Sentry, etc.)
    console.error("Unhandled error:", err);
    return fail(c, "Internal server error", 500);
  });
}