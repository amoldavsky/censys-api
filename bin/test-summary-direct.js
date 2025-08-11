#!/usr/bin/env node

/**
 * Direct test of summary generation bypassing service layer validation issues
 */

import "dotenv/config";
import { generateSummary } from "../src/app/services/summary.agent.js";
import * as mongoose from "../src/db/mongoose.js";

// Create test assets that match the schema exactly
const testWebAsset = {
  id: "test.example.com",
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
  id: "192.168.1.100",
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

async function testSummaryGeneration() {
  try {
    console.log("🤖 Direct Summary Generation Test");
    console.log("==================================");

    console.log("🔍 Environment check:");
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT FOUND'}`);

    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY not found in environment");
      return;
    }

    console.log("✅ OpenAI API key found");
    
    console.log("\nConnecting to MongoDB...");
    await mongoose.connect();
    console.log("✅ Connected to MongoDB");
    
    // Test web asset summary
    console.log("\n📝 Testing web asset summary generation...");
    const startTime = Date.now();
    
    try {
      await generateSummary({ 
        asset: testWebAsset, 
        assetType: 'web' 
      });
      const duration = Date.now() - startTime;
      console.log(`✅ Web asset summary generated successfully in ${duration}ms`);
      
      // Retrieve and display the summary
      const { getWebAssetSummaryById } = await import("../src/api/v1/assets/asset-summary.store.js");
      const summary = await getWebAssetSummaryById(testWebAsset.id);
      
      if (summary) {
        console.log("\n📊 Generated Web Asset Summary:");
        console.log("================================");
        console.log(`ID: ${summary._id}`);
        console.log(`Severity: ${summary.severity.toUpperCase()}`);
        console.log(`Summary: ${summary.summary}`);
        console.log(`Findings: ${summary.findings.length} items`);
        console.log(`Recommendations: ${summary.recommendations.length} items`);
        console.log(`Data Coverage: ${summary.data_coverage.fields_present_pct}%`);
      }
      
    } catch (error) {
      console.error(`❌ Web asset summary generation failed: ${error.message}`);
      console.error(error);
    }
    
    // Test host asset summary
    console.log("\n📝 Testing host asset summary generation...");
    const startTime2 = Date.now();
    
    try {
      await generateSummary({ 
        asset: testHostAsset, 
        assetType: 'host' 
      });
      const duration2 = Date.now() - startTime2;
      console.log(`✅ Host asset summary generated successfully in ${duration2}ms`);
      
      // Retrieve and display the summary
      const { getHostAssetSummaryById } = await import("../src/api/v1/assets/asset-summary.store.js");
      const summary = await getHostAssetSummaryById(testHostAsset.id);
      
      if (summary) {
        console.log("\n📊 Generated Host Asset Summary:");
        console.log("=================================");
        console.log(`ID: ${summary._id}`);
        console.log(`Severity: ${summary.severity.toUpperCase()}`);
        console.log(`Summary: ${summary.summary}`);
        console.log(`Findings: ${summary.findings.length} items`);
        console.log(`Recommendations: ${summary.recommendations.length} items`);
        console.log(`Data Coverage: ${summary.data_coverage.fields_present_pct}%`);
      }
      
    } catch (error) {
      console.error(`❌ Host asset summary generation failed: ${error.message}`);
      console.error(error);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

testSummaryGeneration();
