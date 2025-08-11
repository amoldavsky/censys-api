import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { routes } from "@/api/v1/assets/assets.routes";
import { WebAssetModel } from "@/api/v1/assets/models/asset.model";
import type { WebAsset } from "@/api/v1/assets/models/asset.schema";
import webDataset from "./web_properties_dataset.json";
import "../../../integration-setup"; // Import integration test setup

describe("Web Assets Upload Integration", () => {
  let app: Hono;

  beforeEach(async () => {
    app = new Hono();
    app.route("/api/v1", routes);
    
    // Clear the collection before each test
    await WebAssetModel.deleteMany({});
  });

  const createMockFile = (content: string, type = "application/json") => {
    return new File([content], "test.json", { type });
  };

  const createFormData = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return formData;
  };

  describe("End-to-end upload flow with real dataset", () => {
    it("should successfully upload real web certificate dataset", async () => {
      const certificates = webDataset.certificates as WebAsset[];

      // Pre-create assets in database (since upsert is false)
      for (const cert of certificates) {
        await WebAssetModel.create({
          _id: cert.fingerprint_sha256,
          source: "scan"
        });
      }

      const file = createMockFile(JSON.stringify(webDataset));
      const formData = createFormData(file);

      const req = new Request("http://localhost/api/v1/assets/web/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(certificates.length);
      expect(body.data.total).toBe(certificates.length);

      // Verify assets were updated in database
      const storedAssets = await WebAssetModel.find({}).lean();
      expect(storedAssets).toHaveLength(certificates.length);

      for (const storedAsset of storedAssets) {
        expect(storedAsset.source).toBe("upload");
        expect(storedAsset.updatedAt).toBeTruthy();
      }
    });

    it("should validate real certificate data structure", async () => {
      // Verify the dataset structure matches our expectations
      expect(webDataset.metadata).toBeDefined();
      expect(webDataset.metadata.certificates_count).toBe(3);
      expect(webDataset.certificates).toHaveLength(3);

      // Test each certificate has required fields
      for (const cert of webDataset.certificates) {
        expect(cert.fingerprint_sha256).toMatch(/^[0-9a-fA-F]{64}$/);
        expect(cert.fingerprint_sha1).toMatch(/^[0-9a-fA-F]{40}$/);
        expect(cert.fingerprint_md5).toMatch(/^[0-9a-fA-F]{32}$/);
        expect(Array.isArray(cert.domains)).toBe(true);
        expect(cert.domains.length).toBeGreaterThan(0);
        expect(cert.subject).toBeDefined();
        expect(cert.issuer).toBeDefined();
      }
    });

    it("should only update existing assets (no upsert)", async () => {
      const webAssets: WebAsset[] = [
        {
          fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          domains: ["example.com"]
        },
        {
          fingerprint_sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          domains: ["test.com"]
        }
      ];

      // Only pre-create the first asset
      await WebAssetModel.create({
        _id: webAssets[0].fingerprint_sha256,
        source: "scan"
      });

      const payload = { certificates: webAssets };
      const file = createMockFile(JSON.stringify(payload));
      const formData = createFormData(file);

      const req = new Request("http://localhost/api/v1/assets/web/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      
      // Should only return the existing asset that was updated
      expect(body.data.items).toHaveLength(1);
      expect(body.data.items[0].id).toBe(webAssets[0].fingerprint_sha256);

      // Verify only one asset exists in database
      const storedAssets = await WebAssetModel.find({}).lean();
      expect(storedAssets).toHaveLength(1);
      expect(storedAssets[0]._id).toBe(webAssets[0].fingerprint_sha256);
      expect(storedAssets[0].source).toBe("upload");
    });

    it("should handle validation errors gracefully", async () => {
      const invalidAssets = [
        {
          fingerprint_sha256: "invalid", // Too short
          domains: ["example.com"]
        }
      ];

      const payload = { certificates: invalidAssets };
      const file = createMockFile(JSON.stringify(payload));
      const formData = createFormData(file);

      const req = new Request("http://localhost/api/v1/assets/web/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Failed to save web assets");

      // Verify no assets were stored
      const storedAssets = await WebAssetModel.find({}).lean();
      expect(storedAssets).toHaveLength(0);
    });

    it("should handle empty certificates array", async () => {
      const payload = { certificates: [] };
      const file = createMockFile(JSON.stringify(payload));
      const formData = createFormData(file);

      const req = new Request("http://localhost/api/v1/assets/web/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(0);
      expect(body.data.total).toBe(0);
    });

    it("should preserve asset metadata during upload", async () => {
      const webAsset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        fingerprint_sha1: "1234567890abcdef12345678",
        fingerprint_md5: "1234567890abcdef",
        domains: ["example.com", "www.example.com"],
        subject: {
          cn: "example.com",
          o: "Example Corp",
          l: "San Francisco",
          st: "CA",
          c: "US"
        },
        issuer: {
          cn: "Example CA",
          o: "Example Certificate Authority"
        },
        validity_period: {
          not_before: "2023-01-01T00:00:00Z",
          not_after: "2024-01-01T00:00:00Z"
        },
        key_info: {
          algorithm: "RSA",
          size: 2048
        }
      };

      // Pre-create asset
      await WebAssetModel.create({
        _id: webAsset.fingerprint_sha256,
        source: "scan"
      });

      const payload = { certificates: [webAsset] };
      const file = createMockFile(JSON.stringify(payload));
      const formData = createFormData(file);

      const req = new Request("http://localhost/api/v1/assets/web/upload", {
        method: "POST",
        body: formData,
      });

      const res = await app.request(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(1);

      const returnedAsset = body.data.items[0];
      expect(returnedAsset.id).toBe(webAsset.fingerprint_sha256);

      // Verify asset was updated in database
      const storedAsset = await WebAssetModel.findById(webAsset.fingerprint_sha256);
      expect(storedAsset?.source).toBe("upload");
    });
  });
});
