import { describe, it, expect } from "bun:test";
import webDataset from "./web_properties_dataset.json";

describe("Web Assets Upload - Data Validation", () => {
  describe("Real Dataset Structure", () => {
    it("should have valid dataset structure", () => {
      expect(webDataset).toBeDefined();
      expect(webDataset.metadata).toBeDefined();
      expect(webDataset.certificates).toBeDefined();
      expect(Array.isArray(webDataset.certificates)).toBe(true);
      expect(webDataset.certificates.length).toBe(3);
    });

    it("should have valid certificate fingerprints", () => {
      for (const cert of webDataset.certificates) {
        // SHA256 fingerprint should be 64 hex characters
        expect(cert.fingerprint_sha256).toMatch(/^[0-9a-fA-F]{64}$/);
        
        // SHA1 fingerprint should be 40 hex characters
        expect(cert.fingerprint_sha1).toMatch(/^[0-9a-fA-F]{40}$/);
        
        // MD5 fingerprint should be 32 hex characters
        expect(cert.fingerprint_md5).toMatch(/^[0-9a-fA-F]{32}$/);
      }
    });

    it("should have valid domains", () => {
      for (const cert of webDataset.certificates) {
        expect(Array.isArray(cert.domains)).toBe(true);
        expect(cert.domains.length).toBeGreaterThan(0);
        
        // Each domain should be a non-empty string
        for (const domain of cert.domains) {
          expect(typeof domain).toBe("string");
          expect(domain.length).toBeGreaterThan(0);
        }
      }
    });

    it("should have valid certificate metadata", () => {
      for (const cert of webDataset.certificates) {
        // Subject should exist
        expect(cert.subject).toBeDefined();
        expect(typeof cert.subject).toBe("object");
        
        // Issuer should exist
        expect(cert.issuer).toBeDefined();
        expect(typeof cert.issuer).toBe("object");
        expect(cert.issuer.common_name).toBeDefined();
        
        // Validity period should exist
        expect(cert.validity_period).toBeDefined();
        expect(cert.validity_period.not_before).toBeDefined();
        expect(cert.validity_period.not_after).toBeDefined();
      }
    });

    it("should contain expected domains", () => {
      const allDomains = webDataset.certificates.flatMap(cert => cert.domains);
      
      // Check for specific domains we know should be in the dataset
      expect(allDomains).toContain("gamecogames.com");
      expect(allDomains).toContain("www.gamecogames.com");
      expect(allDomains).toContain("www.ww.prayerculture.tv");
    });

    it("should have certificate transparency data", () => {
      for (const cert of webDataset.certificates) {
        if (cert.certificate_transparency) {
          expect(cert.certificate_transparency.logs_count).toBeGreaterThanOrEqual(0);
          expect(cert.certificate_transparency.first_seen).toBeDefined();
          expect(Array.isArray(cert.certificate_transparency.logs)).toBe(true);
        }
      }
    });

    it("should have security analysis data", () => {
      for (const cert of webDataset.certificates) {
        if (cert.security_analysis) {
          expect(cert.security_analysis.zlint_status).toBeDefined();
          expect(cert.security_analysis.risk_level).toBeDefined();
        }
      }
    });

    it("should have validation data", () => {
      for (const cert of webDataset.certificates) {
        if (cert.validation) {
          expect(typeof cert.validation.trusted_by_major_browsers).toBe("boolean");
          if (cert.validation.validation_paths) {
            expect(typeof cert.validation.validation_paths).toBe("object");
          }
        }
      }
    });
  });

  describe("Certificate Analysis", () => {
    it("should analyze certificate issuers", () => {
      const issuers = webDataset.certificates.map(cert => cert.issuer.organization);
      
      // Count unique issuers
      const uniqueIssuers = [...new Set(issuers)];
      expect(uniqueIssuers.length).toBeGreaterThan(0);
      
      // Log issuers for debugging
      console.log("Certificate issuers found:", uniqueIssuers);
    });

    it("should analyze certificate validity periods", () => {
      for (const cert of webDataset.certificates) {
        const notBefore = new Date(cert.validity_period.not_before);
        const notAfter = new Date(cert.validity_period.not_after);
        
        // Validity period should make sense
        expect(notAfter.getTime()).toBeGreaterThan(notBefore.getTime());
        
        // Certificate should have a reasonable validity period (not more than 10 years)
        const validityDays = (notAfter.getTime() - notBefore.getTime()) / (1000 * 60 * 60 * 24);
        expect(validityDays).toBeLessThan(3650); // 10 years
        expect(validityDays).toBeGreaterThan(0);
      }
    });

    it("should analyze key information", () => {
      for (const cert of webDataset.certificates) {
        if (cert.key_info) {
          expect(cert.key_info.algorithm).toBeDefined();
          expect(cert.key_info.key_size).toBeGreaterThan(0);
          
          // Common key sizes
          if (cert.key_info.algorithm === "RSA") {
            expect([1024, 2048, 3072, 4096]).toContain(cert.key_info.key_size);
          }
        }
      }
    });
  });

  describe("Upload Payload Structure", () => {
    it("should be compatible with upload endpoint", () => {
      // The dataset should have the structure expected by the upload endpoint
      expect(webDataset.certificates).toBeDefined();
      
      // Each certificate should have the minimum required fields for WebAsset schema
      for (const cert of webDataset.certificates) {
        expect(cert.fingerprint_sha256).toBeDefined();
        expect(cert.fingerprint_sha256).toMatch(/^[0-9a-fA-F]{64}$/);
        
        // Optional fields should be properly structured if present
        if (cert.fingerprint_sha1) {
          expect(cert.fingerprint_sha1).toMatch(/^[0-9a-fA-F]{40}$/);
        }
        if (cert.fingerprint_md5) {
          expect(cert.fingerprint_md5).toMatch(/^[0-9a-fA-F]{32}$/);
        }
        if (cert.domains) {
          expect(Array.isArray(cert.domains)).toBe(true);
        }
      }
    });

    it("should be valid JSON for upload", () => {
      // Test that the dataset can be serialized and parsed
      const jsonString = JSON.stringify(webDataset);
      expect(jsonString.length).toBeGreaterThan(0);
      
      const parsed = JSON.parse(jsonString);
      expect(parsed.certificates).toHaveLength(webDataset.certificates.length);
    });

    it("should have consistent metadata", () => {
      // Metadata should match actual certificate count
      expect(webDataset.metadata.certificates_count).toBe(webDataset.certificates.length);
      
      // Certificate fingerprints in metadata should match actual certificates
      const actualFingerprints = webDataset.certificates.map(cert => cert.fingerprint_sha256);
      for (const fingerprint of webDataset.metadata.certificate_fingerprints) {
        expect(actualFingerprints).toContain(fingerprint);
      }
    });
  });

  describe("Schema Compatibility", () => {
    it("should be compatible with WebAsset schema requirements", () => {
      for (const cert of webDataset.certificates) {
        // Required field: fingerprint_sha256
        expect(cert.fingerprint_sha256).toBeDefined();
        expect(typeof cert.fingerprint_sha256).toBe("string");
        expect(cert.fingerprint_sha256).toMatch(/^[0-9a-fA-F]{64}$/);
        
        // Optional fields should have correct types when present
        if (cert.fingerprint_sha1) {
          expect(typeof cert.fingerprint_sha1).toBe("string");
          expect(cert.fingerprint_sha1).toMatch(/^[0-9a-fA-F]{40}$/);
        }
        
        if (cert.fingerprint_md5) {
          expect(typeof cert.fingerprint_md5).toBe("string");
          expect(cert.fingerprint_md5).toMatch(/^[0-9a-fA-F]{32}$/);
        }
        
        if (cert.domains) {
          expect(Array.isArray(cert.domains)).toBe(true);
        }
        
        if (cert.subject) {
          expect(typeof cert.subject).toBe("object");
        }
        
        if (cert.issuer) {
          expect(typeof cert.issuer).toBe("object");
        }
      }
    });
  });
});

describe("Upload Flow Analysis", () => {
  it("should demonstrate the complete upload flow", () => {
    // This test documents the expected flow:
    
    // 1. Client uploads multipart/form-data with JSON file
    const uploadPayload = {
      certificates: webDataset.certificates
    };
    
    // 2. Controller validates content-type and extracts file
    expect(typeof uploadPayload).toBe("object");
    expect(uploadPayload.certificates).toBeDefined();
    
    // 3. Controller parses JSON and extracts certificates array
    expect(Array.isArray(uploadPayload.certificates)).toBe(true);
    expect(uploadPayload.certificates.length).toBe(3);
    
    // 4. Controller validates each certificate against WebAsset schema
    for (const cert of uploadPayload.certificates) {
      expect(cert.fingerprint_sha256).toMatch(/^[0-9a-fA-F]{64}$/);
    }
    
    // 5. Service layer processes the assets
    // 6. Store layer performs bulk update (overwrite existing only)
    // 7. Response includes processed assets
    
    console.log(`Upload flow would process ${uploadPayload.certificates.length} certificates`);
    console.log(`First certificate: ${uploadPayload.certificates[0].fingerprint_sha256}`);
    console.log(`Domains: ${uploadPayload.certificates[0].domains.join(", ")}`);
  });
});
