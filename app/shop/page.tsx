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

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const q = normalizeParam(sp.q);
  const selectedCategories = parseCategories(sp.category);
  const categories = await getCategoriesWithCounts();
  const catMap = new Map(categories.map((c) => [c.slug, c.name]));

  let title = "All Products";
  if (q) {
    title = `Results for “${q}”`;
  } else if (selectedCategories.length === 1) {
    title = catMap.get(selectedCategories[0]) || "All Products";
  }

  // Spec §8: filter combinations on /shop get noindex, follow except single-category views
  const hasExtraFilters =
    Boolean(sp.price) ||
    Boolean(sp.rating) ||
    Boolean(sp.sale) ||
    Boolean(sp.sort) ||
    Boolean(q) ||
    selectedCategories.length > 1;

  return {
    title: `${title} | ShopMate`,
    description: `Browse our curated collection of ${title.toLowerCase()} at ShopMate.`,
    alternates: {
      canonical: "/shop",
    },
    robots: hasExtraFilters ? { index: false, follow: true } : { index: true, follow: true },
  };
}

async function ShopContent({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = normalizeParam(sp.q);
  const price = normalizeParam(sp.price) || "any";
  const ratingStr = normalizeParam(sp.rating);
  const rating = ratingStr ? Number(ratingStr) : 0;
  const sale = normalizeParam(sp.sale) === "true";
  const sort = normalizeParam(sp.sort) || "popular";
  const selectedCategories = parseCategories(sp.category);

  const [categories, products] = await Promise.all([
    getCategoriesWithCounts(),
    getFilteredProducts({
      category: selectedCategories,
      price,
      rating,
      sale,
      sort,
      q,
    }),
  ]);

  const catMap = new Map(categories.map((c) => [c.slug, c.name]));
  let title = "All Products";
  if (q) {
    title = `Results for “${q}”`;
  } else if (selectedCategories.length === 1) {
    title = catMap.get(selectedCategories[0]) || "All Products";
  }

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
        "name": title,
        "item": "https://shopmate.com/shop",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ShopView
        title={title}
        totalCount={products.length}
        products={products}
        categories={categories}
        selectedCategories={selectedCategories}
        price={price}
        rating={rating}
        sale={sale}
        sort={sort}
        q={q}
        crumbs={[
          { label: "Home", href: "/" },
          { label: title },
        ]}
      />
    </>
  );
}

export default function ShopPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-[400px] animate-pulse rounded-lg bg-surface-muted" />}>
      <ShopContent searchParams={searchParams} />
    </Suspense>
  );
}
