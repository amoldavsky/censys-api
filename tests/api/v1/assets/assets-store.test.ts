import { describe, test, expect, beforeEach } from "bun:test";
import type { Asset } from "../../../../src/api/v1/assets/models/asset.model.ts";
import { setAsset, getAsset, getAllAssets, deleteAsset, clearAllAssets, findAssetsByStatus, findAssetsByType } from "../../../../src/api/v1/assets/assets.store.ts";

describe("AssetsStore", () => {
  beforeEach(async () => {
    // Clear the store before each test
    await clearAllAssets();
  });

  test("should store and retrieve asset", async () => {
    const asset: Asset = {
      id: "test-id",
      type: "host",
      files: [{
        name: "test.txt",
        type: "text/plain",
        size: 100,
        content: "dGVzdA=="
      }],
      status: "processing",
      createdAt: "2025-01-01T00:00:00.000Z"
    };

    await setAsset("test-id", asset);
    const retrieved = await getAsset("test-id");
    expect(retrieved).toEqual(asset);
  });

  test("should return null for non-existent asset", async () => {
    const retrieved = await getAsset("non-existent");
    expect(retrieved).toBeNull();
  });

  test("should return all assets", async () => {
    const asset1: Asset = {
      id: "test-1",
      type: "web",
      files: [{ name: "test1.txt", type: "text/plain", size: 50, content: "dGVzdA==" }],
      status: "processing",
      createdAt: "2025-01-01T00:00:00.000Z"
    };

    const asset2: Asset = {
      id: "test-2",
      type: "host",
      files: [{ name: "test2.txt", type: "text/plain", size: 60, content: "dGVzdA==" }],
      status: "completed",
      createdAt: "2025-01-01T00:01:00.000Z"
    };

    await setAsset("test-1", asset1);
    await setAsset("test-2", asset2);

    const all = await getAllAssets();
    expect(all.length).toBe(2);
    expect(all.find(a => a.id === "test-1")).toEqual(asset1);
    expect(all.find(a => a.id === "test-2")).toEqual(asset2);
  });

  test("should delete asset", async () => {
    const asset: Asset = {
      id: "test-id",
      type: "web",
      files: [{ name: "test.txt", type: "text/plain", size: 100, content: "dGVzdA==" }],
      status: "processing",
      createdAt: "2025-01-01T00:00:00.000Z"
    };

    await setAsset("test-id", asset);
    const deleted = await deleteAsset("test-id");

    expect(deleted).toBe(true);
    expect(await getAsset("test-id")).toBeNull();
  });

  test("should return false when deleting non-existent asset", async () => {
    const deleted = await deleteAsset("non-existent");
    expect(deleted).toBe(false);
  });

  test("should find assets by status", async () => {
    const asset1: Asset = {
      id: "test-1",
      type: "web",
      files: [{ name: "test1.txt", type: "text/plain", size: 50, content: "dGVzdA==" }],
      status: "processing",
      createdAt: "2025-01-01T00:00:00.000Z"
    };

    const asset2: Asset = {
      id: "test-2",
      type: "host",
      files: [{ name: "test2.txt", type: "text/plain", size: 60, content: "dGVzdA==" }],
      status: "completed",
      createdAt: "2025-01-01T00:01:00.000Z"
    };

    await setAsset("test-1", asset1);
    await setAsset("test-2", asset2);

    const processingAssets = await findAssetsByStatus("processing");
    expect(processingAssets.length).toBe(1);
    expect(processingAssets[0].id).toBe("test-1");

    const completedAssets = await findAssetsByStatus("completed");
    expect(completedAssets.length).toBe(1);
    expect(completedAssets[0].id).toBe("test-2");
  });

  test("should find assets by type", async () => {
    const asset1: Asset = {
      id: "test-1",
      type: "web",
      files: [{ name: "test1.txt", type: "text/plain", size: 50, content: "dGVzdA==" }],
      status: "processing",
      createdAt: "2025-01-01T00:00:00.000Z"
    };

    const asset2: Asset = {
      id: "test-2",
      type: "host",
      files: [{ name: "test2.txt", type: "text/plain", size: 60, content: "dGVzdA==" }],
      status: "completed",
      createdAt: "2025-01-01T00:01:00.000Z"
    };

    await setAsset("test-1", asset1);
    await setAsset("test-2", asset2);

    const webAssets = await findAssetsByType("web");
    expect(webAssets.length).toBe(1);
    expect(webAssets[0].id).toBe("test-1");

    const hostAssets = await findAssetsByType("host");
    expect(hostAssets.length).toBe(1);
    expect(hostAssets[0].id).toBe("test-2");
  });
});
