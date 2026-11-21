// Cached catalog reads for public pages (home, shop, category, product).
// Revalidates every 10 minutes (spec §2); the admin will call revalidateTag("products") on edits.
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { categoryNav } from "@/lib/nav";

export type CardProduct = {
  slug: string;
  name: string;
  image: string;
  pricePaise: number;
  mrpPaise: number;
  ratingAvg: number;
  ratingCount: number;
};

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
  const rows = await db.category.findMany({ select: { slug: true, name: true, image: true, tint: true } });
  // Same order as the header's category menu.
  const order = categoryNav.map((c) => c.slug);
  return rows.sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug));
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
