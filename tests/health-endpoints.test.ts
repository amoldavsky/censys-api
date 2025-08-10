import { describe, test, expect } from "bun:test";
import { Hono } from "hono";
import { health } from "../src/api/ops/ops.routes.ts";
import { metrics } from "../src/api/ops/metrics";

// Ops endpoints tests (Kubernetes style)
describe("Ops Endpoints", () => {
  const app = new Hono();

  // Mock dependencies
  const deps = {
    database: {
      ping: async () => {
        // Mock successful ping for tests
      },
      isConnected: () => true
    }
  };

  // Mount the routes
  app.route('/', health(deps));
  app.route('/', metrics());



  describe("Kubernetes Health Endpoints", () => {
    test("GET /livez should return liveness status", async () => {
      const req = new Request("http://localhost/livez");
      const res = await app.fetch(req);
      const data = await res.json() as any;

      expect(res.status).toBe(200);
      expect(data.status).toBe("ok");
    });

    test("GET /readyz should return readiness status", async () => {
      const req = new Request("http://localhost/readyz");
      const res = await app.fetch(req);
      const data = await res.json() as any;

      expect(res.status).toBe(200); // Should be 200 since we mock successful ping
      expect(data.status).toBe("ready");
    });

    test("GET /readyz should return 503 when dependencies fail", async () => {
      // Create a new app with failing dependencies
      const failingDeps = {
        database: {
          ping: async () => {
            throw new Error("Database connection failed");
          },
          isConnected: () => false
        }
      };

      const failingApp = new Hono();
      failingApp.route('/', health(failingDeps));

      const req = new Request("http://localhost/readyz");
      const res = await failingApp.fetch(req);
      const data = await res.json() as any;

      expect(res.status).toBe(503);
      expect(data.status).toBe("not-ready");
      expect(data.error).toBe("database");
    });
  });

  describe("Info Endpoint", () => {
    test("GET /info should return application info", async () => {
      const req = new Request("http://localhost/info");
      const res = await app.fetch(req);
      const data = await res.json() as any;

      expect(res.status).toBe(200);
      expect(data.service).toBe("censys-api");
      expect(data.version).toBeDefined();
      expect(data.env).toBeDefined();
      expect(data.runtime).toBe("Bun");
      expect(data.nodeVersion).toBeDefined();
    });
  });

  describe("Metrics Endpoint", () => {
    test("GET /metrics should return Prometheus metrics", async () => {
      const req = new Request("http://localhost/metrics");
      const res = await app.fetch(req);
      const text = await res.text();

      expect(res.status).toBe(200);
      expect(text).toContain("# HELP");
      expect(text).toContain("# TYPE");
    });
  });
});
