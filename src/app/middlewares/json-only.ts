import type { Context, Next } from "hono";
import { fail } from "../../utils/response";

export async function jsonOnlyMiddleware(c: Context, next: Next) {
  const contentType = c.req.header("content-type");
  if (c.req.method === "POST" && (!contentType || !contentType.includes("application/json"))) {
    return fail(c, "Only JSON content is accepted", 415);
  }
  await next();
}