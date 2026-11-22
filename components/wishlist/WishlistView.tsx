"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { BagIcon } from "@/components/layout/icons";
import { ProductCard } from "@/components/product/ProductCard";
import { btnPrimary, btnSecondary } from "@/components/ui/button";

export function WishlistView() {
  const { wishlistProducts, wishlistCount, isLoading, moveAllWishlistToCart } = useCart();

  if (isLoading) {
    return (
      <div className="py-12 text-center text-ink-500">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
        <p className="mt-3 text-sm">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,3.2vw,34px)] font-semibold tracking-[-0.3px] text-ink-900">
            My Wishlist
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {wishlistCount} saved item{wishlistCount === 1 ? "" : "s"}
          </p>
        </div>
        {wishlistCount > 0 && (
          <button
            type="button"
            onClick={moveAllWishlistToCart}
            className={`${btnSecondary} cursor-pointer`}
          >
            Move all to cart
          </button>
        )}
      </div>

      {/* Grid or Empty State */}
      {wishlistCount > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-5">
          {wishlistProducts.map((p) => (
            <ProductCard key={p.id || p.slug} product={p} />
          ))}
        </div>
      ) : (
        <div className="grid justify-items-center gap-3.5 rounded-lg border border-dashed border-border-strong bg-surface p-14 text-center">
          <div className="grid size-[72px] place-items-center rounded-full bg-brand-100 text-brand-600">
            <BagIcon size={32} />
          </div>
          <h2 className="text-xl font-semibold text-ink-900">Your wishlist is empty</h2>
          <p className="max-w-[40ch] text-ink-500">
            Tap the heart on any product to save it here for later.
          </p>
          <Link href="/shop" className={btnPrimary}>
            Browse products
          </Link>
        </div>
      )}
    </div>
  );
}
