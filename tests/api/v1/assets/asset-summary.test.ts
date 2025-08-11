import { describe, it, expect, beforeEach } from "bun:test";
import { Hono } from "hono";
import { routes } from "@/api/v1/assets/assets.routes";
import type { WebAssetSummary, HostAssetSummary } from "@/api/v1/assets/models/asset-summary.schema";
import * as summarySvc from "@/api/v1/assets/asset-summary.service";
import "../../../integration-setup"; // Import integration test setup

describe("Asset Summary API", () => {
  let app: Hono;

  beforeEach(() => {
    app = new Hono();
    app.route("/api/v1", routes);
  });

  describe("GET /api/v1/assets/web/:id/summary", () => {
    it("should return 404 when summary does not exist", async () => {
      const response = await app.request("/api/v1/assets/web/nonexistent.com/summary");
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Asset summary not found");
    });

    it("should return summary when it exists", async () => {
      // Create a test summary
      const testSummary: WebAssetSummary = {
        id: "test.com",
        summary: "Test web asset summary",
        severity: "low",
        evidence: {
          domain: "test.com",
          cert_sha256: "test123",
          issuer: "Test CA",
          not_before: "2024-01-01T00:00:00Z",
          not_after: "2025-01-01T00:00:00Z",
          days_to_expiry: 365,
          key_type: "RSA",
          key_bits: 2048,
          sig_alg: "SHA256-RSA",
          san_count: 1,
          wildcard: false,
          https_redirect: true,
          waf_or_cdn_hint: "None",
          ct_logs_count: 3
        },
        findings: ["Test finding"],
        recommendations: ["Test recommendation"],
        assumptions: ["Test assumption"],
        data_coverage: {
          fields_present_pct: 100,
          missing_fields: []
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await summarySvc.saveWebAssetSummary(testSummary);

      const response = await app.request("/api/v1/assets/web/test.com/summary");
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("test.com");
      expect(data.data.summary).toBe("Test web asset summary");
      expect(data.data.severity).toBe("low");
      expect(data.data.evidence.domain).toBe("test.com");
    });
  });

  describe("GET /api/v1/assets/hosts/:id/summary", () => {
    it("should return 404 when summary does not exist", async () => {
      const response = await app.request("/api/v1/assets/hosts/192.168.1.1/summary");
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe("Asset summary not found");
    });

    it("should return summary when it exists", async () => {
      // Create a test summary
      const testSummary: HostAssetSummary = {
        id: "192.168.1.100",
        summary: "Test host asset summary",
        severity: "medium",
        evidence: {
          domain: null,
          cert_sha256: null,
          issuer: null,
          not_before: null,
          not_after: null,
          days_to_expiry: null,
          key_type: null,
          key_bits: null,
          sig_alg: null,
          san_count: null,
          wildcard: null,
          https_redirect: null,
          waf_or_cdn_hint: "None",
          ct_logs_count: null
        },
        findings: ["Test host finding"],
        recommendations: ["Test host recommendation"],
        assumptions: ["Test host assumption"],
        data_coverage: {
          fields_present_pct: 50,
          missing_fields: ["cert_sha256", "issuer"]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await summarySvc.saveHostAssetSummary(testSummary);

      const response = await app.request("/api/v1/assets/hosts/192.168.1.100/summary");
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("192.168.1.100");
      expect(data.data.summary).toBe("Test host asset summary");
      expect(data.data.severity).toBe("medium");
      expect(data.data.evidence.waf_or_cdn_hint).toBe("None");
    });
  });
});
