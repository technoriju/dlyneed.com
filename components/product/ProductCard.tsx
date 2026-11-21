"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { CartIcon, HeartIcon } from "@/components/layout/icons";
import { btnPrimary } from "@/components/ui/button";
import type { CardProduct } from "@/lib/catalog";
import { inr, offPct } from "@/lib/format";

export function ProductCard({ product: p }: { product: CardProduct }) {
  const href = `/product/${p.slug}`;
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const productId = p.id || p.slug;
  const isWishlisted = isInWishlist(productId);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async () => {
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);

    const variantId = p.defaultVariantId || p.id || p.slug;
    await addToCart(variantId, 1, {
      productId: p.id,
      slug: p.slug,
      name: p.name,
      image: p.image,
      pricePaise: p.pricePaise,
      mrpPaise: p.mrpPaise,
    });
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist(productId, p.name);
  };

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-surface shadow-card transition-shadow hover:shadow-[0_10px_28px_rgba(17,17,17,.07)]">
      <div className="relative aspect-square overflow-hidden bg-surface-muted">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="block size-full">
          <Image
            src={p.image}
            alt=""
            fill
            sizes="(max-width: 720px) 50vw, (max-width: 1200px) 20vw, 230px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </Link>
        <span className="absolute top-2.5 left-2.5 rounded-sm bg-brand-600 px-2 py-[5px] text-[11px] leading-none font-bold text-white">
          -{offPct(p.pricePaise, p.mrpPaise)}%
        </span>
        <button
          type="button"
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`}
          onClick={handleWishlistToggle}
          className={`absolute top-2.5 right-2.5 grid size-[34px] cursor-pointer place-items-center rounded-full bg-surface shadow-card transition-colors ${
            isWishlisted ? "text-[#c0392b]" : "text-ink-900 hover:text-brand-600"
          }`}
        >
          <HeartIcon size={16} filled={isWishlisted} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5 max-[480px]:p-2.5">
        <h3 className="text-[15px] leading-snug font-semibold">
          <Link href={href} className="text-inherit hover:text-brand-600">
            {p.name}
          </Link>
        </h3>
        <div className="flex items-center gap-1 text-[13px] text-ink-500">
          <span className="text-star" aria-hidden="true">
            ★
          </span>
          <b className="font-semibold text-ink-900">{p.ratingAvg}</b>
          <span aria-hidden="true">({p.ratingCount})</span>
          <span className="sr-only">{p.ratingCount} ratings</span>
        </div>
        <div className="mt-0.5 mb-2 flex flex-wrap items-baseline gap-2 tabular-nums">
          <b className="text-lg leading-none font-bold text-ink-900 max-[480px]:text-base">{inr(p.pricePaise)}</b>
          <s className="text-[13px] text-ink-400">
            <span className="sr-only">MRP </span>
            {inr(p.mrpPaise)}
          </s>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          className={`${btnPrimary} mt-auto h-[38px] w-full text-[13px] ${
            justAdded ? "!bg-ink-900 text-white" : ""
          }`}
        >
          {justAdded ? (
            <span>✓ Added</span>
          ) : (
            <>
              <CartIcon size={15} /> Add to Cart
            </>
          )}
        </button>
      </div>
    </article>
  );
}
