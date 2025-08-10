// Test setup file
import "dotenv/config";
import { initializeAssetStore } from "../src/api/v1/assets/assets.store.ts";
import { createTestAssetStore } from "../src/api/v1/assets/stores/asset-store-factory";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.OPENAI_API_KEY = "test-key";
process.env.PORT = "3001";
process.env.MONGODB_URL = "mongodb://censys:censys_password@localhost:27017/censys_test?authSource=admin";

// Initialize test asset store
initializeAssetStore(createTestAssetStore());

// Global test timeout
jest.setTimeout(10000);
