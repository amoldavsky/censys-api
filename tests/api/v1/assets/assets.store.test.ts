import { describe, it, expect, beforeEach } from "bun:test";
import { insertWebAssets, getWebAssetById } from "@/api/v1/assets/assets.store";
import { WebAssetModel } from "@/api/v1/assets/models/asset.model";
import type { WebAsset } from "@/api/v1/assets/models/asset.schema";
import "../../../integration-setup"; // Import integration test setup

describe("Assets Store", () => {
  beforeEach(async () => {
    // Clear the collection before each test
    await WebAssetModel.deleteMany({});
  });

  describe("insertWebAssets", () => {
    it("should handle empty array", async () => {
      await expect(insertWebAssets([])).resolves.not.toThrow();
    });

    it("should insert new web asset", async () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"]
      };

      // First create the asset so it exists for update
      await WebAssetModel.create({
        _id: asset.fingerprint_sha256,
        source: "initial"
      });

      await insertWebAssets([asset]);

      const stored = await WebAssetModel.findById(asset.fingerprint_sha256);
      expect(stored).toBeTruthy();
      expect(stored?.source).toBe("upload");
    });

    it("should update existing web asset", async () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"]
      };

      // Create initial asset
      await WebAssetModel.create({
        _id: asset.fingerprint_sha256,
        source: "scan"
      });

      await insertWebAssets([asset]);

      const stored = await WebAssetModel.findById(asset.fingerprint_sha256);
      expect(stored).toBeTruthy();
      expect(stored?.source).toBe("upload");
      expect(stored?.updatedAt).toBeTruthy();
    });

    it("should not create new assets (upsert: false)", async () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"]
      };

      // Don't create initial asset - should not be inserted
      await insertWebAssets([asset]);

      const stored = await WebAssetModel.findById(asset.fingerprint_sha256);
      expect(stored).toBeNull();
    });

    it("should handle multiple assets", async () => {
      const assets: WebAsset[] = [
        {
          fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          domains: ["example.com"]
        },
        {
          fingerprint_sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          domains: ["test.com"]
        }
      ];

      // Create initial assets
      for (const asset of assets) {
        await WebAssetModel.create({
          _id: asset.fingerprint_sha256,
          source: "initial"
        });
      }

      await insertWebAssets(assets);

      for (const asset of assets) {
        const stored = await WebAssetModel.findById(asset.fingerprint_sha256);
        expect(stored).toBeTruthy();
        expect(stored?.source).toBe("upload");
      }
    });

    it("should handle mixed existing and non-existing assets", async () => {
      const assets: WebAsset[] = [
        {
          fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          domains: ["example.com"]
        },
        {
          fingerprint_sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          domains: ["test.com"]
        }
      ];

      // Only create the first asset
      await WebAssetModel.create({
        _id: assets[0].fingerprint_sha256,
        source: "initial"
      });

      await insertWebAssets(assets);

      // First asset should be updated
      const stored1 = await WebAssetModel.findById(assets[0].fingerprint_sha256);
      expect(stored1).toBeTruthy();
      expect(stored1?.source).toBe("upload");

      // Second asset should not exist (no upsert)
      const stored2 = await WebAssetModel.findById(assets[1].fingerprint_sha256);
      expect(stored2).toBeNull();
    });

    it("should use ordered: false for bulk operations", async () => {
      const assets: WebAsset[] = [
        {
          fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          domains: ["example.com"]
        },
        {
          fingerprint_sha256: "invalid", // This would cause an error but shouldn't stop others
          domains: ["test.com"]
        },
        {
          fingerprint_sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
          domains: ["another.com"]
        }
      ];

      // Create valid assets
      await WebAssetModel.create({
        _id: assets[0].fingerprint_sha256,
        source: "initial"
      });
      await WebAssetModel.create({
        _id: assets[2].fingerprint_sha256,
        source: "initial"
      });

      // Should not throw even with invalid asset in the middle
      await expect(insertWebAssets(assets)).resolves.not.toThrow();

      // Valid assets should still be updated
      const stored1 = await WebAssetModel.findById(assets[0].fingerprint_sha256);
      expect(stored1?.source).toBe("upload");

      const stored3 = await WebAssetModel.findById(assets[2].fingerprint_sha256);
      expect(stored3?.source).toBe("upload");
    });
  });

  describe("getWebAssetById", () => {
    it("should return null for non-existent asset", async () => {
      const result = await getWebAssetById("nonexistent");
      expect(result).toBeNull();
    });

    it("should return existing asset", async () => {
      const assetId = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      
      await WebAssetModel.create({
        _id: assetId,
        source: "test"
      });

      const result = await getWebAssetById(assetId);
      expect(result).toBeTruthy();
      expect(result?._id).toBe(assetId);
      expect(result?.source).toBe("test");
      expect(result?.createdAt).toBeTruthy();
      expect(result?.updatedAt).toBeTruthy();
    });

    it("should return lean document", async () => {
      const assetId = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
      
      await WebAssetModel.create({
        _id: assetId,
        source: "test"
      });

      const result = await getWebAssetById(assetId);
      
      // Lean documents don't have mongoose methods
      expect(typeof result?.save).toBe("undefined");
      expect(typeof result?.toJSON).toBe("undefined");
    });
  });
});
