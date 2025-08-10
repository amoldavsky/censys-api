import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export type SuccessEnvelope<T> = { success: true; data: T };
export type ErrorEnvelope = { success: false; error: string; details?: unknown };

export function ok<T>(c: Context, data: T, status: StatusCode = 200 as StatusCode) {
  const body: SuccessEnvelope<T> = { success: true, data };
  return c.json(body, status);
}

export function fail(c: Context, message: string, status: StatusCode = 500 as StatusCode, details?: unknown) {
  const body: ErrorEnvelope = { success: false, error: message, details };
  return c.json(body, status);
}