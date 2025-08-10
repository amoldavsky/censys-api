import { describe, test, expect } from "bun:test";
import { createAsset, getAssets } from "../../../../src/api/v1/assets/assets.service.ts";
import type { Asset, AssetFile } from "../../../../src/api/v1/assets/assets.service.ts";

describe("AssetsService", () => {

  describe("createAsset", () => {
    test("should create asset with valid data", async () => {
      const testFile: AssetFile = {
        name: "test.txt",
        type: "text/plain",
        size: 100,
        content: "SGVsbG8gV29ybGQ=",
      };

      const assetToCreate: Asset = {
        id: "test-asset-id",
        type: "host",
        files: [testFile],
        status: "processing",
        createdAt: new Date().toISOString(),
      } as Asset;

      const asset = await createAsset(assetToCreate);

      expect(asset.id).toBe("test-asset-id");
      expect(asset.files).toHaveLength(1);
      expect(asset.files[0]).toEqual(testFile);
      expect(asset.status).toBe("processing");
      expect(asset.createdAt).toBeDefined();
    });

    test("should handle multiple files", async () => {
      const files: AssetFile[] = [
        {
          name: "file1.txt",
          type: "text/plain",
          size: 50,
          content: "ZmlsZTE=",
        },
        {
          name: "file2.json",
          type: "application/json",
          size: 75,
          content: "eyJ0ZXN0IjoidmFsdWUifQ==",
        }
      ];

      const assetToCreate: Asset = {
        id: "test-multi-asset-id",
        type: "web",
        files,
        status: "processing",
        createdAt: new Date().toISOString(),
      } as Asset;

      const asset = await createAsset(assetToCreate);

      expect(asset.files).toHaveLength(2);
      expect(asset.files[0]?.name).toBe("file1.txt");
      expect(asset.files[1]?.name).toBe("file2.json");
    });
  });

  describe("getAssets", () => {
    test("should return all assets", async () => {
      const asset1: Asset = {
        id: "test-get-asset-1",
        type: "host",
        files: [{
          name: "test1.txt",
          type: "text/plain",
          size: 50,
          content: "dGVzdDE=",
        }],
        status: "processing",
        createdAt: new Date().toISOString(),
      } as Asset;

      const asset2: Asset = {
        id: "test-get-asset-2",
        type: "web",
        files: [{
          name: "test2.txt",
          type: "text/plain",
          size: 60,
          content: "dGVzdDI=",
        }],
        status: "processing",
        createdAt: new Date().toISOString(),
      } as Asset;

      await createAsset(asset1);
      await createAsset(asset2);

      const result = await getAssets();

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.find(a => a.id === asset1.id)).toBeDefined();
      expect(result.find(a => a.id === asset2.id)).toBeDefined();
    });
  });


});
