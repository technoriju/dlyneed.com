import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopView } from "@/components/shop/ShopView";
import {
  getCategoriesWithCounts,
  getCategoryBySlug,
  getFilteredProducts,
} from "@/lib/catalog";
import { categoryNav } from "@/lib/nav";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function normalizeParam(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] || "";
  return val || "";
}

export async function generateStaticParams() {
  return categoryNav.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: `${category.name} | ShopMate`,
    description: `Shop the best ${category.name.toLowerCase()} products online at ShopMate with fast delivery and great prices.`,
    alternates: {
      canonical: `/category/${slug}`,
    },
  };
}

async function CategoryContent({
  category,
  searchParams,
}: {
  category: { id: string; slug: string; name: string };
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const q = normalizeParam(sp.q);
  const price = normalizeParam(sp.price) || "any";
  const ratingStr = normalizeParam(sp.rating);
  const rating = ratingStr ? Number(ratingStr) : 0;
  const sale = normalizeParam(sp.sale) === "true";
  const sort = normalizeParam(sp.sort) || "popular";

  const [categories, products] = await Promise.all([
    getCategoriesWithCounts(),
    getFilteredProducts({
      category: [category.slug],
      price,
      rating,
      sale,
      sort,
      q,
    }),
  ]);

  return (
    <ShopView
      title={category.name}
      totalCount={products.length}
      products={products}
      categories={categories}
      selectedCategories={[category.slug]}
      currentCategorySlug={category.slug}
      price={price}
      rating={rating}
      sale={sale}
      sort={sort}
      q={q}
      crumbs={[
        { label: "Home", href: "/" },
        { label: category.name },
      ]}
    />
  );
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
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
        "name": category.name,
        "item": `https://shopmate.com/category/${slug}`,
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
        <CategoryContent category={category} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
