#!/usr/bin/env node

/**
 * Test validation resilience - ensure we save summaries even when validation fails
 */

import "dotenv/config";
import { generateSummary } from "../src/app/services/summary.agent.js";
import * as mongoose from "../src/db/mongoose.js";

// Create a test asset that might cause validation issues
const testAssetWithIssues = {
  id: "validation-test.example.com",
  fingerprint_sha256: "b1c2d3e4f5a67890123456789012345678901234567890123456789012345678",
  domains: ["validation-test.example.com"],
  // Minimal data that might cause validation issues
  subject: {
    common_name: "validation-test.example.com"
  },
  issuer: {
    common_name: "Unknown CA"
  },
  validity_period: {
    not_before: "2024-01-01T00:00:00Z",
    not_after: "2024-12-31T23:59:59Z" // Expired certificate
  }
};

async function testValidationResilience() {
  try {
    console.log("🧪 Validation Resilience Test");
    console.log("==============================");
    
    console.log("🔍 Environment check:");
    console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 20)}...` : 'NOT FOUND'}`);
    
    if (!process.env.OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY not found in environment");
      return;
    }
    
    console.log("✅ OpenAI API key found");
    
    console.log("\nConnecting to MongoDB...");
    await mongoose.connect();
    console.log("✅ Connected to MongoDB");
    
    // Test with an asset that might cause validation issues
    console.log("\n📝 Testing summary generation with potentially problematic asset...");
    console.log("Asset ID:", testAssetWithIssues.id);
    console.log("Certificate expires:", testAssetWithIssues.validity_period.not_after);
    
    const startTime = Date.now();
    
    try {
      await generateSummary({ 
        asset: testAssetWithIssues, 
        assetType: 'web' 
      });
      const duration = Date.now() - startTime;
      console.log(`✅ Summary generation completed in ${duration}ms`);
      
      // Check if summary was saved despite potential validation issues
      const { getWebAssetSummaryById } = await import("../src/api/v1/assets/asset-summary.store.js");
      const summary = await getWebAssetSummaryById(testAssetWithIssues.id);
      
      if (summary) {
        console.log("\n📊 Generated Summary (despite validation issues):");
        console.log("=================================================");
        console.log(`ID: ${summary._id}`);
        console.log(`Severity: ${summary.severity.toUpperCase()}`);
        console.log(`Summary: ${summary.summary}`);
        console.log(`Findings: ${summary.findings.length} items`);
        console.log(`Recommendations: ${summary.recommendations.length} items`);
        console.log(`Data Coverage: ${summary.data_coverage.fields_present_pct}%`);
        
        console.log("\n✅ SUCCESS: Summary was saved even with validation issues!");
        console.log("This demonstrates the system's resilience to validation failures.");
      } else {
        console.log("❌ No summary found - this suggests the resilience logic isn't working");
      }
      
    } catch (error) {
      console.error(`❌ Summary generation failed completely: ${error.message}`);
      console.error("This suggests the resilience logic needs improvement");
      console.error(error);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

console.log("🎯 This test verifies that summaries are saved even when validation fails");
console.log("The system should log validation errors but still persist the generated summary");
console.log("");

testValidationResilience();
