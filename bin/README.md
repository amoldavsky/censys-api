# Upload Testing Scripts

This directory contains scripts to test the web assets upload functionality end-to-end with a local MongoDB database.

## Scripts Overview

### 🔧 `setup-test-db.js`
**Purpose**: Prepares MongoDB with initial assets for upload testing.

**Why needed**: The upload endpoint only updates existing assets (`upsert: false`), so we need to create initial assets first.

**Usage**:
```bash
# Default MongoDB connection
node bin/setup-test-db.js

# Custom MongoDB URL
MONGO_URL=mongodb://localhost:27017/censys_test node bin/setup-test-db.js
```

### 🚀 `test-upload-flow.js`
**Purpose**: Comprehensive Node.js script that tests the complete upload flow.

**Features**:
- API health checks
- File upload with FormData
- Asset retrieval
- Error handling validation
- Detailed logging and validation

**Usage**:
```bash
node bin/test-upload-flow.js
```

### 🧪 `test-upload.sh`
**Purpose**: Bash script using curl commands for upload testing.

**Features**:
- Simple curl-based testing
- Error handling validation
- Cross-platform compatibility
- Detailed output with colors

**Requirements**: `curl` and `jq`

**Usage**:
```bash
./bin/test-upload.sh
```

## Complete Testing Flow

### Step 1: Start MongoDB
```bash
# Using Docker (recommended)
bun run docker:mongodb

# Or start local MongoDB instance
mongod --dbpath /path/to/data
```

### Step 2: Setup Test Database
```bash
node bin/setup-test-db.js
```

This will:
- Connect to MongoDB
- Create initial assets from the test dataset
- Verify the setup
- Show next steps

### Step 3: Start the API
```bash
bun run dev
```

The API should start on `http://localhost:3000`

### Step 4: Run Upload Tests

**Option A: Node.js Script (Recommended)**
```bash
node bin/test-upload-flow.js
```

**Option B: Bash Script**
```bash
./bin/test-upload.sh
```

## What the Tests Do

### 1. **API Health Check**
- Verifies the API is running
- Checks basic connectivity

### 2. **File Upload Test**
- Uploads `web_properties_dataset.json` as multipart/form-data
- Tests the `/api/v1/assets/web/upload` endpoint
- Validates response format

### 3. **Data Retrieval**
- Retrieves all web assets via `/api/v1/assets/web`
- Retrieves specific assets by ID
- Validates data consistency

### 4. **Error Handling**
- Tests invalid content types
- Tests malformed JSON
- Tests missing files
- Validates error responses

### 5. **Data Validation**
- Compares uploaded vs retrieved data
- Validates fingerprint matching
- Checks source field updates

## Expected Results

### Successful Upload Flow
```
✅ API is running
✅ Test data loaded: 3 certificates
✅ Upload successful: 3 assets processed
✅ Retrieved 3 web assets
✅ Found matching certificates in database
```

### Database State After Upload
- Assets updated with `source: "upload"`
- `updatedAt` timestamp refreshed
- All certificate data preserved
- Original fingerprints maintained

## Test Dataset

The scripts use `tests/api/v1/assets/web_properties_dataset.json` which contains:

- **3 real certificates**
- **Domains**: gamecogames.com, www.gamecogames.com, www.ww.prayerculture.tv
- **Issuers**: Let's Encrypt, DigiCert Inc
- **Complete metadata**: fingerprints, validity periods, CT logs, etc.

## Troubleshooting

### "Cannot connect to API"
- Ensure API is running: `bun run dev`
- Check API is on port 3000
- Verify no firewall blocking

### "No assets were updated"
- Run database setup first: `node scripts/setup-test-db.js`
- Check MongoDB is running
- Verify assets exist in database

### "Database connection failed"
- Start MongoDB: `bun run docker:mongodb`
- Check MongoDB URL in environment
- Verify database permissions

### "Command not found: jq"
**macOS**: `brew install jq`
**Ubuntu**: `apt-get install jq`
**Windows**: Use Node.js script instead

## Advanced Usage

### Custom MongoDB Database
```bash
MONGO_URL=mongodb://localhost:27017/custom_db node bin/setup-test-db.js
MONGO_URL=mongodb://localhost:27017/custom_db node bin/test-upload-flow.js
```

### Different API Port
Edit the scripts to change `API_BASE_URL` or `API_BASE` variables.

### Custom Test Data
Replace the test dataset path in the scripts to use different certificate data.

## Integration with CI/CD

The scripts can be used in automated testing:

```bash
# Setup
node bin/setup-test-db.js

# Start API in background
bun run dev &
API_PID=$!

# Wait for API to start
sleep 5

# Run tests
node bin/test-upload-flow.js

# Cleanup
kill $API_PID
```

## Security Notes

- Scripts use local MongoDB connections only
- Test data contains real certificate fingerprints (public data)
- No sensitive information is transmitted
- Scripts are safe for development environments

## Next Steps

After running the tests:

1. **Check MongoDB** directly to see stored assets
2. **Monitor API logs** for detailed request/response info
3. **Try different datasets** by modifying the test data
4. **Run unit tests** for additional validation: `bun test tests/api/v1/assets/upload-simple.test.ts`

The scripts provide a complete end-to-end validation of the upload functionality and demonstrate the API working correctly with real certificate data.
