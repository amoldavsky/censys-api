#!/bin/bash

# Test script for LangGraph summary generation
# Usage: ./bin/test-summary.sh [web|host]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if bun is available
if ! command -v bun &> /dev/null; then
    log_error "Bun is not installed or not in PATH"
    log_info "Install bun from: https://bun.sh"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    log_warning ".env file not found"
    log_info "Copy .env.example to .env and add your OPENAI_API_KEY"
fi

# Check if MongoDB is running
log_info "Checking if MongoDB is running..."
if ! pgrep -x "mongod" > /dev/null; then
    log_warning "MongoDB doesn't appear to be running"
    log_info "Start MongoDB with: bun run docker:mongodb"
    log_info "Or use full docker setup: bun run docker:up"
fi

# Get asset type from argument or default to web
ASSET_TYPE=${1:-web}

if [[ "$ASSET_TYPE" != "web" && "$ASSET_TYPE" != "host" ]]; then
    log_error "Invalid asset type: $ASSET_TYPE"
    log_info "Usage: $0 [web|host]"
    exit 1
fi

log_info "Testing $ASSET_TYPE asset summary generation..."

# Run the Node.js test script
bun run bin/test-summary-generation.js "$ASSET_TYPE"
