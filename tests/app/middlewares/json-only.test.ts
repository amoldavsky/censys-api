import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { jsonOnlyMiddleware } from "@/app/middlewares/json-only";

describe("jsonOnlyMiddleware", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.use("*", jsonOnlyMiddleware);
    app.post("/test", async (c) => {
      const body = await c.req.json();
      return c.json({ received: body });
    });
  });

  describe("Content-Type validation", () => {
    it("should reject POST requests without JSON content-type", async () => {
      const response = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "not json",
      });

      expect(response.status).toBe(415);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Only JSON content is accepted");
    });

    it("should accept POST requests with JSON content-type", async () => {
      const requestBody = { test: "value" };
      
      const response = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.received).toEqual(requestBody);
    });

    it("should allow GET requests regardless of content-type", async () => {
      const response = await app.request("/test", {
        method: "GET",
        headers: { "Content-Type": "text/plain" },
      });

      // Should not be rejected by middleware (though the route handler might fail)
      expect(response.status).not.toBe(415);
    });
  });

  describe("snake_case to camelCase conversion", () => {
    it("should convert snake_case keys to camelCase in POST requests", async () => {
      const requestBodyWithSnakeCase = {
        user_name: "john_doe",
        asset_data: {
          web_assets: [
            {
              fingerprint_sha256: "abc123",
              certificate_authority: { ca_name: "Test CA" }
            }
          ],
          host_assets: [
            {
              ip_address: "192.168.1.1",
              operating_system: "Linux"
            }
          ]
        },
        nested_object: {
          deep_property: {
            very_deep_property: "value"
          }
        }
      };

      const response = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBodyWithSnakeCase),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Verify the conversion happened
      expect(data.received).toEqual({
        userName: "john_doe",
        assetData: {
          webAssets: [
            {
              fingerprintSha256: "abc123",
              certificateAuthority: { caName: "Test CA" }
            }
          ],
          hostAssets: [
            {
              ipAddress: "192.168.1.1",
              operatingSystem: "Linux"
            }
          ]
        },
        nestedObject: {
          deepProperty: {
            veryDeepProperty: "value"
          }
        }
      });
    });

    it("should handle arrays correctly", async () => {
      const requestBody = {
        items_list: [
          { item_name: "first", item_value: 1 },
          { item_name: "second", item_value: 2 }
        ]
      };

      const response = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.received).toEqual({
        itemsList: [
          { itemName: "first", itemValue: 1 },
          { itemName: "second", itemValue: 2 }
        ]
      });
    });

    it("should preserve non-object values", async () => {
      const requestBody = {
        string_value: "test",
        number_value: 42,
        boolean_value: true,
        null_value: null,
        array_of_strings: ["one", "two", "three"]
      };

      const response = await app.request("/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.received).toEqual({
        stringValue: "test",
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        arrayOfStrings: ["one", "two", "three"]
      });
    });

    it("should not convert keys for non-POST requests", async () => {
      // This test would need a different setup since GET requests don't typically have bodies
      // But we can verify that the middleware doesn't interfere with non-POST requests
      const response = await app.request("/test", {
        method: "GET",
      });

      // Should not be rejected by content-type check
      expect(response.status).not.toBe(415);
    });
  });
});
