import { beforeAll, afterAll, beforeEach } from "bun:test";

// Global test setup - only for integration tests that need database
// Unit tests should not require database connection

// Test database configuration
const TEST_MONGODB_URL = process.env.TEST_MONGODB_URL || "mongodb://localhost:27017/censys_test";

// Only setup database for integration tests
export async function setupTestDatabase() {
  const mongoose = await import("@/db/mongoose");
  const mongooseLib = await import("mongoose");

  // Connect to test database
  process.env.MONGO_URL = TEST_MONGODB_URL;
  await mongoose.connect({ uri: TEST_MONGODB_URL });

  return {
    disconnect: async () => {
      await mongoose.disconnect();
    },
    clearCollections: async () => {
      if (mongoose.isConnected()) {
        const db = mongooseLib.default.connection.db;
        if (db) {
          const collections = await db.listCollections().toArray();
          for (const collection of collections) {
            await db.collection(collection.name).deleteMany({});
          }
        }
      }
    }
  };
}
