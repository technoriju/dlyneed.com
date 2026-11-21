import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { metadata as helpMetadata } from "../app/help/page";
import { metadata as shippingMetadata } from "../app/policies/shipping/page";
import { metadata as returnsMetadata } from "../app/policies/returns/page";
import { metadata as privacyMetadata } from "../app/policies/privacy/page";
import { metadata as termsMetadata } from "../app/policies/terms/page";
import { metadata as contactMetadata } from "../app/contact/page";
import nextConfig from "../next.config";

describe("SEO, Sitemaps, Policies & Security Headers (Step 10)", () => {
  describe("Robots Configuration (app/robots.ts)", () => {
    it("generates robots.txt rules blocking private routes and declaring sitemap", () => {
      const res = robots();
      expect(res.rules).toBeDefined();

      const rules = Array.isArray(res.rules) ? res.rules[0] : res.rules;
      expect(rules.allow).toBe("/");
      expect(rules.disallow).toContain("/cart");
      expect(rules.disallow).toContain("/checkout");
      expect(rules.disallow).toContain("/account");
      expect(rules.disallow).toContain("/api");

      expect(res.sitemap).toMatch(/sitemap\.xml$/);
    });
  });

  describe("Sitemap Generation (app/sitemap.ts)", () => {
    it("generates complete sitemap including static, category, and product URLs", async () => {
      const items = await sitemap();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(15);

      const urls = items.map((i) => i.url);

      // Verify static pages
      expect(urls.some((u) => u.endsWith("/shop"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/deals"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/help"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/contact"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/policies/shipping"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/policies/returns"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/policies/privacy"))).toBe(true);
      expect(urls.some((u) => u.endsWith("/policies/terms"))).toBe(true);

      // Verify dynamic category pages
      expect(urls.some((u) => u.includes("/category/electronics"))).toBe(true);
      expect(urls.some((u) => u.includes("/category/fashion"))).toBe(true);

      // Verify dynamic product pages
      expect(urls.some((u) => u.includes("/product/wireless-headphones"))).toBe(true);

      // Verify valid properties on each entry
      for (const entry of items) {
        expect(entry.url).toMatch(/^https?:\/\//);
        expect(entry.priority).toBeGreaterThanOrEqual(0.1);
        expect(entry.priority).toBeLessThanOrEqual(1.0);
        expect(entry.changeFrequency).toBeDefined();
      }
    });
  });

  describe("Policy & Help Metadata (Razorpay Compliance)", () => {
    it("provides canonical URLs and descriptive metadata for all policy pages", () => {
      expect(helpMetadata.title).toContain("Help & FAQs");
      expect(helpMetadata.alternates?.canonical).toBe("/help");

      expect(shippingMetadata.title).toContain("Shipping Policy");
      expect(shippingMetadata.alternates?.canonical).toBe("/policies/shipping");

      expect(returnsMetadata.title).toContain("Cancellation & Return Policy");
      expect(returnsMetadata.alternates?.canonical).toBe("/policies/returns");

      expect(privacyMetadata.title).toContain("Privacy Policy");
      expect(privacyMetadata.alternates?.canonical).toBe("/policies/privacy");

      expect(termsMetadata.title).toContain("Terms of Service");
      expect(termsMetadata.alternates?.canonical).toBe("/policies/terms");

      expect(contactMetadata.title).toContain("Contact Us");
      expect(contactMetadata.alternates?.canonical).toBe("/contact");
    });
  });

  describe("Security Headers Configuration (next.config.ts)", () => {
    it("configures essential security headers and CSP for Razorpay integration", async () => {
      expect(typeof nextConfig.headers).toBe("function");
      const headersConfig = await nextConfig.headers!();
      expect(headersConfig.length).toBeGreaterThan(0);

      const allHeaders = headersConfig[0].headers;
      const getHeader = (key: string) => allHeaders.find((h) => h.key === key)?.value;

      expect(getHeader("X-Content-Type-Options")).toBe("nosniff");
      expect(getHeader("X-Frame-Options")).toBe("DENY");
      expect(getHeader("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
      expect(getHeader("Strict-Transport-Security")).toContain("max-age=");

      const csp = getHeader("Content-Security-Policy");
      expect(csp).toBeDefined();
      expect(csp).toContain("checkout.razorpay.com");
      expect(csp).toContain("api.razorpay.com");
      expect(csp).toContain("frame-ancestors 'none'");
    });
  });
});
