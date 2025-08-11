#!/usr/bin/env node

/**
 * Test script for LangGraph summary generation
 * 
 * This script:
 * 1. Connects to the database
 * 2. Finds existing assets
 * 3. Runs the summary generation workflow
 * 4. Shows the generated summary output
 * 
 * Prerequisites:
 * - MongoDB running locally
 * - OPENAI_API_KEY in environment
 * - Existing assets in database
 */

import "dotenv/config";
import { generateSummary } from "../src/app/services/summary.agent.js";
import { getWebAssetById, getHostAssetById } from "../src/api/v1/assets/assets.service.js";
import { getWebAssetSummaryById, getHostAssetSummaryById } from "../src/api/v1/assets/asset-summary.store.js";
import * as mongoose from "../src/db/mongoose.js";

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function connectToDatabase() {
  try {
    await mongoose.connect();
    logSuccess('Connected to MongoDB');
    return true;
  } catch (error) {
    logError(`Failed to connect to MongoDB: ${error.message}`);
    logInfo('Make sure MongoDB is running with: bun run docker:mongodb');
    return false;
  }
}

async function findTestAsset(assetType) {
  try {
    logInfo(`Looking for ${assetType} assets...`);

    // Import mongoose directly to access connection
    const mongooseLib = await import('mongoose');

    if (assetType === 'web') {
      // Try to get any web asset
      const assets = await mongooseLib.default.connection.db.collection('web_assets').find({}).limit(1).toArray();
      if (assets.length > 0) {
        const asset = await getWebAssetById(assets[0]._id);
        if (asset) {
          logSuccess(`Found web asset: ${asset.id}`);
          return asset;
        }
      }
    } else {
      // Try to get any host asset
      const assets = await mongooseLib.default.connection.db.collection('host_assets').find({}).limit(1).toArray();
      if (assets.length > 0) {
        const asset = await getHostAssetById(assets[0]._id);
        if (asset) {
          logSuccess(`Found host asset: ${asset.id}`);
          return asset;
        }
      }
    }

    logError(`No ${assetType} assets found in database`);
    return null;
  } catch (error) {
    logError(`Error finding ${assetType} asset: ${error.message}`);
    return null;
  }
}

async function runSummaryGeneration(asset, assetType) {
  try {
    logInfo(`Running LangGraph summary generation for ${assetType} asset...`);
    
    const startTime = Date.now();
    await generateSummary({ asset, assetType });
    const duration = Date.now() - startTime;
    
    logSuccess(`Summary generation completed in ${duration}ms`);
    return true;
  } catch (error) {
    logError(`Summary generation failed: ${error.message}`);
    console.error(error);
    return false;
  }
}

async function displayGeneratedSummary(assetId, assetType) {
  try {
    logInfo('Retrieving generated summary...');
    
    let summary;
    if (assetType === 'web') {
      summary = await getWebAssetSummaryById(assetId);
    } else {
      summary = await getHostAssetSummaryById(assetId);
    }
    
    if (!summary) {
      logError('No summary found in database');
      return false;
    }
    
    logSuccess('Generated Summary:');
    console.log('\n' + '='.repeat(60));
    console.log(`Asset ID: ${summary._id}`);
    console.log(`Severity: ${summary.severity.toUpperCase()}`);
    console.log(`\nSummary:`);
    console.log(summary.summary);
    
    console.log(`\nFindings (${summary.findings.length}):`);
    summary.findings.forEach((finding, i) => {
      console.log(`  ${i + 1}. ${finding}`);
    });
    
    console.log(`\nRecommendations (${summary.recommendations.length}):`);
    summary.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    
    if (summary.assumptions && summary.assumptions.length > 0) {
      console.log(`\nAssumptions (${summary.assumptions.length}):`);
      summary.assumptions.forEach((assumption, i) => {
        console.log(`  ${i + 1}. ${assumption}`);
      });
    }
    
    console.log(`\nData Coverage: ${summary.data_coverage.fields_present_pct}%`);
    if (summary.data_coverage.missing_fields.length > 0) {
      console.log(`Missing fields: ${summary.data_coverage.missing_fields.join(', ')}`);
    }
    
    console.log(`\nEvidence:`);
    console.log(JSON.stringify(summary.evidence, null, 2));
    console.log('='.repeat(60) + '\n');
    
    return true;
  } catch (error) {
    logError(`Error displaying summary: ${error.message}`);
    return false;
  }
}

async function testSummaryGeneration(assetType) {
  logStep('TEST', `Testing ${assetType} asset summary generation`);
  
  // Find a test asset
  const asset = await findTestAsset(assetType);
  if (!asset) {
    logError(`Cannot test ${assetType} summary - no assets found`);
    logInfo(`Upload some ${assetType} assets first using: bin/test-upload-flow.js`);
    return false;
  }
  
  // Run summary generation
  const success = await runSummaryGeneration(asset, assetType);
  if (!success) {
    return false;
  }
  
  // Display the generated summary
  await displayGeneratedSummary(asset.id, assetType);
  return true;
}

async function checkPrerequisites() {
  logStep(1, 'Checking prerequisites');
  
  if (!process.env.OPENAI_API_KEY) {
    logError('OPENAI_API_KEY not found in environment');
    logInfo('Set your OpenAI API key in .env file');
    return false;
  }
  
  logSuccess('OpenAI API key found');
  return true;
}

async function main() {
  log('\n🤖 LangGraph Summary Generation Test', 'bright');
  log('=====================================', 'bright');
  
  // Check prerequisites
  const prereqsOk = await checkPrerequisites();
  if (!prereqsOk) {
    process.exit(1);
  }
  
  // Connect to database
  logStep(2, 'Connecting to database');
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    process.exit(1);
  }
  
  // Get asset type from command line or default to web
  const assetType = process.argv[2] || 'web';
  if (!['web', 'host'].includes(assetType)) {
    logError('Invalid asset type. Use: web or host');
    process.exit(1);
  }
  
  logInfo(`Testing ${assetType} asset summary generation`);
  
  // Test summary generation
  const success = await testSummaryGeneration(assetType);
  
  // Summary
  log('\n📊 Test Summary', 'bright');
  log('===============', 'bright');
  
  if (success) {
    logSuccess('LangGraph summary generation is working!');
    logInfo('The workflow successfully generated and saved a summary');
  } else {
    logError('Summary generation test failed');
    logInfo('Check the error messages above for details');
  }
  
  log('\n💡 Usage:', 'yellow');
  log('  bun run bin/test-summary-generation.js web   # Test web asset');
  log('  bun run bin/test-summary-generation.js host  # Test host asset');
  log('');
  
  await mongoose.disconnect();
}

// Run the test
main().catch(error => {
  logError(`Test script failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
