import type { Context } from "hono";
// @ts-ignore
import type {ContentfulStatusCode} from "hono/dist/types/utils/http-status";

export type SuccessEnvelope<T> = {
  success: true;
  data: T;
};

export type ErrorEnvelope = {
  success: false;
  error: string;
  details?: unknown;
};

export function ok<T>(c: Context, data: T, status = 200) {
  const body: SuccessEnvelope<T> = { success: true, data };
  return c.json(body, status as ContentfulStatusCode);
}

export function fail(c: Context, message: string, status = 500, details?: unknown) {
  const body: ErrorEnvelope = { success: false, error: message, details };
  return c.json(body, status as ContentfulStatusCode);
}