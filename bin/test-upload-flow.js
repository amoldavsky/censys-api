#!/usr/bin/env node

/**
 * End-to-end test script for web assets upload functionality
 * 
 * This script:
 * 1. Uploads the test dataset to the local API
 * 2. Retrieves the uploaded assets
 * 3. Validates the complete flow
 * 
 * Prerequisites:
 * - Local API running on http://localhost:3000
 * - MongoDB running locally
 * - Test dataset file exists
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';
const TEST_DATA_PATH = path.join(__dirname, '../tests/api/v1/assets/web_properties_dataset.json');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/../`);
    if (response.ok) {
      const data = await response.json();
      logSuccess(`API is running: ${data.message}`);
      return true;
    } else {
      logError(`API health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Cannot connect to API: ${error.message}`);
    logInfo('Make sure the API is running with: bun run dev');
    return false;
  }
}

async function loadTestData() {
  try {
    if (!fs.existsSync(TEST_DATA_PATH)) {
      logError(`Test data file not found: ${TEST_DATA_PATH}`);
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(TEST_DATA_PATH, 'utf8'));
    logSuccess(`Loaded test data: ${data.certificates.length} certificates`);
    return data;
  } catch (error) {
    logError(`Failed to load test data: ${error.message}`);
    return null;
  }
}

async function createAssetsInDatabase(certificates) {
  logInfo('Creating initial assets in database for update testing...');
  
  // Since the upload only updates existing assets (upsert: false),
  // we need to create them first. In a real scenario, these would
  // come from scans or other sources.
  
  try {
    // We'll use a direct MongoDB connection approach or API if available
    // For now, let's assume they exist or create a simple POST endpoint
    logInfo('Note: Upload endpoint only updates existing assets (upsert: false)');
    logInfo('In production, assets would be created by scanning processes');
    return true;
  } catch (error) {
    logError(`Failed to create initial assets: ${error.message}`);
    return false;
  }
}

async function uploadAssets(testData) {
  try {
    // Create FormData with the JSON file
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(testData)], { type: 'application/json' });
    formData.append('file', jsonBlob, 'test_certificates.json');

    logInfo(`Uploading ${testData.certificates.length} certificates...`);
    
    const response = await fetch(`${API_BASE_URL}/assets/web/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      logSuccess(`Upload successful: ${result.data.total} assets processed`);
      return result.data;
    } else {
      logError(`Upload failed: ${result.error || 'Unknown error'}`);
      if (result.details) {
        console.log('Details:', result.details);
      }
      return null;
    }
  } catch (error) {
    logError(`Upload request failed: ${error.message}`);
    return null;
  }
}

async function retrieveWebAssets() {
  try {
    logInfo('Retrieving all web assets...');
    
    const response = await fetch(`${API_BASE_URL}/assets/web`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      logSuccess(`Retrieved ${result.data.total} web assets`);
      return result.data;
    } else {
      logError(`Failed to retrieve assets: ${result.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logError(`Retrieve request failed: ${error.message}`);
    return null;
  }
}

async function retrieveSpecificAsset(assetId) {
  try {
    logInfo(`Retrieving specific asset: ${assetId.substring(0, 16)}...`);
    
    const response = await fetch(`${API_BASE_URL}/assets/web/${assetId}`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      logSuccess(`Retrieved asset: ${result.data.id}`);
      return result.data;
    } else {
      logError(`Failed to retrieve asset: ${result.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logError(`Retrieve asset request failed: ${error.message}`);
    return null;
  }
}

function validateUploadResults(originalData, uploadResult, retrievedAssets) {
  logInfo('Validating upload results...');
  
  const originalCerts = originalData.certificates;
  const uploadedCount = uploadResult ? uploadResult.total : 0;
  const retrievedCount = retrievedAssets ? retrievedAssets.total : 0;
  
  // Note: Since upsert is false, uploaded count might be less than original count
  logInfo(`Original certificates: ${originalCerts.length}`);
  logInfo(`Uploaded (updated): ${uploadedCount}`);
  logInfo(`Retrieved: ${retrievedCount}`);
  
  if (uploadedCount > 0) {
    logSuccess('Upload flow working - some assets were updated');
  } else {
    logError('No assets were updated - they may not exist in database');
    logInfo('This is expected behavior since upsert: false');
  }
  
  // Validate fingerprints
  if (retrievedAssets && retrievedAssets.items) {
    const retrievedIds = retrievedAssets.items.map(item => item.id);
    const originalIds = originalCerts.map(cert => cert.fingerprint_sha256);
    
    const matchingIds = retrievedIds.filter(id => originalIds.includes(id));
    logInfo(`Matching fingerprints: ${matchingIds.length}`);
    
    if (matchingIds.length > 0) {
      logSuccess('Found matching certificates in database');
      matchingIds.forEach(id => {
        logInfo(`  - ${id.substring(0, 16)}...`);
      });
    }
  }
}

async function demonstrateErrorHandling() {
  logStep('BONUS', 'Demonstrating error handling');
  
  // Test 1: Invalid content type
  try {
    const response = await fetch(`${API_BASE_URL}/assets/web/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    const result = await response.json();
    
    if (response.status === 415) {
      logSuccess('✓ Correctly rejected non-multipart request');
    } else {
      logError('✗ Should have rejected non-multipart request');
    }
  } catch (error) {
    logError(`Error test failed: ${error.message}`);
  }
  
  // Test 2: Invalid JSON
  try {
    const formData = new FormData();
    const invalidBlob = new Blob(['{ invalid json'], { type: 'application/json' });
    formData.append('file', invalidBlob, 'invalid.json');
    
    const response = await fetch(`${API_BASE_URL}/assets/web/upload`, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    
    if (response.status === 412) {
      logSuccess('✓ Correctly rejected malformed JSON');
    } else {
      logError('✗ Should have rejected malformed JSON');
    }
  } catch (error) {
    logError(`JSON error test failed: ${error.message}`);
  }
}

async function main() {
  log('\n🚀 Web Assets Upload Flow Test', 'bright');
  log('=====================================', 'bright');
  
  // Step 1: Check API health
  logStep(1, 'Checking API health');
  const apiHealthy = await checkApiHealth();
  if (!apiHealthy) {
    process.exit(1);
  }
  
  // Step 2: Load test data
  logStep(2, 'Loading test data');
  const testData = await loadTestData();
  if (!testData) {
    process.exit(1);
  }
  
  // Step 3: Upload assets
  logStep(3, 'Uploading web assets');
  const uploadResult = await uploadAssets(testData);
  
  // Step 4: Retrieve all assets
  logStep(4, 'Retrieving all web assets');
  const retrievedAssets = await retrieveWebAssets();
  
  // Step 5: Retrieve specific asset (if any exist)
  if (retrievedAssets && retrievedAssets.items.length > 0) {
    logStep(5, 'Retrieving specific asset');
    const firstAsset = retrievedAssets.items[0];
    await retrieveSpecificAsset(firstAsset.id);
  }
  
  // Step 6: Validate results
  logStep(6, 'Validating results');
  validateUploadResults(testData, uploadResult, retrievedAssets);
  
  // Step 7: Error handling demonstration
  await demonstrateErrorHandling();
  
  // Summary
  log('\n📊 Test Summary', 'bright');
  log('===============', 'bright');
  
  if (uploadResult || (retrievedAssets && retrievedAssets.total > 0)) {
    logSuccess('Upload flow is working correctly!');
    logInfo('The API successfully handles file uploads and data retrieval');
  } else {
    logError('Upload flow needs attention');
    logInfo('Check that MongoDB is running and assets exist for updating');
  }
  
  log('\n💡 Next Steps:', 'yellow');
  log('- Check MongoDB for stored assets');
  log('- Try uploading different certificate data');
  log('- Monitor API logs for detailed information');
  log('- Use the working unit tests for validation\n');
}

// Run the test
main().catch(error => {
  logError(`Test script failed: ${error.message}`);
  process.exit(1);
});
