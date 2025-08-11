#!/usr/bin/env node

/**
 * Database Setup Script for Upload Testing
 * 
 * This script prepares MongoDB with initial assets so that the upload
 * endpoint can update them (since upsert: false).
 * 
 * Usage:
 *   node bin/setup-test-db.js
 *   MONGO_URL=mongodb://localhost:27017/censys_dev node bin/setup-test-db.js
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/censys_dev';
const TEST_DATA_PATH = path.join(__dirname, '../tests/api/v1/assets/web_properties_dataset.json');
const COLLECTION_NAME = 'web_assets';

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

async function connectToMongoDB() {
  try {
    logInfo(`Connecting to MongoDB: ${MONGO_URL}`);
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    logSuccess('Connected to MongoDB');
    return client;
  } catch (error) {
    logError(`Failed to connect to MongoDB: ${error.message}`);
    logInfo('Make sure MongoDB is running locally');
    throw error;
  }
}

function loadTestData() {
  try {
    if (!fs.existsSync(TEST_DATA_PATH)) {
      throw new Error(`Test data file not found: ${TEST_DATA_PATH}`);
    }
    
    const data = JSON.parse(fs.readFileSync(TEST_DATA_PATH, 'utf8'));
    logSuccess(`Loaded test data: ${data.certificates.length} certificates`);
    return data;
  } catch (error) {
    logError(`Failed to load test data: ${error.message}`);
    throw error;
  }
}

function createInitialAssets(certificates) {
  const now = new Date();
  
  return certificates.map(cert => ({
    _id: cert.fingerprint_sha256,
    source: 'scan', // Initial source before upload
    createdAt: now,
    updatedAt: now,
    // Add minimal required fields for the asset to exist
    fingerprint_sha256: cert.fingerprint_sha256,
    // Note: We don't add all the certificate data here since
    // the upload will overwrite it anyway
  }));
}

async function setupDatabase(client, testData) {
  try {
    const db = client.db();
    const collection = db.collection(COLLECTION_NAME);
    
    logInfo(`Setting up collection: ${COLLECTION_NAME}`);
    
    // Clear existing test data
    const deleteResult = await collection.deleteMany({
      fingerprint_sha256: { 
        $in: testData.certificates.map(cert => cert.fingerprint_sha256) 
      }
    });
    
    if (deleteResult.deletedCount > 0) {
      logInfo(`Cleared ${deleteResult.deletedCount} existing test assets`);
    }
    
    // Create initial assets
    const initialAssets = createInitialAssets(testData.certificates);
    
    logInfo(`Creating ${initialAssets.length} initial assets...`);
    
    const insertResult = await collection.insertMany(initialAssets, { ordered: false });
    
    logSuccess(`Created ${insertResult.insertedCount} initial assets`);
    
    // Verify the assets exist
    const count = await collection.countDocuments({
      fingerprint_sha256: { 
        $in: testData.certificates.map(cert => cert.fingerprint_sha256) 
      }
    });
    
    logSuccess(`Verified: ${count} assets exist in database`);
    
    return insertResult;
    
  } catch (error) {
    logError(`Failed to setup database: ${error.message}`);
    throw error;
  }
}

async function verifySetup(client, testData) {
  try {
    const db = client.db();
    const collection = db.collection(COLLECTION_NAME);
    
    logInfo('Verifying database setup...');
    
    // Check each certificate fingerprint
    for (const cert of testData.certificates) {
      const asset = await collection.findOne({ _id: cert.fingerprint_sha256 });
      
      if (asset) {
        logInfo(`✓ Asset exists: ${cert.fingerprint_sha256.substring(0, 16)}... (source: ${asset.source})`);
      } else {
        logWarning(`✗ Asset missing: ${cert.fingerprint_sha256.substring(0, 16)}...`);
      }
    }
    
    const totalCount = await collection.countDocuments({});
    logInfo(`Total assets in collection: ${totalCount}`);
    
    return true;
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    return false;
  }
}

async function showUploadInstructions(testData) {
  log('\n📋 Upload Test Instructions', 'cyan');
  log('============================', 'cyan');
  
  logInfo('Database is now ready for upload testing!');
  logInfo('');
  logInfo('The following assets are ready to be updated:');
  
  testData.certificates.forEach((cert, index) => {
    const domains = cert.domains ? cert.domains.slice(0, 2).join(', ') : 'No domains';
    logInfo(`${index + 1}. ${cert.fingerprint_sha256.substring(0, 16)}... (${domains})`);
  });
  
  log('\n🚀 Next Steps:', 'yellow');
  log('1. Start the API server:', 'yellow');
  log('   bun run dev', 'bright');
  log('');
  log('2. Run the upload test:', 'yellow');
  log('   chmod +x bin/test-upload.sh', 'bright');
  log('   ./bin/test-upload.sh', 'bright');
  log('');
  log('   OR use the Node.js version:', 'yellow');
  log('   node bin/test-upload-flow.js', 'bright');
  log('');
  log('3. Check the results:', 'yellow');
  log('   - Assets should be updated with source: "upload"', 'bright');
  log('   - API should return the updated assets', 'bright');
  log('');
}

async function main() {
  log('\n🔧 Database Setup for Upload Testing', 'bright');
  log('=====================================', 'bright');
  
  let client;
  
  try {
    // Load test data
    const testData = loadTestData();
    
    // Connect to MongoDB
    client = await connectToMongoDB();
    
    // Setup database
    await setupDatabase(client, testData);
    
    // Verify setup
    await verifySetup(client, testData);
    
    // Show instructions
    await showUploadInstructions(testData);
    
    logSuccess('Database setup completed successfully!');
    
  } catch (error) {
    logError(`Setup failed: ${error.message}`);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      logInfo('Disconnected from MongoDB');
    }
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Database Setup Script for Upload Testing

Usage:
  node scripts/setup-test-db.js [options]

Environment Variables:
  MONGO_URL    MongoDB connection string (default: mongodb://localhost:27017/censys_dev)

Options:
  --help, -h   Show this help message

This script:
1. Connects to MongoDB
2. Creates initial assets from the test dataset
3. Prepares the database for upload testing
4. Shows instructions for running upload tests

The upload endpoint only updates existing assets (upsert: false),
so this script creates the initial assets that can be updated.
`);
  process.exit(0);
}

// Run the setup
main().catch(error => {
  logError(`Setup script failed: ${error.message}`);
  process.exit(1);
});
