import { z } from "zod";

export const HostAssetSchema = z.object({
  ip: z.string(), // allows IPv4 & IPv6; change to .ip({ version: "v4" }) if needed
  location: z.object({}).loose(),            // accept any nested keys
  autonomous_system: z.object({}).loose(),   // accept any nested keys
  dns: z.object({}).loose().optional(),
  operating_system: z.object({}).loose().optional(),
  services: z.array(z.object({}).loose()).optional(), // array, but skip inner validation
  threat_intelligence: z.object({}).loose().optional(),
}).loose(); // keep any additional top-level keys too
export type HostAsset = z.infer<typeof HostAssetSchema>;

export const WebAssetSchema = z
  .object({
    fingerprint_sha256: z.string().regex(/^[0-9a-fA-F]{64}$/),
    fingerprint_sha1: z.string().regex(/^[0-9a-fA-F]{40}$/).optional(),
    fingerprint_md5: z.string().regex(/^[0-9a-fA-F]{32}$/).optional(),
    domains: z.array(z.string()).optional(),
    subject: z.object({}).loose().optional(),
    issuer: z.object({}).loose().optional(),
    validity_period: z.object({}).loose().optional(),
    key_info: z.object({}).loose().optional(),
    certificate_authority: z.object({}).loose().optional(),
    certificate_transparency: z.object({}).loose().optional(),
    validation: z.object({}).loose().optional(),
    revocation: z.object({}).loose().optional(),
    security_analysis: z.object({}).loose().optional(),
    threat_intelligence: z.object({}).loose().optional(),
    usage_indicators: z.object({}).loose().optional(),
  }).loose(); // keep any additional top-level keys too
export type WebAsset = z.infer<typeof WebAssetSchema>;