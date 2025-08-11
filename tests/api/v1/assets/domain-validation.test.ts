import { describe, it, expect } from "bun:test";

describe("Web Asset Domain Logic", () => {
  describe("Shortest Domain Selection", () => {
    it("should select shortest domain from multiple domains", () => {
      const domains = ["www.example.com", "example.com", "subdomain.example.com"];
      const shortestDomain = domains.reduce((shortest, current) => 
        current.length < shortest.length ? current : shortest
      );
      
      expect(shortestDomain).toBe("example.com");
    });

    it("should handle single domain", () => {
      const domains = ["single.com"];
      const shortestDomain = domains.reduce((shortest, current) => 
        current.length < shortest.length ? current : shortest
      );
      
      expect(shortestDomain).toBe("single.com");
    });

    it("should handle domains of equal length", () => {
      const domains = ["test.com", "demo.com"];
      const shortestDomain = domains.reduce((shortest, current) => 
        current.length < shortest.length ? current : shortest
      );
      
      // Should return the first one when lengths are equal
      expect(shortestDomain).toBe("test.com");
    });

    it("should handle complex domain scenarios", () => {
      const domains = ["a.b.c.d.example.com", "short.com", "www.verylongdomainname.com"];
      const shortestDomain = domains.reduce((shortest, current) => 
        current.length < shortest.length ? current : shortest
      );
      
      expect(shortestDomain).toBe("short.com");
    });
  });

  describe("Domain Validation Logic", () => {
    it("should validate empty domains array", () => {
      const domains: string[] = [];
      const hasValidDomains = domains && domains.length > 0;
      
      expect(hasValidDomains).toBe(false);
    });

    it("should validate undefined domains", () => {
      const domains: string[] | undefined = undefined;
      const hasValidDomains = !!(domains && domains.length > 0);

      expect(hasValidDomains).toBe(false);
    });

    it("should validate valid domains array", () => {
      const domains = ["example.com"];
      const hasValidDomains = domains && domains.length > 0;
      
      expect(hasValidDomains).toBe(true);
    });
  });
});
