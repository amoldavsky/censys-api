import { beforeAll, afterAll, beforeEach } from "bun:test";
import * as mongoose from "@/db/mongoose";
import mongooseLib from "mongoose";

// Test database configuration for integration tests
const TEST_MONGODB_URL = process.env.TEST_MONGODB_URL || "mongodb://localhost:27017/censys_test";

beforeAll(async () => {
  // Connect to test database
  process.env.MONGO_URL = TEST_MONGODB_URL;
  await mongoose.connect({ uri: TEST_MONGODB_URL });
});

afterAll(async () => {
  // Clean up and disconnect
  await mongoose.disconnect();
});

beforeEach(async () => {
  // Clear test database before each test
  if (mongoose.isConnected()) {
    const db = mongooseLib.connection.db;
    if (db) {
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        await db.collection(collection.name).deleteMany({});
      }
    }
  }
});

// Helper function to get connection for tests
export function getConnection() {
  return mongooseLib.connection;
}
