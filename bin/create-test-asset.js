#!/usr/bin/env node

/**
 * Create a test asset directly in the database for summary generation testing
 */

import "dotenv/config";
import * as mongoose from "../src/db/mongoose.js";

const testWebAsset = {
  _id: "test.example.com",
  source: "test",
  fingerprint_sha256: "a1b2c3d4e5f67890123456789012345678901234567890123456789012345678",
  domains: ["test.example.com", "www.test.example.com"],
  subject: {
    common_name: "test.example.com",
    organization: "Test Organization",
    country: "US"
  },
  issuer: {
    common_name: "Test CA",
    organization: "Test Certificate Authority"
  },
  validity_period: {
    not_before: "2024-01-01T00:00:00Z",
    not_after: "2025-01-01T00:00:00Z"
  },
  key_info: {
    algorithm: "RSA",
    size: 2048
  },
  certificate_authority: {
    name: "Test CA",
    trusted: true
  }
};

const testHostAsset = {
  _id: "192.168.1.100",
  source: "test",
  ip: "192.168.1.100",
  location: {
    country: "US",
    city: "San Francisco",
    region: "California"
  },
  autonomous_system: {
    asn: 12345,
    name: "Test ISP"
  },
  services: [
    {
      port: 80,
      protocol: "tcp",
      service: "http",
      banner: "Apache/2.4.41"
    },
    {
      port: 443,
      protocol: "tcp",
      service: "https",
      banner: "Apache/2.4.41"
    }
  ],
  operating_system: {
    product: "Linux",
    version: "Ubuntu 20.04"
  }
};

async function createTestAssets() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect();
    
    console.log("Creating test web asset...");
    const mongooseLib = await import('mongoose');
    await mongooseLib.default.connection.db.collection('web_assets').replaceOne(
      { _id: testWebAsset._id },
      testWebAsset,
      { upsert: true }
    );

    console.log("Creating test host asset...");
    await mongooseLib.default.connection.db.collection('host_assets').replaceOne(
      { _id: testHostAsset._id },
      testHostAsset,
      { upsert: true }
    );
    
    console.log("✅ Test assets created successfully!");
    console.log(`Web asset: ${testWebAsset._id}`);
    console.log(`Host asset: ${testHostAsset._id}`);
    
  } catch (error) {
    console.error("❌ Error creating test assets:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createTestAssets();
