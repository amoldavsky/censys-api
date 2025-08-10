import { describe, test, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { routes } from "../../../../src/api/v1/assets/assets.routes.ts";
import type { AssetDto } from "../../../../src/api/v1/assets/models/asset.dto.ts";

// API Response types for testing
interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
}

describe("Assets Routes", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route("/api/v1/assets", routes);
  });

  test("should reject non-JSON POST requests", async () => {
    const req = new Request("http://localhost/api/v1/assets", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data"
      },
      body: "test data"
    });

    const res = await app.fetch(req);
    const data = await res.json() as ApiErrorResponse;

    expect(res.status).toBe(415);
    expect(data.success).toBe(false);
  });

  test("should create asset with valid JSON", async () => {
    const payload = {
      files: [{
        name: "test.txt",
        type: "text/plain",
        size: 100,
        content: "SGVsbG8gV29ybGQ="
      }]
    };

    const req = new Request("http://localhost/api/v1/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const res = await app.fetch(req);
    const data = await res.json() as ApiSuccessResponse<AssetDto>;

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.id).toBeDefined();
  });

  test("should get all assets", async () => {
    const req = new Request("http://localhost/api/v1/assets");
    const res = await app.fetch(req);
    const data = await res.json() as ApiSuccessResponse<AssetDto[]>;

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });



  test("should get asset by ID via hosts route", async () => {
    // First create an asset
    const createPayload = {
      files: [{
        name: "hosts.txt",
        type: "text/plain",
        size: 100,
        content: "dGVzdA=="
      }]
    };

    const createRes = await app.fetch(new Request("http://localhost/api/v1/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload)
    }));

    const createData = await createRes.json() as ApiSuccessResponse<AssetDto>;
    const assetId = createData.data.id;

    // Then get the asset via hosts route
    const req = new Request(`http://localhost/api/v1/assets/hosts/${assetId}`);
    const res = await app.fetch(req);
    const data = await res.json() as ApiSuccessResponse<AssetDto>;

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(assetId);
  });

  test("should get asset by ID via web route", async () => {
    // First create an asset
    const createPayload = {
      files: [{
        name: "web.html",
        type: "text/html",
        size: 100,
        content: "dGVzdA=="
      }]
    };

    const createRes = await app.fetch(new Request("http://localhost/api/v1/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPayload)
    }));

    const createData = await createRes.json() as ApiSuccessResponse<AssetDto>;
    const assetId = createData.data.id;

    // Then get the asset via web route
    const req = new Request(`http://localhost/api/v1/assets/web/${assetId}`);
    const res = await app.fetch(req);
    const data = await res.json() as ApiSuccessResponse<AssetDto>;

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(assetId);
  });

  test("should return 404 for non-existent asset via hosts route", async () => {
    const req = new Request("http://localhost/api/v1/assets/hosts/non-existent-id");
    const res = await app.fetch(req);
    const data = await res.json() as ApiErrorResponse;

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Asset not found");
  });

  test("should return 404 for non-existent asset via web route", async () => {
    const req = new Request("http://localhost/api/v1/assets/web/non-existent-id");
    const res = await app.fetch(req);
    const data = await res.json() as ApiErrorResponse;

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe("Asset not found");
  });
});
