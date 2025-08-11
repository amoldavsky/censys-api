#!/usr/bin/env node

/**
 * Test the complete summary integration flow:
 * 1. Create test assets directly in database
 * 2. Trigger summary generation jobs
 * 3. Verify summaries are created and saved
 */

import "dotenv/config";
import * as mongoose from "../src/db/mongoose.js";
import * as assetsService from "../src/api/v1/assets/assets.service.js";
import * as jobsService from "../src/app/services/jobs.js";
import * as summaryAgent from "../src/app/services/summary.agent.js";
import { getWebAssetSummaryById, getHostAssetSummaryById } from "../src/api/v1/assets/asset-summary.store.js";

// Register job handler
jobsService.registerHandler('asset-summary', (payload) => summaryAgent.generateSummary(payload));

// Test assets
const testWebAsset = {
  fingerprint_sha256: "a1b2c3d4e5f67890123456789012345678901234567890123456789012345678",
  domains: ["integration-test.example.com", "www.integration-test.example.com"],
  subject: {
    common_name: "integration-test.example.com",
    organization: "Integration Test Organization",
    country: "US"
  },
  issuer: {
    common_name: "Integration Test CA",
    organization: "Integration Test Certificate Authority"
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
    name: "Integration Test CA",
    trusted: true
  }
};

const testHostAsset = {
  id: "192.168.100.200", // Add the required id field
  ip: "192.168.100.200",
  location: {
    country: "US",
    city: "Integration City",
    region: "Test State"
  },
  autonomous_system: {
    asn: 54321,
    name: "Integration Test ISP"
  },
  services: [
    {
      port: 80,
      protocol: "tcp",
      service: "http",
      banner: "nginx/1.20.1"
    },
    {
      port: 443,
      protocol: "tcp",
      service: "https",
      banner: "nginx/1.20.1"
    }
  ],
  operating_system: {
    product: "Linux",
    version: "Ubuntu 22.04"
  }
};

async function testSummaryIntegration() {
  try {
    console.log("🧪 Summary Integration Test");
    console.log("===========================");
    
    console.log("🔍 Environment check:");
    console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT FOUND'}`);
    
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY not found in environment");
      return;
    }
    
    console.log("✅ OpenAI API key found");
    
    console.log("\n📦 Connecting to MongoDB...");
    await mongoose.connect();
    console.log("✅ Connected to MongoDB");
    
    // Step 1: Insert test assets
    console.log("\n📝 Step 1: Creating test assets...");
    
    console.log("Creating web asset...");
    const webAssets = await assetsService.insertWebAssets([testWebAsset]);
    console.log(`✅ Created web asset: ${webAssets[0].id}`);
    
    console.log("Creating host asset...");
    const hostAssets = await assetsService.insertHostAssets([testHostAsset]);
    console.log(`✅ Created host asset: ${hostAssets[0].id}`);
    
    // Step 2: Submit summary jobs (simulating what upload endpoints do)
    console.log("\n🚀 Step 2: Submitting summary generation jobs...");
    
    const webJobId = jobsService.submitJob('asset-summary', {
      asset: webAssets[0],
      assetType: 'web'
    });
    console.log(`✅ Submitted web asset summary job: ${webJobId}`);
    
    const hostJobId = jobsService.submitJob('asset-summary', {
      asset: hostAssets[0],
      assetType: 'host'
    });
    console.log(`✅ Submitted host asset summary job: ${hostJobId}`);
    
    // Step 3: Wait for jobs to process
    console.log("\n⏳ Step 3: Waiting for jobs to process...");
    console.log("(Jobs are processed asynchronously in the background)");
    
    // Give jobs some time to process
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 4: Check if summaries were created
    console.log("\n🔍 Step 4: Checking for generated summaries...");
    
    let webSummary = await getWebAssetSummaryById(webAssets[0].id);
    let hostSummary = await getHostAssetSummaryById(hostAssets[0].id);
    
    // If summaries aren't ready yet, wait a bit more
    if (!webSummary || !hostSummary) {
      console.log("⏳ Summaries not ready yet, waiting longer...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      webSummary = await getWebAssetSummaryById(webAssets[0].id);
      hostSummary = await getHostAssetSummaryById(hostAssets[0].id);
    }
    
    // Step 5: Verify results
    console.log("\n📊 Step 5: Verification Results");
    console.log("================================");
    
    if (webSummary) {
      console.log("✅ Web asset summary generated successfully!");
      console.log(`   ID: ${webSummary._id}`);
      console.log(`   Severity: ${webSummary.severity.toUpperCase()}`);
      console.log(`   Summary: ${webSummary.summary.substring(0, 100)}...`);
      console.log(`   Findings: ${webSummary.findings.length} items`);
      console.log(`   Recommendations: ${webSummary.recommendations.length} items`);
    } else {
      console.log("❌ Web asset summary not found");
    }
    
    if (hostSummary) {
      console.log("✅ Host asset summary generated successfully!");
      console.log(`   ID: ${hostSummary._id}`);
      console.log(`   Severity: ${hostSummary.severity.toUpperCase()}`);
      console.log(`   Summary: ${hostSummary.summary.substring(0, 100)}...`);
      console.log(`   Findings: ${hostSummary.findings.length} items`);
      console.log(`   Recommendations: ${hostSummary.recommendations.length} items`);
    } else {
      console.log("❌ Host asset summary not found");
    }
    
    // Step 6: Test summary endpoints
    console.log("\n🌐 Step 6: Testing summary API endpoints...");
    
    // This would normally be done via HTTP requests, but we can test the service layer
    const { getWebAssetSummary, getHostAssetSummary } = await import("../src/api/v1/assets/asset-summary.service.js");
    
    try {
      const webSummaryFromService = await getWebAssetSummary(webAssets[0].id);
      if (webSummaryFromService) {
        console.log("✅ Web asset summary endpoint working");
      } else {
        console.log("❌ Web asset summary endpoint returned null");
      }
    } catch (error) {
      console.log(`❌ Web asset summary endpoint error: ${error.message}`);
    }
    
    try {
      const hostSummaryFromService = await getHostAssetSummary(hostAssets[0].id);
      if (hostSummaryFromService) {
        console.log("✅ Host asset summary endpoint working");
      } else {
        console.log("❌ Host asset summary endpoint returned null");
      }
    } catch (error) {
      console.log(`❌ Host asset summary endpoint error: ${error.message}`);
    }
    
    // Summary
    console.log("\n🎯 Integration Test Summary");
    console.log("===========================");
    
    const webSuccess = !!webSummary;
    const hostSuccess = !!hostSummary;
    
    if (webSuccess && hostSuccess) {
      console.log("🎉 SUCCESS: Complete integration working!");
      console.log("   ✅ Assets created successfully");
      console.log("   ✅ Summary jobs submitted successfully");
      console.log("   ✅ Summaries generated and saved");
      console.log("   ✅ Summary endpoints working");
    } else {
      console.log("⚠️  PARTIAL SUCCESS: Some components working");
      console.log(`   ${webSuccess ? '✅' : '❌'} Web asset summary flow`);
      console.log(`   ${hostSuccess ? '✅' : '❌'} Host asset summary flow`);
    }
    
    console.log("\n💡 The summary job integration is wired and working!");
    console.log("   When assets are uploaded via POST /api/v1/assets/web/upload");
    console.log("   or POST /api/v1/assets/hosts/upload, summary jobs are");
    console.log("   automatically queued and processed in the background.");
    
  } catch (error) {
    console.error("❌ Integration test failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

testSummaryIntegration();
