import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Hono } from "hono";
import { uploadWebAssets } from "@/api/v1/assets/assets.controller";
import type { WebAsset } from "@/api/v1/assets/models/asset.schema";
import webDataset from "./web_properties_dataset.json";

// Mock the service layer
const mockInsertWebAssets = mock(() => Promise.resolve([]));
mock.module("@/api/v1/assets/assets.service", () => ({
  insertWebAssets: mockInsertWebAssets,
}));

describe("uploadWebAssets Controller", () => {
  let app: Hono;

  beforeEach(() => {
    // Create a clean Hono app for each test without middleware
    app = new Hono();
    app.post("/upload", uploadWebAssets);
    mockInsertWebAssets.mockClear();
  });

  const createMockFile = (content: string, type = "application/json") => {
    return new File([content], "test.json", { type });
  };

  const createFormData = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return formData;
  };

  describe("Content-Type validation", () => {
    it("should reject non-multipart/form-data requests", async () => {
      const req = new Request("http://localhost/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(415);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Only multipart/form-data is accepted for file uploads");
    });

    it("should accept multipart/form-data requests", async () => {
      const validWebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"]
      };

      const file = createMockFile(JSON.stringify({ certificates: [validWebAsset] }));
      const formData = createFormData(file);

      mockInsertWebAssets.mockResolvedValueOnce([validWebAsset]);

      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);
    });
  });

  describe("File validation", () => {
    it("should reject requests without file", async () => {
      const formData = new FormData();
      
      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(412);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Missing file");
    });

    it("should reject non-JSON files", async () => {
      const file = createMockFile("not json", "text/plain");
      const formData = createFormData(file);

      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(415);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Only JSON file is accepted");
    });
  });

  describe("JSON parsing", () => {
    it("should reject malformed JSON", async () => {
      const file = createMockFile("{ invalid json");
      const formData = createFormData(file);

      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(412);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Malformed JSON file");
    });

    it("should reject JSON without certificates array", async () => {
      const file = createMockFile(JSON.stringify({ data: [] }));
      const formData = createFormData(file);

      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(412);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Expected a JSON array (bare array) or an object containing an array (e.g. `hosts`)");
    });
  });

  describe("Asset validation", () => {
    it("should reject invalid web assets", async () => {
      const invalidAsset = {
        fingerprint_sha256: "invalid", // Too short
        domains: ["example.com"]
      };
      
      const file = createMockFile(JSON.stringify({ certificates: [invalidAsset] }));
      const formData = createFormData(file);

      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Failed to save web assets");
    });

    it("should process valid web assets", async () => {
      const validAsset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"]
      };

      const file = createMockFile(JSON.stringify({ certificates: [validAsset] }));
      const formData = createFormData(file);

      mockInsertWebAssets.mockResolvedValueOnce([validAsset]);

      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(1);
      expect(mockInsertWebAssets).toHaveBeenCalledWith([validAsset]);
    });

    it("should process real web dataset", async () => {
      const file = createMockFile(JSON.stringify(webDataset));
      const formData = createFormData(file);

      mockInsertWebAssets.mockResolvedValueOnce(webDataset.certificates);

      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(webDataset.certificates.length);
      expect(mockInsertWebAssets).toHaveBeenCalledWith(webDataset.certificates);
    });
  });

  describe("Service layer errors", () => {
    it("should handle service layer failures", async () => {
      const validAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"]
      };
      
      const file = createMockFile(JSON.stringify({ certificates: [validAsset] }));
      const formData = createFormData(file);
      
      mockInsertWebAssets.mockRejectedValueOnce(new Error("Database error"));

      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Failed to save web assets");
    });
  });

  describe("Multiple assets", () => {
    it("should process multiple valid web assets", async () => {
      const validAssets = [
        {
          fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          domains: ["example.com"]
        },
        {
          fingerprint_sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          domains: ["test.com"]
        }
      ];

      const file = createMockFile(JSON.stringify({ certificates: validAssets }));
      const formData = createFormData(file);

      mockInsertWebAssets.mockResolvedValueOnce(validAssets);

      const req = new Request("http://localhost/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      expect(mockInsertWebAssets).toHaveBeenCalledWith(validAssets);
    });

    it("should validate real dataset structure", async () => {
      // Test that the real dataset has the expected structure
      expect(webDataset.certificates).toBeDefined();
      expect(Array.isArray(webDataset.certificates)).toBe(true);
      expect(webDataset.certificates.length).toBe(3);

      // Test first certificate structure
      const firstCert = webDataset.certificates[0];
      expect(firstCert.fingerprint_sha256).toBeDefined();
      expect(firstCert.fingerprint_sha256).toMatch(/^[0-9a-fA-F]{64}$/);
      expect(firstCert.domains).toBeDefined();
      expect(Array.isArray(firstCert.domains)).toBe(true);
    });
  });
});
