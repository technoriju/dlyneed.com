import Image from "next/image";
import Link from "next/link";
import { CategoryTile } from "@/components/home/CategoryTile";
import { FeatureStrip } from "@/components/home/FeatureStrip";
import { PromoBanner } from "@/components/home/PromoBanner";
import { Testimonial } from "@/components/home/Testimonial";
import { ProductCard } from "@/components/product/ProductCard";
import { btnPrimary, btnSecondary, linkArrow } from "@/components/ui/button";
import { getBestSellers, getCategories } from "@/lib/catalog";

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

const secHead = "mb-7 flex flex-wrap items-baseline justify-between gap-4";
const secTitle = "text-[clamp(22px,3vw,28px)] leading-tight font-semibold";
const arrow = <span aria-hidden="true">→</span>;

export default async function Home() {
  const [categories, bestSellers] = await Promise.all([getCategories(), getBestSellers()]);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-[72px]">
      <div>
        <section
          aria-labelledby="hero-h"
          className="grid grid-cols-[1.1fr_.9fr] items-center gap-8 rounded-lg bg-brand-100 px-14 pt-14 pb-24 max-[720px]:grid-cols-1 max-[720px]:px-6 max-[720px]:pt-8 max-[720px]:pb-[72px]"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-[7px] text-xs leading-none font-semibold tracking-[.4px] text-ink-900 uppercase before:size-1.5 before:rounded-full before:bg-brand-500">
              New Arrivals
            </span>
            <h1 id="hero-h" className="mt-[18px] mb-3.5 text-[clamp(34px,5vw,54px)] leading-[1.1] font-semibold tracking-[-.8px]">
              Discover The Best Products for You
            </h1>
            <p className="mb-7 max-w-[420px] text-[17px] leading-relaxed text-ink-500">
              Explore our wide range of high-quality products at affordable prices. Shop now and enjoy the best deals!
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/shop" className={btnPrimary}>
                Shop Now {arrow}
              </Link>
              <Link href="/deals" className={btnSecondary}>
                Explore Deals
              </Link>
            </div>
            <div className="mt-9 flex items-center gap-3 text-[13px] text-ink-500">
              <div className="flex" aria-hidden="true">
                {heroAvatars.map((a) => (
                  <span
                    key={a.initials}
                    className={`-ml-[9px] grid size-[34px] flex-none place-items-center rounded-full border-2 border-brand-100 text-xs leading-none font-semibold text-ink-900 first:ml-0 ${a.tint}`}
                  >
                    {a.initials}
                  </span>
                ))}
              </div>
              Trusted by 10,000+ Happy Customers
            </div>
          </div>
          <div className="relative aspect-square w-[min(100%,400px)] justify-self-center max-[720px]:w-[min(100%,320px)]">
            <div className="absolute right-[4%] bottom-[2%] left-[4%] h-[22%] rounded-[50%] bg-sand-100 shadow-[inset_0_-10px_0_#e8e2d0]" />
            <Image
              src="/images/products/backpack.jpg"
              alt="Navy travel backpack in soft daylight"
              width={640}
              height={640}
              sizes="(max-width: 720px) 256px, 320px"
              preload
              className="absolute top-0 left-[10%] h-[86%] w-[80%] rounded-lg object-cover"
            />
            <Link
              href="/product/travel-backpack"
              className="absolute top-[14%] left-0 rounded-md bg-surface px-3.5 py-2.5 text-xs text-ink-500 shadow-[0_8px_24px_rgba(17,17,17,.08)]"
            >
              Travel Backpack<b className="block text-[15px] text-ink-900">₹1,999</b>
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
        <div className="grid grid-cols-6 gap-4 max-[960px]:grid-cols-3 max-[960px]:gap-y-6">
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
        <div className="grid grid-cols-5 gap-[22px] max-[720px]:grid-cols-2 max-[720px]:gap-3.5">
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
        <div className="grid grid-cols-3 gap-6 max-[960px]:grid-cols-1">
          {reviews.map((r) => (
            <Testimonial key={r.name} {...r} />
          ))}
        </div>
      </section>
    </div>
  );
}
