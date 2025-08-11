import type { Context, Next } from "hono";
import { fail } from "../../utils/response";
import camelcaseKeys from "camelcase-keys";

export async function jsonOnlyMiddleware(c: Context, next: Next) {
  const contentType = c.req.header("content-type");
  if (c.req.method === "POST" && (!contentType || !contentType.includes("application/json"))) {
    return fail(c, "Only JSON content is accepted", 415);
  }

  // For POST requests with JSON content, intercept and convert snake_case keys to camelCase
  if (c.req.method === "POST" && contentType && contentType.includes("application/json")) {
    // Override the req.json() method to return converted body
    const originalJson = c.req.json.bind(c.req);
    let convertedBodyCache: any = null;
    let hasBeenCalled = false;

    c.req.json = async () => {
      if (!hasBeenCalled) {
        try {
          const originalBody = await originalJson();
          convertedBodyCache = camelcaseKeys(originalBody, { deep: true });
          hasBeenCalled = true;
        } catch (error) {
          hasBeenCalled = true;
          throw error;
        }
      }
      return convertedBodyCache;
    };
  }

  await next();
}