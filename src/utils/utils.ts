// helpers and utils

export function normalizeIp(s: string) : string {
    // add some more sophisticated logic here later
    return s.trim().toLowerCase();
}

export function normalizeDomain(s: string): string {
    // add some more sophisticated logic here later
    return s.trim().toLowerCase().replace(/\.$/, "");
}

export function extractArray(payload: unknown, keys: string[]): any[] | null {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    for (const k of keys) {
      const arr = (payload as any)[k];
      if (Array.isArray(arr)) return arr;
    }
  }
  return null;
}