import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

import {
  PRICE_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
} from "../lib/catalog-types";
import {
  getCategoriesWithCounts,
  getCategoryBySlug,
  getFilteredProducts,
} from "../lib/catalog";

describe("Shop Catalog & Filtering", () => {
  it("provides valid filter and sort configuration options", () => {
    expect(PRICE_OPTIONS.length).toBeGreaterThan(0);
    expect(RATING_OPTIONS.length).toBeGreaterThan(0);
    expect(SORT_OPTIONS.length).toBeGreaterThan(0);
  });

  it("fetches categories with accurate product counts", async () => {
    const categories = await getCategoriesWithCounts();
    expect(categories.length).toBe(6);

    const beauty = categories.find((c) => c.slug === "beauty");
    expect(beauty).toBeDefined();
    expect(beauty?.name).toBe("Beauty");
    expect(beauty?.count).toBe(2); // Perfume and Serum
  });

  it("finds category by slug", async () => {
    const category = await getCategoryBySlug("electronics");
    expect(category).toBeDefined();
    expect(category?.name).toBe("Electronics");

    const nonExistent = await getCategoryBySlug("non-existent-category");
    expect(nonExistent).toBeNull();
  });

  it("returns all active products when no filters are applied", async () => {
    const products = await getFilteredProducts({});
    expect(products.length).toBe(10);
  });

  it("filters products by single category", async () => {
    const beautyProducts = await getFilteredProducts({ category: "beauty" });
    expect(beautyProducts.length).toBe(2);
    expect(beautyProducts.map((p) => p.slug).sort()).toEqual([
      "botanical-face-serum",
      "luxury-perfume",
    ]);
  });

  it("filters products by multiple categories", async () => {
    const products = await getFilteredProducts({
      category: ["beauty", "electronics"],
    });
    expect(products.length).toBe(3); // 2 beauty + 1 electronics (headphones)
  });

  it("filters products by price buckets", async () => {
    const under1k = await getFilteredProducts({ price: "u1k" });
    expect(under1k.length).toBe(4);
    for (const p of under1k) {
      expect(p.pricePaise).toBeLessThan(100000);
    }

    const range1k3k = await getFilteredProducts({ price: "1k-3k" });
    expect(range1k3k.length).toBe(4);
    for (const p of range1k3k) {
      expect(p.pricePaise).toBeGreaterThanOrEqual(100000);
      expect(p.pricePaise).toBeLessThanOrEqual(300000);
    }

    const over5k = await getFilteredProducts({ price: "o5k" });
    expect(over5k.length).toBe(1);
    expect(over5k[0].slug).toBe("tufted-accent-chair");
  });

  it("filters products by custom price string '1000-3000'", async () => {
    const range = await getFilteredProducts({ price: "1000-3000" });
    expect(range.length).toBe(4);
  });

  it("filters products by rating (4.5 & above)", async () => {
    const topRated = await getFilteredProducts({ rating: 4.5 });
    expect(topRated.length).toBe(8);
    for (const p of topRated) {
      expect(p.ratingAvg).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("filters deals with 35%+ off (sale: true)", async () => {
    const deals = await getFilteredProducts({ sale: true });
    expect(deals.length).toBe(3);
    const slugs = deals.map((p) => p.slug).sort();
    expect(slugs).toEqual([
      "everyday-cotton-tee",
      "luxury-perfume",
      "running-shoes",
    ]);
  });

  it("filters products by search keyword 'watch'", async () => {
    const searchResults = await getFilteredProducts({ q: "watch" });
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].slug).toBe("smart-watch-series-5");
  });

  it("sorts products by price low to high", async () => {
    const sorted = await getFilteredProducts({ sort: "low" });
    expect(sorted.length).toBe(10);
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].pricePaise).toBeLessThanOrEqual(sorted[i + 1].pricePaise);
    }
  });

  it("sorts products by price high to low", async () => {
    const sorted = await getFilteredProducts({ sort: "high" });
    expect(sorted.length).toBe(10);
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].pricePaise).toBeGreaterThanOrEqual(sorted[i + 1].pricePaise);
    }
  });

  it("sorts products by customer rating", async () => {
    const sorted = await getFilteredProducts({ sort: "rating" });
    expect(sorted[0].slug).toBe("mini-succulent-pot"); // rating 4.9
  });
});
