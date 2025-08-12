import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { routes } from "@/api/v1/chat/chat.routes";

describe("Chat Routes", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route("/api/v1", routes);
  });

  describe("POST /api/v1/chat", () => {
    it("should accept valid chat request", async () => {
      const requestBody = {
        messages: [
          { role: "user", content: "Hello, can you help me analyze my assets?" }
        ],
        assetId: "example.com",
        assetType: "web"
      };

      const response = await app.request("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.role).toBe("assistant");
      expect(data.data.content).toBeDefined();
    });

    it("should reject request without messages", async () => {
      const requestBody = {
        assetId: "example.com",
        assetType: "web"
      };

      const response = await app.request("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("should reject request with empty messages array", async () => {
      const requestBody = {
        messages: [],
        assetId: "example.com",
        assetType: "web"
      };

      const response = await app.request("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it("should accept request without asset data", async () => {
      const requestBody = {
        messages: [
          { role: "user", content: "Hello" }
        ]
      };

      const response = await app.request("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should reject non-JSON content type", async () => {
      const response = await app.request("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "not json",
      });

      expect(response.status).toBe(415);
    });

    it("should handle conversation history", async () => {
      const requestBody = {
        messages: [
          { role: "user", content: "What are web assets?" },
          { role: "assistant", content: "Web assets are digital certificates..." },
          { role: "user", content: "Can you analyze mine?" }
        ],
        assetId: "example.com",
        assetType: "web"
      };

      const response = await app.request("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.role).toBe("assistant");
    });

    it("should convert snake_case keys to camelCase via middleware", async () => {
      // Send request with snake_case keys
      const requestBodyWithSnakeCase = {
        messages: [
          { role: "user", content: "Hello" }
        ],
        asset_id: "example.com",
        asset_type: "web",
        summary_id: "summary-123"
      };

      const response = await app.request("/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBodyWithSnakeCase),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.role).toBe("assistant");
      expect(data.data.content).toBeDefined();
    });
  });
});
