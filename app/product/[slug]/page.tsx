import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuySection } from "@/components/product/ProductBuySection";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductTabs } from "@/components/product/ProductTabs";
import {
  getAllProductSlugs,
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/catalog";
import { inr, offPct } from "@/lib/format";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const title = `${product.name} – ${inr(product.pricePaise)} | ShopMate`;
  const description = product.description;
  const image = product.images[0] || "/images/products/backpack.jpg";

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const related = await getRelatedProducts(product.slug, product.category.slug);
  const discount = offPct(product.pricePaise, product.mrpPaise);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: product.images[0],
        offers: {
          "@type": "Offer",
          price: (product.pricePaise / 100).toFixed(2),
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `https://shopmate.com/product/${product.slug}`,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.ratingAvg,
          reviewCount: product.ratingCount,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://shopmate.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: product.category.name,
            item: `https://shopmate.com/category/${product.category.slug}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.name,
            item: `https://shopmate.com/product/${product.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="grid gap-8 sm:gap-12 md:gap-[56px]">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs sm:text-[13px] text-ink-500">
          <Link href="/" className="hover:text-brand-600">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/category/${product.category.slug}`} className="hover:text-brand-600">
            {product.category.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" className="font-medium text-ink-900 truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* Main Product Section: Gallery & Info */}
        <section
          aria-labelledby="pdp-h"
          className="grid grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] items-start gap-8 md:gap-14"
        >
          {/* Gallery Column */}
          <ProductGallery
            images={product.images}
            name={product.name}
            discountPct={discount}
          />

          {/* Product Info & Buy Column */}
          <div className="grid gap-5">
            <div>
              <Link
                href={`/category/${product.category.slug}`}
                className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-[#e2ebd0]"
              >
                {product.category.name}
              </Link>
              <h1
                id="pdp-h"
                className="mt-2 text-[clamp(24px,3.2vw,32px)] font-semibold leading-tight text-ink-900"
              >
                {product.name}
              </h1>
            </div>

            {/* Ratings & Stock Row */}
            <div className="flex items-center gap-2 text-sm text-ink-500">
              <span className="text-star" aria-hidden="true">
                ★
              </span>
              <b className="font-bold text-ink-900">{product.ratingAvg}</b>
              <span>({product.ratingCount} ratings)</span>
              <span aria-hidden="true">·</span>
              <span className="text-xs font-semibold text-ok">In stock</span>
            </div>

            {/* Price Block */}
            <div>
              <div className="flex flex-wrap items-baseline gap-2.5">
                <b className="text-[32px] font-bold leading-none text-ink-900 max-[480px]:text-[28px]">
                  {inr(product.pricePaise)}
                </b>
                <s className="text-base text-ink-400">
                  <span className="sr-only">MRP </span>
                  {inr(product.mrpPaise)}
                </s>
                <span className="rounded-sm bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                  Save {inr(product.mrpPaise - product.pricePaise)} ({discount}%)
                </span>
              </div>
              <p className="mt-1.5 text-xs text-ink-400">Inclusive of all taxes</p>
            </div>

            {/* Lede summary */}
            <p className="text-[15px] leading-relaxed text-ink-700">
              {product.description}
            </p>

            {/* Options, Stepper, Actions & Pincode */}
            <ProductBuySection product={product} />
          </div>
        </section>

        {/* Product Information Tabs */}
        <ProductTabs
          description={product.description}
          highlights={product.highlights}
          specs={product.specs}
          ratingAvg={product.ratingAvg}
          ratingCount={product.ratingCount}
        />

        {/* Related Products Section */}
        {related.length > 0 && (
          <section aria-labelledby="rel-h" className="border-t border-border pt-10">
            <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
              <h2
                id="rel-h"
                className="text-[clamp(22px,3vw,28px)] font-semibold leading-tight text-ink-900"
              >
                You May Also Like
              </h2>
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
              >
                View All Products <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
              {related.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
