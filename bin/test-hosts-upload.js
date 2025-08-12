#!/usr/bin/env node

/**
 * End-to-end test script for hosts assets upload functionality
 * 
 * This script:
 * 1. Tests API health
 * 2. Uploads the hosts test dataset to the API
 * 3. Retrieves the uploaded assets
 * 4. Validates the complete flow
 * 
 * Prerequisites:
 * - API running on http://localhost:3000
 * - MongoDB connection configured
 * - Hosts test dataset file exists
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - can be overridden via environment variable
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';
const HOSTS_DATA_PATH = path.join(__dirname, '../tests/api/v1/assets/hosts_dataset.json');

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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function checkApiHealth() {
  logStep(1, 'Checking API health');

  try {
    // Extract base URL for health checks
    const baseUrl = API_BASE_URL.replace('/api/v1', '');
    logInfo(`Testing API at: ${baseUrl}`);

    // Check root endpoint first
    const rootResponse = await fetch(`${baseUrl}/`);
    const rootResult = await rootResponse.json();

    if (rootResponse.ok && rootResult.message) {
      logSuccess(`API is running: ${rootResult.message}`);
      logInfo(`Uptime: ${rootResult.uptime} seconds`);

      // Also check readiness endpoint
      const readyResponse = await fetch(`${baseUrl}/ready`);
      const readyResult = await readyResponse.json();

      if (readyResponse.ok && readyResult.success && readyResult.data.status === 'ready') {
        logSuccess('Database connection is ready');
        return true;
      } else {
        logWarning('API is running but database may not be ready');
        logInfo(`Ready response: ${JSON.stringify(readyResult)}`);
        return true; // Continue anyway
      }
    } else {
      logError(`API health check failed: ${rootResult.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logError(`Failed to connect to API: ${error.message}`);
    return false;
  }
}

async function loadHostsData() {
  logStep(2, 'Loading hosts test data');
  
  try {
    if (!fs.existsSync(HOSTS_DATA_PATH)) {
      logError(`Test data file not found: ${HOSTS_DATA_PATH}`);
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(HOSTS_DATA_PATH, 'utf8'));
    logSuccess(`Loaded ${data.hosts.length} host assets from test dataset`);
    logInfo(`Dataset: ${data.metadata.description}`);
    logInfo(`IPs: ${data.metadata.ips_analyzed.join(', ')}`);
    
    return data;
  } catch (error) {
    logError(`Failed to load test data: ${error.message}`);
    return null;
  }
}

async function uploadHosts(testData) {
  logStep(3, 'Uploading hosts assets');
  
  try {
    // Create FormData with the JSON file
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(testData)], { type: 'application/json' });
    formData.append('file', jsonBlob, 'hosts_dataset.json');

    logInfo(`Uploading ${testData.hosts.length} host assets...`);
    
    const response = await fetch(`${API_BASE_URL}/assets/hosts/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      const items = result.data.items || result.data.assets || [];
      const total = result.data.total || items.length;
      logSuccess(`Upload successful: ${total} host assets processed`);
      if (items.length > 0) {
        logInfo(`Assets uploaded: ${items.map(a => a.id).join(', ')}`);
      }
      return result.data;
    } else {
      logError(`Upload failed: ${result.error || 'Unknown error'}`);
      logInfo(`Response status: ${response.status}`);
      logInfo(`Response body: ${JSON.stringify(result)}`);
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

async function retrieveAllHosts() {
  logStep(4, 'Retrieving all host assets');

  try {
    const response = await fetch(`${API_BASE_URL}/assets/hosts`);
    const result = await response.json();

    if (response.ok && result.success) {
      const items = result.data.items || result.data.assets || [];
      const total = result.data.total || items.length;
      logSuccess(`Retrieved ${total} host assets`);
      if (items.length > 0) {
        logInfo(`Host IPs: ${items.map(a => a.ip).join(', ')}`);
      }
      return result.data;
    } else {
      logError(`Failed to retrieve assets: ${result.error || 'Unknown error'}`);
      logInfo(`Response status: ${response.status}`);
      logInfo(`Response body: ${JSON.stringify(result)}`);
      return null;
    }
  } catch (error) {
    logError(`Retrieval request failed: ${error.message}`);
    return null;
  }
}

async function retrieveSpecificHost(hostId) {
  logStep(5, `Retrieving specific host: ${hostId}`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/assets/hosts/${encodeURIComponent(hostId)}`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      logSuccess(`Retrieved host asset: ${result.data.ip}`);
      logInfo(`Location: ${result.data.location?.city}, ${result.data.location?.country}`);
      logInfo(`Services: ${result.data.services?.length || 0} services detected`);
      return result.data;
    } else {
      logError(`Failed to retrieve host ${hostId}: ${result.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logError(`Retrieval request failed: ${error.message}`);
    return null;
  }
}

async function validateResults(uploadResult, retrievalResult) {
  logStep(6, 'Validating results');
  
  if (!uploadResult || !retrievalResult) {
    logError('Cannot validate - missing upload or retrieval results');
    return false;
  }
  
  const uploadedCount = uploadResult.total;
  const retrievedCount = retrievalResult.total;
  
  if (uploadedCount === retrievedCount) {
    logSuccess(`Data consistency verified: ${uploadedCount} assets uploaded and retrieved`);
    return true;
  } else {
    logWarning(`Data mismatch: uploaded ${uploadedCount}, retrieved ${retrievedCount}`);
    return false;
  }
}

async function main() {
  log('\n🚀 Hosts Assets Upload Test', 'bright');
  log('============================', 'bright');
  
  try {
    // Step 1: Check API health
    const isHealthy = await checkApiHealth();
    if (!isHealthy) {
      process.exit(1);
    }
    
    // Step 2: Load test data
    const testData = await loadHostsData();
    if (!testData) {
      process.exit(1);
    }
    
    // Step 3: Upload hosts
    const uploadResult = await uploadHosts(testData);
    if (!uploadResult) {
      logWarning('Upload failed, but continuing with retrieval tests...');
    }
    
    // Step 4: Retrieve all hosts
    const retrievalResult = await retrieveAllHosts();
    
    // Step 5: Retrieve specific host (first one from test data)
    if (testData.hosts.length > 0) {
      const firstHostIp = testData.hosts[0].ip;
      await retrieveSpecificHost(firstHostIp);
    }
    
    // Step 6: Validate results
    const isValid = await validateResults(uploadResult, retrievalResult);
    
    // Summary
    log('\n📊 Test Summary', 'cyan');
    log('===============', 'cyan');
    
    if (uploadResult && retrievalResult && isValid) {
      logSuccess('All tests passed! Hosts upload functionality is working correctly.');
    } else if (retrievalResult) {
      logWarning('Upload may have issues, but retrieval is working.');
      logInfo('This could mean assets already exist or there are validation issues.');
    } else {
      logError('Tests failed. Check the API and database connection.');
    }
    
  } catch (error) {
    logError(`Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
main().catch(console.error);
