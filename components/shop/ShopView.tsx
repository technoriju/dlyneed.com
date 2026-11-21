"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FilterIcon, InfoIcon } from "@/components/layout/icons";
import { ProductCard } from "@/components/product/ProductCard";
import { btnSecondarySm } from "@/components/ui/button";
import type { CardProduct, CategoryWithCount } from "@/lib/catalog-types";
import { EmptyState } from "./EmptyState";
import { FilterChips } from "./FilterChips";
import { FilterSidebar } from "./FilterSidebar";
import { SortSelect } from "./SortSelect";

type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  title: string;
  totalCount: number;
  products: CardProduct[];
  categories: CategoryWithCount[];
  selectedCategories: string[];
  price?: string;
  rating?: number;
  sale?: boolean;
  sort?: string;
  q?: string;
  isDealsPage?: boolean;
  currentCategorySlug?: string | null;
  crumbs: Crumb[];
};

export function ShopView({
  title,
  totalCount,
  products,
  categories,
  selectedCategories,
  price = "any",
  rating = 0,
  sale = false,
  sort = "popular",
  q = "",
  isDealsPage = false,
  currentCategorySlug = null,
  crumbs,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Close drawer on escape key
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const pushQuery = (newParams: URLSearchParams) => {
    startTransition(() => {
      const queryString = newParams.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(targetUrl, { scroll: false });
    });
  };

  const handleCategoryToggle = (slug: string) => {
    if (currentCategorySlug) {
      if (slug === currentCategorySlug) {
        // Toggle off current category returns to general shop
        router.push("/shop");
      } else {
        router.push(`/category/${slug}`);
      }
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    const nextCategories = selectedCategories.includes(slug)
      ? selectedCategories.filter((c) => c !== slug)
      : [...selectedCategories, slug];

    if (nextCategories.length > 0) {
      params.set("category", nextCategories.join(","));
    } else {
      params.delete("category");
    }
    pushQuery(params);
  };

  const handlePriceChange = (priceId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceId && priceId !== "any") {
      params.set("price", priceId);
    } else {
      params.delete("price");
    }
    pushQuery(params);
  };

  const handleRatingChange = (newRating: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newRating > 0) {
      params.set("rating", String(newRating));
    } else {
      params.delete("rating");
    }
    pushQuery(params);
  };

  const handleSaleChange = (newSale: boolean) => {
    if (isDealsPage) return;
    const params = new URLSearchParams(searchParams.toString());
    if (newSale) {
      params.set("sale", "true");
    } else {
      params.delete("sale");
    }
    pushQuery(params);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSort && newSort !== (isDealsPage ? "discount" : "popular")) {
      params.set("sort", newSort);
    } else {
      params.delete("sort");
    }
    pushQuery(params);
  };

  const handleRemoveChip = (key: string) => {
    if (key === "q") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      pushQuery(params);
    } else if (key.startsWith("cat:")) {
      const slug = key.replace("cat:", "");
      handleCategoryToggle(slug);
    } else if (key === "price") {
      handlePriceChange("any");
    } else if (key === "rating") {
      handleRatingChange(0);
    } else if (key === "sale") {
      handleSaleChange(false);
    }
  };

  const handleClearAll = () => {
    if (currentCategorySlug) {
      router.push(`/category/${currentCategorySlug}`);
    } else if (isDealsPage) {
      router.push("/deals");
    } else {
      router.push("/shop");
    }
    if (isDrawerOpen) setIsDrawerOpen(false);
  };

  return (
    <div>
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-[13px] text-ink-500">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">/</span>}
            {c.href ? (
              <Link href={c.href} className="text-ink-500 hover:text-brand-600">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink-900">
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>

      {/* Page Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,3.2vw,34px)] leading-tight font-semibold tracking-[-0.3px] text-ink-900">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-ink-500">
            {totalCount} {totalCount === 1 ? "product" : "products"}
          </p>
        </div>
        {isDealsPage && (
          <div className="flex max-w-[420px] items-start gap-2.5 rounded-md border border-border bg-brand-50 p-3 text-[13px] text-ink-700">
            <InfoIcon size={18} className="mt-0.5 flex-none text-brand-600" />
            <span>
              Extra ₹200 off orders over ₹1,999 with code{" "}
              <span className="rounded-sm border border-dashed border-brand-500 bg-surface px-2 py-0.5 font-mono text-xs font-semibold text-ink-900">
                SAVE200
              </span>
              .
            </span>
          </div>
        )}
      </div>

      {/* Main Two-Column Shop Layout */}
      <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-8 max-[720px]:grid-cols-1">
        {/* Desktop Filter Sidebar */}
        <aside className="sticky top-[92px] hidden max-[720px]:hidden md:block" aria-label="Filters">
          <FilterSidebar
            categories={categories}
            selectedCategories={selectedCategories}
            price={price}
            rating={rating}
            sale={sale}
            isDealsPage={isDealsPage}
            onCategoryToggle={handleCategoryToggle}
            onPriceChange={handlePriceChange}
            onRatingChange={handleRatingChange}
            onSaleChange={handleSaleChange}
            onClearAll={handleClearAll}
          />
        </aside>

        {/* Mobile Filter Drawer */}
        {isDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsDrawerOpen(false);
            }}
          >
            <div
              className="absolute inset-y-0 right-0 w-[min(88vw,340px)] overflow-y-auto bg-surface p-5 shadow-pop"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
            >
              <FilterSidebar
                categories={categories}
                selectedCategories={selectedCategories}
                price={price}
                rating={rating}
                sale={sale}
                isDealsPage={isDealsPage}
                isMobileDrawer={true}
                onCategoryToggle={handleCategoryToggle}
                onPriceChange={handlePriceChange}
                onRatingChange={handleRatingChange}
                onSaleChange={handleSaleChange}
                onClearAll={handleClearAll}
                onClose={() => setIsDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Products and Toolbar Column */}
        <div className="min-w-0">
          {/* Toolbar */}
          <div className="mb-4.5 flex flex-wrap items-center justify-between gap-3">
            <FilterChips
              q={q}
              selectedCategories={selectedCategories}
              categories={categories}
              price={price}
              rating={rating}
              sale={sale}
              isDealsPage={isDealsPage}
              onRemove={handleRemoveChip}
            />

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className={`${btnSecondarySm} md:hidden`}
              >
                <FilterIcon size={14} />
                Filters
              </button>

              <SortSelect value={sort} onChange={handleSortChange} />
            </div>
          </div>

          {/* Product Grid or Empty State */}
          {products.length > 0 ? (
            <div
              className={`grid grid-cols-4 gap-5 transition-opacity max-[1024px]:grid-cols-3 max-[720px]:grid-cols-2 max-[400px]:grid-cols-1 ${
                isPending ? "opacity-60" : ""
              }`}
            >
              {products.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <EmptyState onClear={handleClearAll} />
          )}
        </div>
      </div>
    </div>
  );
}
