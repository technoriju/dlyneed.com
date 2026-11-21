"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { CartIcon, HeartIcon, PinIcon, ReturnIcon, TruckIcon } from "@/components/layout/icons";
import { btnPrimary, btnSecondary, btnSecondarySm } from "@/components/ui/button";
import type { ProductDetail } from "@/lib/catalog-types";
import { inr } from "@/lib/format";

type Props = {
  product: ProductDetail;
};

function getEstimatedDeliveryDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function ProductBuySection({ product }: Props) {
  const router = useRouter();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const isWishlisted = isInWishlist(product.id);

  const initialOption = product.variants.length > 0 ? product.variants[0].value : "";
  const [selectedOption, setSelectedOption] = useState<string>(initialOption);
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Pincode checker state
  const [pincode, setPincode] = useState("");
  const [pinResult, setPinResult] = useState<{ checked: boolean; valid: boolean; message: string } | null>(null);

  const selectedVariant =
    product.variants.find((v) => v.value === selectedOption) || product.variants[0];

  const handleQtyChange = (delta: number) => {
    setQty((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);

    await addToCart(selectedVariant.id, qty, {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] || "",
      optionName: product.optionName,
      optionValue: selectedVariant.value,
      pricePaise: product.pricePaise,
      mrpPaise: product.mrpPaise,
    });
  };

  const handleBuyNow = async () => {
    if (!selectedVariant) return;
    await addToCart(selectedVariant.id, qty, {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0] || "",
      optionName: product.optionName,
      optionValue: selectedVariant.value,
      pricePaise: product.pricePaise,
      mrpPaise: product.mrpPaise,
    });
    router.push("/checkout");
  };

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.trim();
    if (/^[1-9]\d{5}$/.test(cleanPin)) {
      const deliveryDate = getEstimatedDeliveryDate();
      setPinResult({
        checked: true,
        valid: true,
        message: `Delivers to ${cleanPin} by ${deliveryDate} · COD available`,
      });
    } else {
      setPinResult({
        checked: true,
        valid: false,
        message: "Enter a valid 6-digit pincode.",
      });
    }
  };

  const isFreeDelivery = product.pricePaise >= 999_00;

  return (
    <div className="grid gap-6">
      {/* Option Chips (e.g. Size, Colour, Strap) */}
      {product.optionName && product.variants.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-ink-900">
            {product.optionName}:{" "}
            <span id="optVal" className="font-bold text-ink-900">
              {selectedOption}
            </span>
          </h2>
          <div
            className="mt-2.5 flex flex-wrap gap-2"
            role="radiogroup"
            aria-label={product.optionName}
          >
            {product.variants.map((v) => {
              const isSelected = selectedOption === v.value;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedOption(v.value)}
                  className={`h-10 cursor-pointer rounded-sm px-4 text-sm font-semibold transition-colors ${
                    isSelected
                      ? "border-2 border-brand-600 bg-brand-50 text-brand-700 shadow-xs"
                      : "border border-border-strong bg-surface text-ink-700 hover:border-brand-500 hover:text-ink-900"
                  }`}
                >
                  {v.value}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Buy Actions & Quantity Stepper */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Quantity Stepper */}
        <div
          className="inline-flex h-11 items-center rounded-sm border border-border-strong bg-surface"
          role="group"
          aria-label="Quantity"
        >
          <button
            type="button"
            onClick={() => handleQtyChange(-1)}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="grid size-11 place-items-center text-base font-bold text-ink-700 transition-colors hover:text-ink-900 disabled:cursor-not-allowed disabled:text-ink-400"
          >
            −
          </button>
          <output aria-live="polite" className="w-9 text-center text-sm font-bold text-ink-900">
            {qty}
          </output>
          <button
            type="button"
            onClick={() => handleQtyChange(1)}
            disabled={qty >= 10}
            aria-label="Increase quantity"
            className="grid size-11 place-items-center text-base font-bold text-ink-700 transition-colors hover:text-ink-900 disabled:cursor-not-allowed disabled:text-ink-400"
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          type="button"
          onClick={handleAddToCart}
          className={`${btnSecondary} ${
            isAdded ? "!border-ok !bg-ok/10 !text-ok" : ""
          } flex-1 min-w-[140px]`}
        >
          {isAdded ? (
            <span className="font-bold">✓ Added</span>
          ) : (
            <>
              <CartIcon size={16} /> Add to Cart
            </>
          )}
        </button>

        {/* Buy Now Button */}
        <button
          type="button"
          onClick={handleBuyNow}
          className={`${btnPrimary} flex-1 min-w-[130px]`}
        >
          Buy Now
        </button>

        {/* Wishlist Button */}
        <button
          type="button"
          aria-pressed={isWishlisted}
          aria-label={isWishlisted ? "Remove from wishlist" : "Save to wishlist"}
          onClick={() => toggleWishlist(product.id, product.name)}
          className={`grid size-11 cursor-pointer place-items-center rounded-sm border transition-colors ${
            isWishlisted
              ? "border-[#c0392b] bg-red-50 text-[#c0392b]"
              : "border-border-strong bg-surface text-ink-700 hover:border-brand-500 hover:text-ink-900"
          }`}
        >
          <HeartIcon size={18} filled={isWishlisted} />
        </button>
      </div>

      {/* Delivery & Assurance Details Box */}
      <div className="grid divide-y divide-border rounded-md border border-border text-sm">
        {/* Pincode Check */}
        <div className="p-3.5 sm:p-4">
          <div className="flex items-start gap-3">
            <PinIcon size={18} className="mt-0.5 flex-none text-brand-600" />
            <div className="min-w-0 flex-1">
              <b className="block font-semibold text-ink-900">Check delivery</b>
              <form onSubmit={handlePincodeSubmit} className="mt-2 flex max-w-[300px] gap-2">
                <label className="sr-only" htmlFor="pincode">
                  Pincode
                </label>
                <input
                  id="pincode"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit pincode"
                  className="h-9 min-w-0 flex-1 rounded-sm border border-border-strong bg-surface px-3 text-sm text-ink-900 outline-none focus:border-brand-600"
                />
                <button type="submit" className={btnSecondarySm}>
                  Check
                </button>
              </form>
              {pinResult && (
                <p
                  role="status"
                  className={`mt-2 text-xs ${pinResult.valid ? "text-ok font-semibold" : "text-bad"}`}
                >
                  {pinResult.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Free Delivery Condition */}
        <div className="p-3.5 sm:p-4">
          <div className="flex items-start gap-3">
            <TruckIcon size={18} className="mt-0.5 flex-none text-brand-600" />
            <div>
              <b className="block font-semibold text-ink-900">
                {isFreeDelivery ? "Free delivery" : "Free delivery on orders over ₹999"}
              </b>
              <span className="text-xs text-ink-500">
                Standard 3–5 days · Express 1–2 days in metro cities ({inr(149_00)})
              </span>
            </div>
          </div>
        </div>

        {/* Returns & COD */}
        <div className="p-3.5 sm:p-4">
          <div className="flex items-start gap-3">
            <ReturnIcon size={18} className="mt-0.5 flex-none text-brand-600" />
            <div>
              <b className="block font-semibold text-ink-900">Free 30-day returns</b>
              <span className="text-xs text-ink-500">
                Cash on delivery available (+{inr(49_00)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
