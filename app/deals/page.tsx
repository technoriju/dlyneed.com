import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/shop/ShopView";
import { getCategoriesWithCounts, getFilteredProducts } from "@/lib/catalog";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function normalizeParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
}

function parseCategories(val: string | string[] | undefined): string[] {
  if (Array.isArray(val)) {
    return val.flatMap((c) => c.split(",")).map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  if (val) {
    return val.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  return [];
}

export const metadata: Metadata = {
  title: "Deals – Up to 50% Off | ShopMate",
  description:
    "Limited time offers on selected items with 35% off or more. Extra ₹200 off orders over ₹1,999 with code SAVE200.",
  alternates: {
    canonical: "/deals",
  },
};

async function DealsContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = normalizeParam(sp.q);
  const price = normalizeParam(sp.price) || "any";
  const ratingStr = normalizeParam(sp.rating);
  const rating = ratingStr ? Number(ratingStr) : 0;
  // Deals default to discount sort and sale=true
  const sort = normalizeParam(sp.sort) || "discount";
  const selectedCategories = parseCategories(sp.category);

  const [categories, products] = await Promise.all([
    getCategoriesWithCounts(),
    getFilteredProducts({
      category: selectedCategories,
      price,
      rating,
      sale: true,
      sort,
      q,
    }),
  ]);

  return (
    <ShopView
      title="Deals"
      totalCount={products.length}
      products={products}
      categories={categories}
      selectedCategories={selectedCategories}
      price={price}
      rating={rating}
      sale={true}
      sort={sort}
      q={q}
      isDealsPage={true}
      crumbs={[
        { label: "Home", href: "/" },
        { label: "Deals" },
      ]}
    />
  );
}

export default function DealsPage({ searchParams }: PageProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://shopmate.com",
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Deals",
        "item": "https://shopmate.com/deals",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="min-h-[400px] animate-pulse rounded-lg bg-surface-muted" />}>
        <DealsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
