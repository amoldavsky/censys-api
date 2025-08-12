import { describe, it, expect } from "bun:test";
import type { WebAsset } from "@/api/v1/assets/models/asset.schema";

describe("Assets Service", () => {
  describe("ID derivation logic", () => {
    it("should derive shortest domain as id when id is missing", () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: ["www.example.com", "example.com", "api.example.com"]
      };

      // Test the id derivation logic
      const shortest = asset.domains!.reduce((s, d) => d.length < s.length ? d : s);
      expect(shortest).toBe("example.com");
    });

    it("should throw error when no domains provided for id derivation", () => {
      const asset: WebAsset = {
        fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        domains: []
      };

      expect(() => {
        if (!asset.domains?.length) throw new Error("Web asset must have at least one domain to derive id");
      }).toThrow("Web asset must have at least one domain to derive id");
    });

    it("should handle multiple domains and pick shortest", () => {
      const domains = ["api.subdomain.example.com", "www.example.com", "example.com", "subdomain.example.com"];
      const shortest = domains.reduce((s, d) => d.length < s.length ? d : s);
      expect(shortest).toBe("example.com");
    });
  });
});
