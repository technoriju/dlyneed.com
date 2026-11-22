"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { BagIcon, LockIcon } from "@/components/layout/icons";
import { inr } from "@/lib/format";

export function CartView() {
  const {
    items,
    summary,
    isLoading,
    updateQty,
    removeFromCart,
    moveToWishlist,
    applyCoupon,
    removeCoupon,
    couponError,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplying(true);
    const res = await applyCoupon(couponInput.trim());
    setIsApplying(false);
    if (res.success) {
      setCouponInput("");
    }
  };

  const handleQuickCoupon = async (code: string) => {
    setCouponInput(code);
    setIsApplying(true);
    await applyCoupon(code);
    setIsApplying(false);
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-ink-500">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
        <p className="mt-3 text-sm">Loading your cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <div className="mb-7">
          <h1 className="text-[clamp(26px,3.2vw,34px)] font-semibold tracking-[-0.3px] text-ink-900">
            Your Cart
          </h1>
        </div>
        <div className="grid justify-items-center gap-3.5 rounded-lg border border-dashed border-border-strong bg-surface p-14 text-center">
          <div className="grid size-[72px] place-items-center rounded-full bg-brand-100 text-brand-600">
            <BagIcon size={32} />
          </div>
          <h2 className="text-xl font-semibold text-ink-900">Your cart is empty</h2>
          <p className="max-w-[40ch] text-ink-500">
            Looks like you haven&apos;t added anything yet. Browse our best sellers to get started.
          </p>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-sm bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Start shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[clamp(26px,3.2vw,34px)] font-semibold tracking-[-0.3px] text-ink-900">
            Your Cart
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {summary.totalQty} item{summary.totalQty === 1 ? "" : "s"}
          </p>
        </div>
        <Link href="/shop" className="text-sm font-semibold text-brand-600 hover:underline">
          ← Continue shopping
        </Link>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left: Cart Line Items */}
        <div className="overflow-hidden rounded-md border border-border bg-surface divide-y divide-border">
          {items.map((line) => {
            const hasOption = line.optionValue && line.optionValue !== "Standard";
            return (
              <div
                key={line.variantId}
                className="grid grid-cols-[80px_minmax(0,1fr)] sm:grid-cols-[96px_minmax(0,1fr)_auto] items-start gap-3.5 sm:gap-4 p-3.5 sm:p-4.5"
              >
                {/* Image */}
                <Link href={`/product/${line.slug}`} className="shrink-0">
                  <Image
                    src={line.image}
                    alt={line.name}
                    width={96}
                    height={96}
                    className="size-20 sm:size-24 rounded-md object-cover bg-surface-muted"
                  />
                </Link>

                {/* Details */}
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-[15px] font-semibold leading-snug">
                      <Link href={`/product/${line.slug}`} className="text-inherit hover:text-brand-600">
                        {line.name}
                      </Link>
                    </h3>
                    {/* Mobile Price */}
                    <div className="text-right sm:hidden tabular-nums shrink-0">
                      <b className="block text-base font-bold text-ink-900">
                        {inr(line.pricePaise * line.qty)}
                      </b>
                      <s className="text-xs text-ink-400">{inr(line.mrpPaise * line.qty)}</s>
                    </div>
                  </div>

                  <p className="mt-1 text-xs sm:text-[13px] text-ink-500">
                    {hasOption && `${line.optionName || "Option"}: ${line.optionValue} · `}In stock · Delivery in 3–5 days
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {/* Stepper */}
                    <div
                      className="inline-flex h-9 sm:h-[38px] items-center rounded-sm border border-border-strong bg-surface"
                      role="group"
                      aria-label={`Quantity for ${line.name}`}
                    >
                      <button
                        type="button"
                        onClick={() => updateQty(line.variantId, line.qty - 1)}
                        disabled={line.qty <= 1}
                        aria-label="Decrease quantity"
                        className="grid w-8 sm:w-[34px] place-items-center text-base font-bold text-ink-700 hover:text-ink-900 disabled:cursor-not-allowed disabled:text-ink-400 active:bg-surface-muted"
                      >
                        −
                      </button>
                      <output className="min-w-[28px] sm:min-w-[30px] text-center text-sm sm:text-[15px] font-semibold tabular-nums text-ink-900">
                        {line.qty}
                      </output>
                      <button
                        type="button"
                        onClick={() => updateQty(line.variantId, line.qty + 1)}
                        disabled={line.qty >= 10}
                        aria-label="Increase quantity"
                        className="grid w-8 sm:w-[34px] place-items-center text-base font-bold text-ink-700 hover:text-ink-900 disabled:cursor-not-allowed disabled:text-ink-400 active:bg-surface-muted"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => moveToWishlist(line.variantId, line.productId)}
                      className="inline-flex h-9 cursor-pointer items-center justify-center rounded-sm px-2 text-xs sm:text-[13px] font-semibold text-brand-600 hover:bg-brand-50 active:bg-brand-100"
                    >
                      Move to wishlist
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.variantId)}
                      className="inline-flex h-9 cursor-pointer items-center justify-center rounded-sm px-2 text-xs sm:text-[13px] font-semibold text-bad hover:bg-[#fbe9e7] active:bg-red-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Desktop Price */}
                <div className="hidden sm:block text-right tabular-nums">
                  <b className="block text-base font-bold text-ink-900">
                    {inr(line.pricePaise * line.qty)}
                  </b>
                  <s className="text-[13px] text-ink-400">{inr(line.mrpPaise * line.qty)}</s>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Order Summary */}
        <aside
          className="sticky top-[92px] grid gap-4 rounded-md border border-border bg-surface p-5.5 shadow-card"
          aria-label="Order summary"
        >
          <h2 className="text-lg font-semibold text-ink-900">Price details</h2>
          <div className="grid gap-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <span>Price ({summary.totalQty} item{summary.totalQty === 1 ? "" : "s"})</span>
              <span className="tabular-nums">{inr(summary.mrpTotalPaise)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Discount on MRP</span>
              <span className="tabular-nums font-medium text-ok">− {inr(summary.mrpDiscountPaise)}</span>
            </div>
            {summary.couponCode && (
              <div className="flex justify-between gap-3">
                <span>Coupon ({summary.couponCode})</span>
                <span className="tabular-nums font-medium text-ok">− {inr(summary.couponDiscountPaise)}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span>Delivery</span>
              <span className="tabular-nums font-medium">
                {summary.shippingPaise === 0 ? (
                  <span className="text-ok">Free</span>
                ) : (
                  inr(summary.shippingPaise)
                )}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-3 border-t border-border pt-3.5 text-[17px] font-bold text-ink-900">
              <span>Total</span>
              <span className="tabular-nums">{inr(summary.totalPaise)}</span>
            </div>
          </div>

          <p className="text-[13px] font-semibold text-ok">
            You save {inr(summary.totalSavingsPaise)} on this order
          </p>

          {/* Coupon Input or Applied state */}
          {summary.couponCode ? (
            <div className="flex items-center justify-between gap-2 rounded-sm bg-[#e6f2ea] p-2.5 px-3 text-[13px] font-semibold text-ok">
              <span>
                {summary.couponCode} applied
                {!summary.couponMeetsMin && (
                  <span className="text-warn"> · needs ₹{summary.couponMinOrderPaise / 100}+ order</span>
                )}
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                className="cursor-pointer font-semibold text-brand-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="grid gap-2">
              <form onSubmit={handleCouponSubmit} className="flex gap-2">
                <label className="sr-only" htmlFor="coupon">
                  Coupon code
                </label>
                <input
                  id="coupon"
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className="h-[42px] min-w-0 flex-1 rounded-sm border border-border-strong bg-surface px-3 text-sm uppercase text-ink-900 outline-none focus:border-brand-600"
                />
                <button
                  type="submit"
                  disabled={isApplying}
                  className="inline-flex h-[42px] cursor-pointer items-center justify-center rounded-sm border border-border-strong bg-surface px-3.5 text-[13px] font-semibold text-ink-900 transition-colors hover:border-brand-500 disabled:opacity-50"
                >
                  {isApplying ? "..." : "Apply"}
                </button>
              </form>
              <p className="text-xs text-ink-500">
                Try{" "}
                <button
                  type="button"
                  onClick={() => handleQuickCoupon("WELCOME10")}
                  className="cursor-pointer font-semibold text-brand-600 hover:underline"
                >
                  WELCOME10
                </button>{" "}
                or{" "}
                <button
                  type="button"
                  onClick={() => handleQuickCoupon("SAVE200")}
                  className="cursor-pointer font-semibold text-brand-600 hover:underline"
                >
                  SAVE200
                </button>
              </p>
              {couponError && (
                <p role="status" className="text-[13px] font-medium text-bad">
                  {couponError}
                </p>
              )}
            </div>
          )}

          {/* Free Shipping Meter */}
          {summary.freeShippingMissingPaise > 0 ? (
            <div className="text-[13px]">
              <b className="font-semibold text-ink-900">
                Add {inr(summary.freeShippingMissingPaise)} more for free delivery
              </b>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                <i
                  className="block h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${summary.freeShippingProgressPct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[13px] font-semibold text-ok">
              ✓ Free delivery unlocked on this order!
            </div>
          )}

          {/* Checkout CTA */}
          <Link
            href="/checkout"
            className="inline-flex h-[52px] w-full items-center justify-center rounded-sm bg-brand-600 px-7 text-base font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Proceed to Checkout
          </Link>

          {/* Security guarantee */}
          <div className="flex items-center justify-center gap-2 text-xs text-ink-500">
            <LockIcon size={16} /> Safe and secure payments by Razorpay
          </div>
        </aside>
      </div>

      {/* Mobile Sticky Checkout Bar (docked above mobile bottom nav) */}
      <div className="fixed inset-x-0 bottom-[calc(56px+env(safe-area-inset-bottom,0px))] z-30 border-t border-border bg-surface/95 p-3 px-4 backdrop-blur-md shadow-[0_-4px_16px_rgba(17,17,17,0.08)] flex items-center justify-between gap-4 lg:hidden">
        <div>
          <span className="text-xs text-ink-500">Total ({summary.totalQty} item{summary.totalQty === 1 ? "" : "s"})</span>
          <b className="block text-lg font-bold text-ink-900">{inr(summary.totalPaise)}</b>
        </div>
        <Link
          href="/checkout"
          className="inline-flex h-11 items-center justify-center rounded-sm bg-brand-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-700 active:scale-95"
        >
          Checkout →
        </Link>
      </div>
    </div>
  );
}
