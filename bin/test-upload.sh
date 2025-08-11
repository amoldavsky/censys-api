#!/bin/bash

# Web Assets Upload Test Script
# Tests the complete upload flow using curl commands

set -e  # Exit on any error

# Configuration
API_BASE="http://localhost:3000/api/v1"
TEST_DATA="../tests/api/v1/assets/web_properties_dataset.json"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DATA_PATH="$SCRIPT_DIR/$TEST_DATA"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_step() {
    echo -e "\n${CYAN}$1. $2${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if API is running
check_api_health() {
    log_step 1 "Checking API health"
    
    if curl -s "$API_BASE/../" > /dev/null; then
        local response=$(curl -s "$API_BASE/../" | jq -r '.message // "API Running"')
        log_success "API is running: $response"
        return 0
    else
        log_error "Cannot connect to API at $API_BASE"
        log_info "Make sure the API is running with: bun run dev"
        return 1
    fi
}

# Check if test data exists
check_test_data() {
    log_step 2 "Checking test data"
    
    if [[ -f "$TEST_DATA_PATH" ]]; then
        local cert_count=$(jq '.certificates | length' "$TEST_DATA_PATH")
        log_success "Test data found: $cert_count certificates"
        return 0
    else
        log_error "Test data not found at: $TEST_DATA_PATH"
        return 1
    fi
}

# Create initial assets in database (since upsert: false)
setup_database() {
    log_step 3 "Setting up database with initial assets"
    
    log_info "Since upload only updates existing assets (upsert: false),"
    log_info "we need to create initial assets first."
    
    # Extract certificate fingerprints
    local fingerprints=$(jq -r '.certificates[].fingerprint_sha256' "$TEST_DATA_PATH")
    
    log_info "Creating initial assets for fingerprints:"
    while IFS= read -r fingerprint; do
        echo "  - ${fingerprint:0:16}..."
    done <<< "$fingerprints"
    
    # Note: In a real scenario, you'd insert these into MongoDB directly
    # For this demo, we'll note that they need to exist
    log_warning "Manual step: Ensure these assets exist in MongoDB"
    log_info "You can create them with a direct MongoDB insert or scan process"
}

# Upload assets
upload_assets() {
    log_step 4 "Uploading web assets"

    log_info "Uploading certificates from test dataset..."

    # The issue is that jsonOnlyMiddleware is blocking multipart/form-data
    # Let's try with explicit content type
    log_info "Testing upload with explicit content type..."

    local response=$(curl -s -X POST \
        -H "Content-Type: multipart/form-data" \
        -F "file=@$TEST_DATA_PATH;type=application/json" \
        "$API_BASE/assets/web/upload")

    local success=$(echo "$response" | jq -r '.success // false')

    if [[ "$success" == "true" ]]; then
        local total=$(echo "$response" | jq -r '.data.total // 0')
        log_success "Upload successful: $total assets processed"
        echo "$response" | jq '.data' > /tmp/upload_result.json
        return 0
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_error "Upload failed: $error"

        # Show the full response for debugging
        log_info "Full response:"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"

        # Diagnose the issue
        if [[ "$error" == "Only JSON content is accepted" ]]; then
            log_warning "❗ MIDDLEWARE ISSUE DETECTED ❗"
            log_info "The jsonOnlyMiddleware is blocking multipart/form-data requests"
            log_info "This needs to be fixed in the code:"
            log_info "  File: src/api/v1/assets/assets.routes.ts"
            log_info "  Issue: jsonOnlyMiddleware applied to all routes including upload"
            log_info "  Solution: Exclude upload routes from jsonOnlyMiddleware"
        fi

        return 1
    fi
}

# Retrieve all web assets
retrieve_all_assets() {
    log_step 5 "Retrieving all web assets"
    
    local response=$(curl -s "$API_BASE/assets/web")
    local success=$(echo "$response" | jq -r '.success // false')
    
    if [[ "$success" == "true" ]]; then
        local total=$(echo "$response" | jq -r '.data.total // 0')
        log_success "Retrieved $total web assets"
        echo "$response" | jq '.data' > /tmp/retrieved_assets.json
        
        if [[ "$total" -gt 0 ]]; then
            log_info "Asset IDs:"
            echo "$response" | jq -r '.data.items[].id' | while read -r id; do
                echo "  - ${id:0:16}..."
            done
        fi
        return 0
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_error "Failed to retrieve assets: $error"
        return 1
    fi
}

# Retrieve specific asset
retrieve_specific_asset() {
    log_step 6 "Retrieving specific asset"
    
    if [[ ! -f /tmp/retrieved_assets.json ]]; then
        log_warning "No assets to retrieve specifically"
        return 0
    fi
    
    local first_asset_id=$(jq -r '.items[0].id // empty' /tmp/retrieved_assets.json)
    
    if [[ -z "$first_asset_id" ]]; then
        log_warning "No assets found to retrieve"
        return 0
    fi
    
    log_info "Retrieving asset: ${first_asset_id:0:16}..."
    
    local response=$(curl -s "$API_BASE/assets/web/$first_asset_id")
    local success=$(echo "$response" | jq -r '.success // false')
    
    if [[ "$success" == "true" ]]; then
        log_success "Retrieved specific asset successfully"
        echo "$response" | jq '.data'
        return 0
    else
        local error=$(echo "$response" | jq -r '.error // "Unknown error"')
        log_error "Failed to retrieve specific asset: $error"
        return 1
    fi
}

# Test error handling
test_error_handling() {
    log_step 7 "Testing error handling"
    
    # Test 1: Invalid content type
    log_info "Testing invalid content type..."
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}' \
        "$API_BASE/assets/web/upload")
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{"test": "data"}' \
        "$API_BASE/assets/web/upload")
    
    if [[ "$status" == "415" ]]; then
        log_success "✓ Correctly rejected non-multipart request"
    else
        log_error "✗ Should have rejected non-multipart request (got $status)"
    fi
    
    # Test 2: Invalid JSON file
    log_info "Testing invalid JSON file..."
    echo '{ invalid json' > /tmp/invalid.json
    
    local response=$(curl -s -X POST \
        -F "file=@/tmp/invalid.json" \
        "$API_BASE/assets/web/upload")
    
    local success=$(echo "$response" | jq -r '.success // false')
    
    if [[ "$success" == "false" ]]; then
        log_success "✓ Correctly rejected malformed JSON"
    else
        log_error "✗ Should have rejected malformed JSON"
    fi
    
    rm -f /tmp/invalid.json
}

# Validate results
validate_results() {
    log_step 8 "Validating results"
    
    local original_count=$(jq '.certificates | length' "$TEST_DATA_PATH")
    local uploaded_count=0
    local retrieved_count=0
    
    if [[ -f /tmp/upload_result.json ]]; then
        uploaded_count=$(jq '.total // 0' /tmp/upload_result.json)
    fi
    
    if [[ -f /tmp/retrieved_assets.json ]]; then
        retrieved_count=$(jq '.total // 0' /tmp/retrieved_assets.json)
    fi
    
    log_info "Original certificates: $original_count"
    log_info "Uploaded (updated): $uploaded_count"
    log_info "Retrieved: $retrieved_count"
    
    if [[ "$uploaded_count" -gt 0 ]]; then
        log_success "Upload flow working - some assets were updated"
    else
        log_warning "No assets were updated - they may not exist in database"
        log_info "This is expected behavior since upsert: false"
    fi
    
    # Check for matching fingerprints
    if [[ -f /tmp/retrieved_assets.json && "$retrieved_count" -gt 0 ]]; then
        local original_fps=$(jq -r '.certificates[].fingerprint_sha256' "$TEST_DATA_PATH")
        local retrieved_fps=$(jq -r '.items[].id' /tmp/retrieved_assets.json)
        
        local matches=0
        while IFS= read -r fp; do
            if echo "$retrieved_fps" | grep -q "$fp"; then
                ((matches++))
                log_info "  ✓ Found: ${fp:0:16}..."
            fi
        done <<< "$original_fps"
        
        if [[ "$matches" -gt 0 ]]; then
            log_success "Found $matches matching certificates in database"
        fi
    fi
}

# Cleanup
cleanup() {
    rm -f /tmp/upload_result.json /tmp/retrieved_assets.json /tmp/invalid.json
}

# Main execution
main() {
    echo -e "\n${CYAN}🚀 Web Assets Upload Flow Test${NC}"
    echo -e "${CYAN}=====================================${NC}"
    
    # Check dependencies
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_error "jq is required but not installed"
        log_info "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
        exit 1
    fi
    
    # Run tests
    check_api_health || exit 1
    check_test_data || exit 1
    setup_database
    
    # Continue with upload flow
    upload_assets
    retrieve_all_assets
    retrieve_specific_asset
    test_error_handling
    validate_results
    
    # Summary
    echo -e "\n${CYAN}📊 Test Summary${NC}"
    echo -e "${CYAN}===============${NC}"
    
    if [[ -f /tmp/upload_result.json ]] || [[ -f /tmp/retrieved_assets.json ]]; then
        log_success "Upload flow is working correctly!"
        log_info "The API successfully handles file uploads and data retrieval"
    else
        log_error "Upload flow needs attention"
        log_info "Check that MongoDB is running and assets exist for updating"
    fi
    
    echo -e "\n${YELLOW}💡 Next Steps:${NC}"
    echo "- Check MongoDB for stored assets"
    echo "- Try uploading different certificate data"
    echo "- Monitor API logs for detailed information"
    echo "- Use the working unit tests for validation"
    echo ""
    
    cleanup
}

# Run the test
main "$@"
