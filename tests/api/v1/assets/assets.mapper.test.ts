import { describe, it, expect } from "bun:test";
import {
  toWebAssetResponse,
  toWebAssetListResponse,
  toHostAssetResponse,
  toHostAssetListResponse
} from "@/api/v1/assets/assets.mapper";
import type { WebAsset, HostAsset } from "@/api/v1/assets/models/asset.schema";

describe("Assets Mapper", () => {
  const mockDate = new Date("2023-01-01T00:00:00.000Z");

  describe("Web Asset Mappers", () => {
    const mockWebAsset: WebAsset & { id: string; source: string; createdAt: Date; updatedAt: Date } = {
      fingerprint_sha256: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      domains: ["example.com", "www.example.com"],
      certificate_authority: { name: "Let's Encrypt" },
      validity_period: { status: "active" },
      security_analysis: { risk_level: "low" },
      id: "example.com", // Shortest domain as ID
      source: "upload",
      createdAt: mockDate,
      updatedAt: mockDate
    };

    it("should map web asset to response DTO", () => {
      const result = toWebAssetResponse(mockWebAsset);

      expect(result).toEqual({
        id: "example.com",
        source: "upload",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        domains: ["example.com", "www.example.com"],
        certificateAuthority: "Let's Encrypt",
        status: "active",
        risks: "low"
      });
    });

    it("should handle web asset without optional fields", () => {
      const minimalAsset: WebAsset & { id: string } = {
        fingerprint_sha256: "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        domains: ["test.com"],
        id: "test.com"
      };

      const result = toWebAssetResponse(minimalAsset);

      expect(result.id).toBe("test.com");
      expect(result.source).toBe("unknown");
      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it("should map web asset list to response DTO", () => {
      const assets = [mockWebAsset];
      const result = toWebAssetListResponse(assets);

      expect(result).toEqual({
        items: [{
          id: "example.com",
          source: "upload",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
          domains: ["example.com", "www.example.com"],
          certificateAuthority: "Let's Encrypt",
          status: "active",
          risks: "low"
        }],
        total: 1
      });
    });

    it("should handle empty web asset list", () => {
      const result = toWebAssetListResponse([]);

      expect(result).toEqual({
        items: [],
        total: 0
      });
    });
  });

  describe("Host Asset Mappers", () => {
    const mockHostAsset: HostAsset & { id: string; source: string; createdAt: Date; updatedAt: Date } = {
      ip: "192.168.1.1",
      location: { city: "New York", country: "US", country_code: "US" },
      autonomous_system: { asn: 12345, name: "Example AS" },
      services: [{ port: 22, protocol: "SSH" }],
      threat_intelligence: { risk_level: "medium" },
      id: "192.168.1.1",
      source: "scan",
      createdAt: mockDate,
      updatedAt: mockDate
    };

    it("should map host asset to response DTO", () => {
      const result = toHostAssetResponse(mockHostAsset);

      expect(result).toEqual({
        id: "192.168.1.1",
        source: "scan",
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
        ip: "192.168.1.1",
        asName: "Example AS",
        services: [{ port: 22, protocol: "SSH" }],
        risk: "medium",
        location: { city: "New York", country: "US", country_code: "US" }
      });
    });

    it("should handle host asset without optional fields", () => {
      const minimalAsset: HostAsset & { id: string } = {
        ip: "10.0.0.1",
        location: {},
        autonomous_system: {},
        id: "10.0.0.1"
      };

      const result = toHostAssetResponse(minimalAsset);

      expect(result.id).toBe("10.0.0.1");
      expect(result.ip).toBe("10.0.0.1");
      expect(result.source).toBe("unknown");
      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(result.asName).toBeUndefined();
      expect(result.services).toBeUndefined();
      expect(result.risk).toBeUndefined();
      expect(result.location).toEqual({});
    });

    it("should map host asset list to response DTO", () => {
      const assets = [mockHostAsset];
      const result = toHostAssetListResponse(assets);

      expect(result).toEqual({
        items: [{
          id: "192.168.1.1",
          source: "scan",
          createdAt: "2023-01-01T00:00:00.000Z",
          updatedAt: "2023-01-01T00:00:00.000Z",
          ip: "192.168.1.1",
          asName: "Example AS",
          services: [{ port: 22, protocol: "SSH" }],
          risk: "medium",
          location: { city: "New York", country: "US", country_code: "US" }
        }],
        total: 1
      });
    });

    it("should handle empty host asset list", () => {
      const result = toHostAssetListResponse([]);

      expect(result).toEqual({
        items: [],
        total: 0
      });
    });
  });


});
