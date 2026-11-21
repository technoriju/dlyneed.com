// Cached catalog reads for public pages (home, shop, category, product).
// Revalidates every 10 minutes (spec §2); the admin will call revalidateTag("products") on edits.
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import {
  type CardProduct,
  type CatalogFilters,
  type CategoryWithCount,
  PRICE_OPTIONS,
} from "@/lib/catalog-types";
import { db } from "@/lib/db";
import { offPct } from "@/lib/format";
import { categoryNav } from "@/lib/nav";

export * from "@/lib/catalog-types";

const cardSelect = {
  slug: true,
  name: true,
  images: true,
  pricePaise: true,
  mrpPaise: true,
  ratingAvg: true,
  ratingCount: true,
} as const;

function toCard({ images, ...p }: { images: unknown } & Omit<CardProduct, "image">): CardProduct {
  return { ...p, image: (images as string[])[0] };
}

export async function getCategories() {
  "use cache";
  cacheLife({ revalidate: 600 });
  cacheTag("products");
  const rows = await db.category.findMany({ select: { id: true, slug: true, name: true, image: true, tint: true } });
  // Same order as the header's category menu.
  const order = categoryNav.map((c) => c.slug);
  return rows.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheLife({ revalidate: 600 });
  cacheTag("products");
  return db.category.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, image: true, tint: true },
  });
}

export async function getAllActiveProducts() {
  "use cache";
  cacheLife({ revalidate: 600 });
  cacheTag("products");
  return db.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      images: true,
      pricePaise: true,
      mrpPaise: true,
      ratingAvg: true,
      ratingCount: true,
      createdAt: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
  });
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  "use cache";
  cacheLife({ revalidate: 600 });
  cacheTag("products");
  const [categories, products] = await Promise.all([getCategories(), getAllActiveProducts()]);
  const countMap = new Map<string, number>();
  for (const p of products) {
    countMap.set(p.category.slug, (countMap.get(p.category.slug) ?? 0) + 1);
  }
  return categories.map((c) => ({
    ...c,
    count: countMap.get(c.slug) ?? 0,
  }));
}

export async function getBestSellers(): Promise<CardProduct[]> {
  "use cache";
  cacheLife({ revalidate: 600 });
  cacheTag("products");
  const rows = await db.product.findMany({
    where: { isActive: true, isBestSeller: true },
    select: cardSelect,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toCard);
}

function parsePriceBounds(priceKey?: string): { minPaise: number; maxPaise: number; id: string } {
  if (!priceKey || priceKey === "any") return { minPaise: 0, maxPaise: Infinity, id: "any" };
  const matched = PRICE_OPTIONS.find((p) => p.id === priceKey);
  if (matched) return { minPaise: matched.minPaise, maxPaise: matched.maxPaise, id: matched.id };

  // Handle format like "1000-3000" or "0-1000"
  if (priceKey === "0-1000") return { minPaise: 0, maxPaise: 999_99, id: "u1k" };
  if (priceKey === "1000-3000") return { minPaise: 1000_00, maxPaise: 3000_00, id: "1k-3k" };
  if (priceKey === "3000-5000") return { minPaise: 3000_00, maxPaise: 5000_00, id: "3k-5k" };
  if (priceKey === "5000+" || priceKey === "5000-") return { minPaise: 5000_01, maxPaise: Infinity, id: "o5k" };

  const parts = priceKey.split("-").map((s) => Number(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { minPaise: parts[0] * 100, maxPaise: parts[1] * 100, id: priceKey };
  }
  return { minPaise: 0, maxPaise: Infinity, id: "any" };
}

export async function getFilteredProducts(filters: CatalogFilters): Promise<CardProduct[]> {
  const all = await getAllActiveProducts();

  // Category filter
  let catSlugs: string[] = [];
  if (Array.isArray(filters.category)) {
    catSlugs = filters.category.flatMap((c) => c.split(",")).map((s) => s.trim().toLowerCase()).filter(Boolean);
  } else if (filters.category) {
    catSlugs = filters.category.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  const catSet = new Set(catSlugs);

  // Price filter
  const priceBounds = parsePriceBounds(filters.price);

  // Rating filter
  const minRating = filters.rating !== undefined && filters.rating !== "" ? Number(filters.rating) : 0;

  // Sale filter (35% off or more)
  const isSale =
    filters.sale === true ||
    filters.sale === "true" ||
    filters.sale === "1";

  // Search filter
  const q = filters.q ? filters.q.trim().toLowerCase() : "";

  // Apply filters
  const filtered = all.filter((p) => {
    if (catSet.size > 0 && !catSet.has(p.category.slug)) {
      return false;
    }
    if (p.pricePaise < priceBounds.minPaise || p.pricePaise > priceBounds.maxPaise) {
      return false;
    }
    if (!isNaN(minRating) && minRating > 0 && p.ratingAvg < minRating) {
      return false;
    }
    if (isSale && offPct(p.pricePaise, p.mrpPaise) < 35) {
      return false;
    }
    if (q) {
      const haystack = `${p.name} ${p.category.name} ${p.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // Sort
  const sort = filters.sort || "popular";
  filtered.sort((a, b) => {
    if (sort === "low" || sort === "price-asc") {
      return a.pricePaise - b.pricePaise;
    }
    if (sort === "high" || sort === "price-desc") {
      return b.pricePaise - a.pricePaise;
    }
    if (sort === "rating") {
      return b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount;
    }
    if (sort === "discount") {
      return offPct(b.pricePaise, b.mrpPaise) - offPct(a.pricePaise, a.mrpPaise);
    }
    if (sort === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    // "popular" default: highest ratingCount first, then id
    return b.ratingCount - a.ratingCount || b.id.localeCompare(a.id);
  });

  return filtered.map(toCard);
}
