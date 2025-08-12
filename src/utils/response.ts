import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export type SuccessEnvelope<T> = { success: true; data: T };
export type ErrorEnvelope = { success: false; error: string; details?: unknown };

// Convert camelCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Recursively convert object keys from camelCase to snake_case
function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase);
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = toSnakeCase(key);
      converted[snakeKey] = convertKeysToSnakeCase(value);
    }
    return converted;
  }

  return obj;
}

/**
 * Send a success JSON response with snake_cased keys.
 * @param c Hono context.
 * @param data Response data to serialize.
 * @param status HTTP status code (default 200).
 * @returns JSON response with success envelope.
 */
export function ok<T>(c: Context, data: T, status: StatusCode = 200 as StatusCode) {
  const body: SuccessEnvelope<T> = { success: true, data };
  const convertedBody = convertKeysToSnakeCase(body);
  return c.json(convertedBody, status);
}

/**
 * Send an error JSON response with snake_cased keys.
 * @param c Hono context.
 * @param message Error message.
 * @param status HTTP status code (default 500).
 * @param details Optional error details.
 * @returns JSON response with error envelope.
 */
export function fail(c: Context, message: string, status: StatusCode = 500 as StatusCode, details?: unknown) {
  const body: ErrorEnvelope = { success: false, error: message, details };
  const convertedBody = convertKeysToSnakeCase(body);
  return c.json(convertedBody, status);
}