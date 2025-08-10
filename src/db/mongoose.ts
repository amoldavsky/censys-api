// src/db/mongoose.ts
import mongoose from "mongoose";

type ConnectOpts = {
  uri?: string;
  serverSelectionTimeoutMS?: number; // time to find a server
  socketTimeoutMS?: number;          // idle socket timeout
  maxPoolSize?: number;
  signal?: AbortSignal;
};

let connectInFlight: Promise<typeof mongoose> | null = null;

export async function connect(opts: ConnectOpts = {}) {
  if (isConnected()) return mongoose;

  if (connectInFlight) {
    try { return await connectInFlight; } catch { /* fall through and retry */ }
  }

  const {
    uri = process.env.MONGO_URL || "mongodb://localhost:27017/app",
    serverSelectionTimeoutMS = 10_000,
    socketTimeoutMS = 30_000,
    maxPoolSize = 10,
    signal,
  } = opts;

  const attempt = async (n: number): Promise<typeof mongoose> => {
    try {
      const p = mongoose.connect(uri, {
        serverSelectionTimeoutMS,
        socketTimeoutMS,
        maxPoolSize,
      });
      await withTimeout(p, serverSelectionTimeoutMS + 1_000, "mongo connect timeout", signal);
      return mongoose;
    } catch (err) {
      if (n < 3) {
        await sleep(250 * n);
        return attempt(n + 1);
      }
      throw err;
    }
  };

  connectInFlight = attempt(1).finally(() => { connectInFlight = null; });
  return connectInFlight;
}

export async function disconnect() {
  try {
    await mongoose.disconnect();
  } finally {
    connectInFlight = null;
  }
}

export function isConnected(): boolean {
  // 1 = connected, 2 = connecting
  return mongoose.connection.readyState === 1;
}

/**
 * Real round-trip check. Throws on failure.
 * Use in readiness checks.
 */
export async function ping({ timeoutMs = 2_000 }: { timeoutMs?: number } = {}) {
  if (!isConnected()) {
    return Promise.reject(new Error("not connected"));
  }
  if (!mongoose.connection || !mongoose.connection.db) {
    return Promise.resolve();
  }
  try {
    const call = mongoose.connection.db.admin().command({ping: 1});
    return withTimeout(call, timeoutMs, "mongo ping timeout");
  } catch (err) {
    return Promise.reject(err);
  }
}

// Helpers
function withTimeout<T>(p: Promise<T>, ms: number, reason = "timeout", signal?: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(reason)), ms);
    const onAbort = () => { clearTimeout(t); reject(new Error("aborted")); };
    signal?.addEventListener("abort", onAbort, { once: true });

    p.then(v => { clearTimeout(t); resolve(v); })
     .catch(e => { clearTimeout(t); reject(e); })
     .finally(() => signal?.removeEventListener("abort", onAbort));
  });
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));