#!/usr/bin/env node

/**
 * Debug script to check what assets are in the database
 */

import "dotenv/config";
import * as mongoose from "../src/db/mongoose.js";

async function debugAssets() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect();
    
    const mongooseLib = await import('mongoose');
    
    console.log("\n=== Web Assets ===");
    const webAssets = await mongooseLib.default.connection.db.collection('web_assets').find({}).toArray();
    console.log(`Found ${webAssets.length} web assets:`);
    webAssets.forEach((asset, i) => {
      console.log(`${i + 1}. _id: ${asset._id}, source: ${asset.source}`);
      console.log(`   fingerprint_sha256: ${asset.fingerprint_sha256}`);
      console.log(`   domains: ${JSON.stringify(asset.domains)}`);
    });
    
    console.log("\n=== Host Assets ===");
    const hostAssets = await mongooseLib.default.connection.db.collection('host_assets').find({}).toArray();
    console.log(`Found ${hostAssets.length} host assets:`);
    hostAssets.forEach((asset, i) => {
      console.log(`${i + 1}. _id: ${asset._id}, source: ${asset.source}`);
      console.log(`   ip: ${asset.ip}`);
    });
    
    // Test asset service retrieval
    console.log("\n=== Testing Asset Service ===");
    const { getWebAssetById, getHostAssetById } = await import("../src/api/v1/assets/assets.service.js");

    // Test with our test asset specifically
    console.log("Testing getWebAssetById with test asset: test.example.com");
    const testWebAsset = await getWebAssetById("test.example.com");
    console.log("Result:", testWebAsset ? `Success - id: ${testWebAsset.id}` : "Failed - null returned");
    if (testWebAsset) {
      console.log("Asset structure:", JSON.stringify(testWebAsset, null, 2));
    }

    console.log("Testing getHostAssetById with test asset: 192.168.1.100");
    const testHostAsset = await getHostAssetById("192.168.1.100");
    console.log("Result:", testHostAsset ? `Success - id: ${testHostAsset.id}` : "Failed - null returned");
    if (testHostAsset) {
      console.log("Asset structure:", JSON.stringify(testHostAsset, null, 2));
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

debugAssets();
