import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "../lib/catalog";

describe("Product Detail Page (Step 5)", () => {
  it("fetches product details by slug with variants, specs, and highlights", async () => {
    const product = await getProductBySlug("wireless-headphones");
    expect(product).toBeDefined();
    expect(product?.name).toBe("Wireless Headphones");
    expect(product?.pricePaise).toBe(299900);
    expect(product?.mrpPaise).toBe(449900);
    expect(product?.category.slug).toBe("electronics");
    expect(product?.optionName).toBe("Colour");
    expect(product?.variants.length).toBe(3); // Graphite, Sand, Olive
    expect(product?.specs.length).toBeGreaterThan(0);
    expect(product?.highlights.length).toBeGreaterThan(0);
  });

  it("returns null for non-existent product slug", async () => {
    const product = await getProductBySlug("non-existent-product");
    expect(product).toBeNull();
  });

  it("fetches related products prioritizing same category and excluding current product", async () => {
    const related = await getRelatedProducts("luxury-perfume", "beauty");
    expect(related.length).toBe(4);
    // Luxury perfume should not be in related
    expect(related.some((p) => p.slug === "luxury-perfume")).toBe(false);
    // Botanical face serum (beauty category) should be first
    expect(related[0].slug).toBe("botanical-face-serum");
  });

  it("returns all product slugs for static generation", async () => {
    const slugs = await getAllProductSlugs();
    expect(slugs.length).toBe(10);
    expect(slugs).toContain("smart-watch-series-5");
    expect(slugs).toContain("wireless-headphones");
    expect(slugs).toContain("travel-backpack");
  });
});
