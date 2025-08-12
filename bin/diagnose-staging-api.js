#!/usr/bin/env node

/**
 * Diagnostic script for staging API issues
 * Tests various scenarios to identify the root cause
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE_URL = 'https://censys-api.onrender.com/api/v1';
const HOSTS_DATA_PATH = path.join(__dirname, '../tests/api/v1/assets/hosts_dataset.json');

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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testSimpleHost() {
  logStep(1, 'Testing simple host upload');
  
  const simpleHost = {
    hosts: [{
      id: "test-host-1",
      ip: "10.0.0.1",
      location: { country: "US", city: "Test" },
      autonomous_system: { asn: 12345, name: "Test AS" }
    }]
  };
  
  try {
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(simpleHost)], { type: 'application/json' });
    formData.append('file', jsonBlob, 'simple_host.json');

    const response = await fetch(`${API_BASE_URL}/assets/hosts/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      logSuccess('Simple host upload works');
      return true;
    } else {
      logError(`Simple host upload failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    logError(`Simple host upload error: ${error.message}`);
    return false;
  }
}

async function testComplexHost() {
  logStep(2, 'Testing complex host upload (single host from dataset)');
  
  // Load the full dataset and extract just the first host
  const fullData = JSON.parse(fs.readFileSync(HOSTS_DATA_PATH, 'utf8'));
  const singleHost = {
    hosts: [fullData.hosts[0]] // Just the first host
  };
  
  try {
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(singleHost)], { type: 'application/json' });
    formData.append('file', jsonBlob, 'single_complex_host.json');

    const response = await fetch(`${API_BASE_URL}/assets/hosts/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      logSuccess('Single complex host upload works');
      return true;
    } else {
      logError(`Single complex host upload failed: ${result.error}`);
      logInfo(`Host data: ${JSON.stringify(singleHost.hosts[0], null, 2).substring(0, 500)}...`);
      return false;
    }
  } catch (error) {
    logError(`Single complex host upload error: ${error.message}`);
    return false;
  }
}

async function testFullDataset() {
  logStep(3, 'Testing full dataset upload');
  
  const fullData = JSON.parse(fs.readFileSync(HOSTS_DATA_PATH, 'utf8'));
  
  try {
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
    formData.append('file', jsonBlob, 'full_dataset.json');

    const response = await fetch(`${API_BASE_URL}/assets/hosts/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      logSuccess('Full dataset upload works');
      return true;
    } else {
      logError(`Full dataset upload failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    logError(`Full dataset upload error: ${error.message}`);
    return false;
  }
}

async function testRetrieval() {
  logStep(4, 'Testing host retrieval');
  
  try {
    const response = await fetch(`${API_BASE_URL}/assets/hosts`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      logSuccess(`Host retrieval works: ${result.data.total || 0} hosts found`);
      return true;
    } else {
      logError(`Host retrieval failed: ${result.error}`);
      logInfo(`Response status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Host retrieval error: ${error.message}`);
    return false;
  }
}

async function analyzeDatasetStructure() {
  logStep(5, 'Analyzing dataset structure');
  
  const fullData = JSON.parse(fs.readFileSync(HOSTS_DATA_PATH, 'utf8'));
  
  logInfo(`Dataset has ${fullData.hosts.length} hosts`);
  
  fullData.hosts.forEach((host, index) => {
    logInfo(`Host ${index + 1} (${host.ip}):`);
    logInfo(`  - ID: ${host.id || 'missing'}`);
    logInfo(`  - Services: ${host.services?.length || 0}`);
    logInfo(`  - Has DNS: ${!!host.dns}`);
    logInfo(`  - Has OS: ${!!host.operating_system}`);
    logInfo(`  - Has Threat Intel: ${!!host.threat_intelligence}`);
    
    // Check for any unusual fields
    const standardFields = ['ip', 'id', 'location', 'autonomous_system', 'services', 'dns', 'operating_system', 'threat_intelligence'];
    const extraFields = Object.keys(host).filter(key => !standardFields.includes(key));
    if (extraFields.length > 0) {
      logWarning(`  - Extra fields: ${extraFields.join(', ')}`);
    }
  });
}

async function main() {
  log('\n🔍 Staging API Diagnostic Tool', 'bright');
  log('===============================', 'bright');
  
  try {
    // Test different scenarios
    const simpleWorks = await testSimpleHost();
    const complexWorks = await testComplexHost();
    const fullWorks = await testFullDataset();
    const retrievalWorks = await testRetrieval();
    
    // Analyze the dataset
    await analyzeDatasetStructure();
    
    // Summary
    log('\n📊 Diagnostic Summary', 'cyan');
    log('====================', 'cyan');
    
    if (simpleWorks && !complexWorks) {
      logWarning('Issue appears to be with complex host data structure');
      logInfo('Recommendation: Check schema validation for complex fields');
    } else if (simpleWorks && complexWorks && !fullWorks) {
      logWarning('Issue appears to be with bulk operations or dataset size');
      logInfo('Recommendation: Check bulk insert limits or timeout settings');
    } else if (!retrievalWorks) {
      logWarning('Upload works but retrieval fails');
      logInfo('Recommendation: Check schema validation in retrieval logic');
    } else if (!simpleWorks) {
      logError('Basic functionality is broken');
      logInfo('Recommendation: Check database connection and basic API setup');
    } else {
      logSuccess('All tests passed - API appears to be working correctly');
    }
    
  } catch (error) {
    logError(`Diagnostic failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the diagnostic
main().catch(console.error);
