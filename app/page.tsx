import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CategoryTile } from "@/components/home/CategoryTile";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { PromoBanner } from "@/components/home/PromoBanner";
import { Testimonial } from "@/components/home/Testimonial";
import { ProductCard } from "@/components/product/ProductCard";
import { btnPrimary, btnSecondary, linkArrow } from "@/components/ui/button";
import { getBestSellers, getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "ShopMate – Quality Products, Best Prices in India",
  description:
    "Explore ShopMate for electronics, fashion, home essentials, beauty, and sports. Enjoy fast shipping across India, secure Razorpay checkout, and unbeatable deals.",
  alternates: {
    canonical: "/",
  },
};

const reviews = [
  { text: "Amazing products and fast delivery! ShopMate is my go-to store for all my needs.", name: "John D.", initials: "JD", tint: "bg-cat-butter" },
  { text: "Great quality at affordable prices. The customer support is also very responsive.", name: "Sarah M.", initials: "SM", tint: "bg-cat-rose" },
  { text: "Very happy with my purchase. Highly recommend ShopMate to everyone!", name: "Michael T.", initials: "MT", tint: "bg-cat-blue" },
];

const heroAvatars = [
  { initials: "JD", tint: "bg-cat-butter" },
  { initials: "SM", tint: "bg-cat-rose" },
  { initials: "MT", tint: "bg-cat-blue" },
  { initials: "AK", tint: "bg-cat-mint" },
];

const secHead = "mb-5 sm:mb-7 flex flex-wrap items-baseline justify-between gap-3 sm:gap-4";
const secTitle = "text-[clamp(20px,3vw,28px)] leading-tight font-semibold";
const arrow = <span aria-hidden="true">→</span>;

export default async function Home() {
  const [categories, bestSellers] = await Promise.all([getCategories(), getBestSellers()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://shopmate.com/#organization",
        name: "ShopMate",
        url: "https://shopmate.com",
        logo: "https://shopmate.com/logo.svg",
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+91-1800-000-0000",
          contactType: "customer service",
          areaServed: "IN",
          availableLanguage: ["en", "hi"],
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://shopmate.com/#website",
        url: "https://shopmate.com",
        name: "ShopMate",
        publisher: {
          "@id": "https://shopmate.com/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://shopmate.com/shop?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 sm:gap-14 md:gap-[72px]">
      <div>
        <section
          aria-labelledby="hero-h"
          className="grid grid-cols-1 items-center gap-8 rounded-lg bg-brand-100 px-4 py-8 sm:px-8 sm:py-12 md:grid-cols-[1.1fr_.9fr] md:px-14 md:pt-14 md:pb-24"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-[7px] text-xs leading-none font-semibold tracking-[.4px] text-ink-900 uppercase before:size-1.5 before:rounded-full before:bg-brand-500">
              New Arrivals
            </span>
            <h1 id="hero-h" className="mt-[18px] mb-3.5 text-[clamp(28px,5vw,54px)] leading-[1.12] font-semibold tracking-[-.8px]">
              Discover The Best Products for You
            </h1>
            <p className="mb-6 sm:mb-7 max-w-[420px] text-sm sm:text-[17px] leading-relaxed text-ink-500">
              Explore our wide range of high-quality products at affordable prices. Shop now and enjoy the best deals!
            </p>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <Link href="/shop" className={`${btnPrimary} w-full sm:w-auto text-center justify-center`}>
                Shop Now {arrow}
              </Link>
              <Link href="/deals" className={`${btnSecondary} w-full sm:w-auto text-center justify-center`}>
                Explore Deals
              </Link>
            </div>
            <div className="mt-7 sm:mt-9 flex items-center gap-2.5 sm:gap-3 text-xs sm:text-[13px] text-ink-500">
              <div className="flex" aria-hidden="true">
                {heroAvatars.map((a) => (
                  <span
                    key={a.initials}
                    className={`-ml-[9px] grid size-[30px] sm:size-[34px] flex-none place-items-center rounded-full border-2 border-brand-100 text-[11px] sm:text-xs leading-none font-semibold text-ink-900 first:ml-0 ${a.tint}`}
                  >
                    {a.initials}
                  </span>
                ))}
              </div>
              Trusted by 10,000+ Happy Customers
            </div>
          </div>
          <div className="relative aspect-square w-[min(100%,280px)] sm:w-[min(100%,340px)] md:w-[min(100%,400px)] justify-self-center">
            <div className="absolute right-[4%] bottom-[2%] left-[4%] h-[22%] rounded-[50%] bg-sand-100 shadow-[inset_0_-10px_0_#e8e2d0]" />
            <Image
              src="/images/products/backpack.jpg"
              alt="Navy travel backpack in soft daylight"
              width={640}
              height={640}
              sizes="(max-width: 640px) 260px, (max-width: 1024px) 340px, 400px"
              priority
              className="absolute top-0 left-[10%] h-[86%] w-[80%] rounded-lg object-cover"
            />
            <Link
              href="/product/travel-backpack"
              className="absolute top-[14%] left-0 rounded-md bg-surface px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs text-ink-500 shadow-[0_8px_24px_rgba(17,17,17,.08)] transition-transform hover:scale-105"
            >
              Travel Backpack<b className="block text-sm sm:text-[15px] text-ink-900">₹1,999</b>
            </Link>
          </div>
        </section>
        <FeatureStrip />
      </div>

      <section aria-labelledby="cat-h">
        <div className={secHead}>
          <h2 id="cat-h" className={secTitle}>
            Shop by Categories
          </h2>
          <Link href="/shop" className={linkArrow}>
            View All Categories {arrow}
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4 md:grid-cols-6">
          {categories.map((c) => (
            <CategoryTile key={c.slug} {...c} />
          ))}
        </div>
      </section>

      <section aria-labelledby="best-h">
        <div className={secHead}>
          <h2 id="best-h" className={secTitle}>
            Best Selling Products
          </h2>
          <Link href="/shop" className={linkArrow}>
            View All Products {arrow}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5">
          {bestSellers.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <PromoBanner />

      <section aria-labelledby="rev-h">
        <div className={`${secHead} justify-center`}>
          <h2 id="rev-h" className={secTitle}>
            What Our Customers Say
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 sm:gap-6">
          {reviews.map((r) => (
            <Testimonial key={r.name} {...r} />
          ))}
        </div>
      </section>
    </div>
    </>
  );
}
