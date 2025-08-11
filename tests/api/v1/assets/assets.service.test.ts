import { describe, it, expect, mock, beforeEach } from "bun:test";
import { insertWebAssets } from "@/api/v1/assets/assets.service";
import type { WebAsset } from "@/api/v1/assets/models/asset.schema";
import webDataset from "./web_properties_dataset.json";

// Mock the store layer
const mockStoreInsertWebAssets = mock(() => Promise.resolve());
const mockGetWebAssetById = mock(() => Promise.resolve(null));

mock.module("@/api/v1/assets/assets.store", () => ({
  insertWebAssets: mockStoreInsertWebAssets,
  getWebAssetById: mockGetWebAssetById,
}));

describe("Assets Service", () => {
  beforeEach(() => {
    mockStoreInsertWebAssets.mockClear();
    mockGetWebAssetById.mockClear();
  });

  describe("insertWebAssets", () => {
    it("should handle empty array", async () => {
      const result = await insertWebAssets([]);
      
      expect(mockStoreInsertWebAssets).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it("should insert single web asset", async () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"],
        subject: { cn: "example.com" }
      };

      const mockStoredAsset = {
        _id: asset.fingerprint_sha256,
        source: "upload",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...asset
      };

      mockGetWebAssetById.mockResolvedValueOnce(mockStoredAsset);

      const result = await insertWebAssets([asset]);

      expect(mockStoreInsertWebAssets).toHaveBeenCalledWith([asset]);
      expect(mockGetWebAssetById).toHaveBeenCalledWith(asset.fingerprint_sha256);
      expect(result).toHaveLength(1);
      expect(result[0].fingerprint_sha256).toBe(asset.fingerprint_sha256);
    });

    it("should insert multiple web assets", async () => {
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

      const mockStoredAssets = assets.map(asset => ({
        _id: asset.fingerprint_sha256,
        source: "upload",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...asset
      }));

      mockGetWebAssetById
        .mockResolvedValueOnce(mockStoredAssets[0])
        .mockResolvedValueOnce(mockStoredAssets[1]);

      const result = await insertWebAssets(assets);

      expect(mockStoreInsertWebAssets).toHaveBeenCalledWith(assets);
      expect(mockGetWebAssetById).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
      expect(result[0].fingerprint_sha256).toBe(assets[0].fingerprint_sha256);
      expect(result[1].fingerprint_sha256).toBe(assets[1].fingerprint_sha256);
    });

    it("should handle store layer errors", async () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"]
      };

      mockStoreInsertWebAssets.mockRejectedValueOnce(new Error("Database connection failed"));

      await expect(insertWebAssets([asset])).rejects.toThrow("Database connection failed");
      expect(mockStoreInsertWebAssets).toHaveBeenCalledWith([asset]);
    });

    it("should handle missing assets after insertion", async () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"]
      };

      mockGetWebAssetById.mockResolvedValueOnce(null);

      await expect(insertWebAssets([asset])).rejects.toThrow();
      expect(mockStoreInsertWebAssets).toHaveBeenCalledWith([asset]);
      expect(mockGetWebAssetById).toHaveBeenCalledWith(asset.fingerprint_sha256);
    });

    it("should validate returned assets against schema", async () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["example.com"]
      };

      const invalidStoredAsset = {
        _id: asset.fingerprint_sha256,
        source: "upload",
        createdAt: new Date(),
        updatedAt: new Date(),
        fingerprint_sha256: "invalid", // Invalid SHA256
        domains: ["example.com"]
      };

      mockGetWebAssetById.mockResolvedValueOnce(invalidStoredAsset);

      await expect(insertWebAssets([asset])).rejects.toThrow();
      expect(mockStoreInsertWebAssets).toHaveBeenCalledWith([asset]);
    });

    it("should handle assets with optional fields", async () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        fingerprint_sha1: "1234567890abcdef12345678",
        fingerprint_md5: "1234567890abcdef12345678",
        domains: ["example.com", "www.example.com"],
        subject: { cn: "example.com", o: "Example Corp" },
        issuer: { cn: "CA Authority" },
        validity_period: { not_before: "2023-01-01", not_after: "2024-01-01" }
      };

      const mockStoredAsset = {
        _id: asset.fingerprint_sha256,
        source: "upload",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...asset
      };

      mockGetWebAssetById.mockResolvedValueOnce(mockStoredAsset);

      const result = await insertWebAssets([asset]);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(asset);
    });

    it("should process real web dataset", async () => {
      const realAssets = webDataset.certificates as WebAsset[];

      const mockStoredAssets = realAssets.map(asset => ({
        _id: asset.fingerprint_sha256,
        source: "upload",
        createdAt: new Date(),
        updatedAt: new Date(),
        ...asset
      }));

      // Mock each asset retrieval
      for (const mockAsset of mockStoredAssets) {
        mockGetWebAssetById.mockResolvedValueOnce(mockAsset);
      }

      const result = await insertWebAssets(realAssets);

      expect(mockStoreInsertWebAssets).toHaveBeenCalledWith(realAssets);
      expect(mockGetWebAssetById).toHaveBeenCalledTimes(realAssets.length);
      expect(result).toHaveLength(realAssets.length);

      // Verify each asset has the correct fingerprint
      for (let i = 0; i < result.length; i++) {
        expect(result[i].fingerprint_sha256).toBe(realAssets[i].fingerprint_sha256);
      }
    });
  });
});
