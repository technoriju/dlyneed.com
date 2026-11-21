"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { type CardProduct } from "@/lib/catalog-types";
import {
  calculateCartTotals,
  type CartPricedItem,
  type CartTotals,
  type CouponData,
} from "@/lib/pricing";
import { useToast } from "@/components/ui/Toast";

const CART_STORAGE_KEY = "shopmate_cart_v1";
const WISHLIST_STORAGE_KEY = "shopmate_wishlist_v1";
const COUPON_STORAGE_KEY = "shopmate_coupon_v1";

const initialTotals: CartTotals = {
  itemCount: 0,
  totalQty: 0,
  mrpTotalPaise: 0,
  subtotalPaise: 0,
  mrpDiscountPaise: 0,
  couponCode: null,
  couponDiscountPaise: 0,
  couponMeetsMin: true,
  couponMinOrderPaise: 0,
  shippingPaise: 0,
  freeShippingMissingPaise: 999_00,
  freeShippingProgressPct: 0,
  totalPaise: 0,
  totalSavingsPaise: 0,
};

interface CartContextType {
  items: CartPricedItem[];
  summary: CartTotals;
  couponCode: string | null;
  couponError: string | null;
  wishlistIds: string[];
  wishlistProducts: CardProduct[];
  isLoading: boolean;
  cartCount: number;
  wishlistCount: number;
  cartBump: boolean;
  wishBump: boolean;
  isLoggedIn: boolean;
  addToCart: (variantId: string, qty?: number, fallbackInfo?: Partial<CartPricedItem>) => Promise<void>;
  updateQty: (variantId: string, qty: number) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
  moveToWishlist: (variantId: string, productId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => Promise<void>;
  toggleWishlist: (productId: string, productName?: string) => Promise<boolean>;
  moveAllWishlistToCart: () => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [items, setItems] = useState<CartPricedItem[]>([]);
  const [summary, setSummary] = useState<CartTotals>(initialTotals);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<CardProduct[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [cartBump, setCartBump] = useState(false);
  const [wishBump, setWishBump] = useState(false);

  const prevCartCount = useRef(0);
  const prevWishCount = useRef(0);

  // Trigger bounce animations on count increments
  const triggerCartBump = useCallback(() => {
    setCartBump(true);
    setTimeout(() => setCartBump(false), 350);
  }, []);

  const triggerWishBump = useCallback(() => {
    setWishBump(true);
    setTimeout(() => setCartBump(false), 350);
  }, []);

  // Recalculate summary whenever items or coupon change
  const refreshTotals = useCallback((cartLines: CartPricedItem[], coupon: CouponData | null) => {
    const updated = calculateCartTotals(cartLines, coupon);
    setSummary(updated);
  }, []);

  // Save guest cart to localStorage
  const persistGuestCart = useCallback((lines: CartPricedItem[], coupon: string | null) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(lines.map((l) => ({ variantId: l.variantId, qty: l.qty })))
      );
      if (coupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, coupon);
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch {
      // LocalStorage errors ignored
    }
  }, []);

  // Save guest wishlist to localStorage
  const persistGuestWishlist = useCallback((ids: string[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // LocalStorage errors ignored
    }
  }, []);

  // Initial load & synchronization
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setIsLoading(true);
      let localGuestCart: Array<{ variantId: string; qty: number }> = [];
      let localGuestWishlist: string[] = [];
      let localCoupon: string | null = null;

      try {
        const storedCart = localStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) localGuestCart = JSON.parse(storedCart);
        const storedWish = localStorage.getItem(WISHLIST_STORAGE_KEY);
        if (storedWish) localGuestWishlist = JSON.parse(storedWish);
        localCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      } catch {
        // Ignore parse errors
      }

      try {
        // Query /api/cart with local coupon and items
        const cartUrl = new URL("/api/cart", window.location.origin);
        if (localCoupon) cartUrl.searchParams.set("coupon", localCoupon);
        if (localGuestCart.length > 0) {
          cartUrl.searchParams.set("items", JSON.stringify(localGuestCart));
        }

        const cartRes = await fetch(cartUrl.toString());
        if (!cartRes.ok) throw new Error("Failed to load cart");
        const cartData = await cartRes.json();

        if (!isMounted) return;

        if (cartData.user) {
          setIsLoggedIn(true);
          // If guest had local items, merge them into the user's DB account
          if (localGuestCart.length > 0) {
            await fetch("/api/cart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "merge", items: localGuestCart }),
            });
            localStorage.removeItem(CART_STORAGE_KEY);
          }

          if (localGuestWishlist.length > 0) {
            await fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "merge", productIds: localGuestWishlist }),
            });
            localStorage.removeItem(WISHLIST_STORAGE_KEY);
          }

          // Fetch fresh server cart and wishlist
          const [userCartRes, userWishRes] = await Promise.all([
            fetch(`/api/cart${localCoupon ? `?coupon=${localCoupon}` : ""}`),
            fetch("/api/wishlist"),
          ]);
          const freshCart = await userCartRes.json();
          const freshWish = await userWishRes.json();

          setItems(freshCart.items || []);
          setSummary(freshCart.summary || initialTotals);
          setCouponCode(freshCart.couponCode || null);
          setWishlistIds(freshWish.productIds || []);
          setWishlistProducts(freshWish.items || []);
        } else {
          // Guest mode
          setIsLoggedIn(false);
          setItems(cartData.items || []);
          setSummary(cartData.summary || initialTotals);
          setCouponCode(cartData.couponCode || null);

          // Fetch guest wishlist products
          setWishlistIds(localGuestWishlist);
          if (localGuestWishlist.length > 0) {
            const wishRes = await fetch(`/api/wishlist?ids=${localGuestWishlist.join(",")}`);
            if (wishRes.ok) {
              const wishData = await wishRes.json();
              setWishlistProducts(wishData.items || []);
            }
          }
        }
      } catch (err) {
        console.error("Cart initialization error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  // Add to Cart
  const addToCart = useCallback(
    async (variantId: string, qty: number = 1, fallbackInfo?: Partial<CartPricedItem>) => {
      const targetQty = Math.max(1, Math.min(10, qty));

      // Optimistic update
      setItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.variantId === variantId);
        let updated: CartPricedItem[];
        if (existingIdx >= 0) {
          updated = [...prev];
          const newQty = Math.min(10, updated[existingIdx].qty + targetQty);
          updated[existingIdx] = { ...updated[existingIdx], qty: newQty };
        } else {
          const newItem: CartPricedItem = {
            id: variantId,
            variantId,
            productId: fallbackInfo?.productId || "",
            slug: fallbackInfo?.slug || "",
            name: fallbackInfo?.name || "Product",
            image: fallbackInfo?.image || "/images/products/placeholder.jpg",
            optionName: fallbackInfo?.optionName || null,
            optionValue: fallbackInfo?.optionValue || "Standard",
            pricePaise: fallbackInfo?.pricePaise || 0,
            mrpPaise: fallbackInfo?.mrpPaise || 0,
            qty: targetQty,
            stock: fallbackInfo?.stock || 50,
          };
          updated = [...prev, newItem];
        }
        refreshTotals(updated, couponData);
        if (!isLoggedIn) persistGuestCart(updated, couponCode);
        return updated;
      });

      triggerCartBump();
      const productName = fallbackInfo?.name || "Product";
      showToast(`Added ${productName} to cart`);

      // Server sync
      try {
        const res = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, qty: targetQty }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items) {
            setItems(data.items);
            setSummary(data.summary);
          } else if (data.item) {
            // Guest single item hydrated
            setItems((prev) => {
              const idx = prev.findIndex((i) => i.variantId === variantId);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], ...data.item };
                refreshTotals(updated, couponData);
                persistGuestCart(updated, couponCode);
                return updated;
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.error("Error syncing add to cart:", e);
      }
    },
    [couponData, couponCode, isLoggedIn, refreshTotals, persistGuestCart, showToast, triggerCartBump]
  );

  // Update line quantity
  const updateQty = useCallback(
    async (variantId: string, qty: number) => {
      const sanitized = Math.max(0, Math.min(10, qty));

      setItems((prev) => {
        let updated: CartPricedItem[];
        if (sanitized <= 0) {
          updated = prev.filter((i) => i.variantId !== variantId);
        } else {
          updated = prev.map((i) => (i.variantId === variantId ? { ...i, qty: sanitized } : i));
        }
        refreshTotals(updated, couponData);
        if (!isLoggedIn) persistGuestCart(updated, couponCode);
        return updated;
      });

      try {
        const res = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId, qty: sanitized }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items) {
            setItems(data.items);
            setSummary(data.summary);
          }
        }
      } catch (e) {
        console.error("Error updating quantity:", e);
      }
    },
    [couponData, couponCode, isLoggedIn, refreshTotals, persistGuestCart]
  );

  // Remove item from cart
  const removeFromCart = useCallback(
    async (variantId: string) => {
      setItems((prev) => {
        const updated = prev.filter((i) => i.variantId !== variantId);
        refreshTotals(updated, couponData);
        if (!isLoggedIn) persistGuestCart(updated, couponCode);
        return updated;
      });

      showToast("Removed from cart");

      try {
        const res = await fetch(`/api/cart?variantId=${encodeURIComponent(variantId)}`, {
          method: "DELETE",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.items) {
            setItems(data.items);
            setSummary(data.summary);
          }
        }
      } catch (e) {
        console.error("Error deleting cart item:", e);
      }
    },
    [couponData, couponCode, isLoggedIn, refreshTotals, persistGuestCart, showToast]
  );

  // Move line to wishlist
  const moveToWishlist = useCallback(
    async (variantId: string, productId: string) => {
      await removeFromCart(variantId);
      setWishlistIds((prev) => {
        if (!prev.includes(productId)) {
          const next = [...prev, productId];
          if (!isLoggedIn) persistGuestWishlist(next);
          return next;
        }
        return prev;
      });

      triggerWishBump();
      showToast("Moved to wishlist");

      try {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        const wishRes = await fetch(
          isLoggedIn ? "/api/wishlist" : `/api/wishlist?ids=${productId}`
        );
        if (wishRes.ok) {
          const wishData = await wishRes.json();
          setWishlistProducts((prev) => {
            const combined = [...prev, ...wishData.items];
            return combined.filter(
              (p, idx, arr) => arr.findIndex((x) => x.id === p.id) === idx
            );
          });
        }
      } catch (e) {
        console.error("Error moving to wishlist:", e);
      }
    },
    [removeFromCart, isLoggedIn, persistGuestWishlist, showToast, triggerWishBump]
  );

  // Apply Coupon
  const applyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      setCouponError(null);
      const clean = code.trim().toUpperCase();
      if (!clean) {
        setCouponError("Please enter a coupon code");
        return { success: false, error: "Please enter a coupon code" };
      }

      try {
        const res = await fetch("/api/cart/coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: clean,
            subtotalPaise: summary.subtotalPaise,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          const errorMsg = data.error || "Invalid coupon code";
          setCouponError(errorMsg);
          return { success: false, error: errorMsg };
        }

        setCouponCode(data.coupon.code);
        setCouponData(data.coupon);
        refreshTotals(items, data.coupon);
        if (!isLoggedIn) persistGuestCart(items, data.coupon.code);

        showToast(`Coupon ${data.coupon.code} applied`);
        return { success: true };
      } catch {
        const errorMsg = "Failed to validate coupon";
        setCouponError(errorMsg);
        return { success: false, error: errorMsg };
      }
    },
    [summary.subtotalPaise, items, isLoggedIn, refreshTotals, persistGuestCart, showToast]
  );

  // Remove Coupon
  const removeCoupon = useCallback(async () => {
    setCouponCode(null);
    setCouponData(null);
    setCouponError(null);
    refreshTotals(items, null);
    if (!isLoggedIn) persistGuestCart(items, null);

    try {
      await fetch("/api/cart/coupon", { method: "DELETE" });
      showToast("Coupon removed");
    } catch {
      // Ignore
    }
  }, [items, isLoggedIn, refreshTotals, persistGuestCart, showToast]);

  // Toggle Wishlist item
  const toggleWishlist = useCallback(
    async (productId: string, productName?: string): Promise<boolean> => {
      const isCurrentlyWishlisted = wishlistIds.includes(productId);

      if (isCurrentlyWishlisted) {
        setWishlistIds((prev) => {
          const next = prev.filter((id) => id !== productId);
          if (!isLoggedIn) persistGuestWishlist(next);
          return next;
        });
        setWishlistProducts((prev) => prev.filter((p) => p.id !== productId));
        showToast("Removed from wishlist");

        try {
          await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
            method: "DELETE",
          });
        } catch (e) {
          console.error("Error removing wishlist:", e);
        }
        return false;
      } else {
        setWishlistIds((prev) => {
          const next = [...prev, productId];
          if (!isLoggedIn) persistGuestWishlist(next);
          return next;
        });
        triggerWishBump();
        showToast(productName ? `Added ${productName} to wishlist` : "Added to wishlist");

        try {
          const res = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.items) {
              setWishlistProducts(data.items);
            }
          }
        } catch (e) {
          console.error("Error adding wishlist:", e);
        }
        return true;
      }
    },
    [wishlistIds, isLoggedIn, persistGuestWishlist, showToast, triggerWishBump]
  );

  // Move All Wishlist to Cart
  const moveAllWishlistToCart = useCallback(async () => {
    if (wishlistProducts.length === 0) return;

    for (const p of wishlistProducts) {
      if (p.defaultVariantId) {
        await addToCart(p.defaultVariantId, 1, {
          productId: p.id,
          slug: p.slug,
          name: p.name,
          image: p.image,
          pricePaise: p.pricePaise,
          mrpPaise: p.mrpPaise,
        });
      }
    }

    setWishlistIds([]);
    setWishlistProducts([]);
    if (!isLoggedIn) persistGuestWishlist([]);

    try {
      if (isLoggedIn) {
        for (const p of wishlistProducts) {
          if (p.id) {
            await fetch(`/api/wishlist?productId=${encodeURIComponent(p.id)}`, {
              method: "DELETE",
            });
          }
        }
      }
    } catch {
      // Ignore
    }

    showToast("Moved all items to cart");
  }, [wishlistProducts, addToCart, isLoggedIn, persistGuestWishlist, showToast]);

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds]
  );

  const cartCount = summary.totalQty;
  const wishlistCount = wishlistIds.length;

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        couponCode,
        couponError,
        wishlistIds,
        wishlistProducts,
        isLoading,
        cartCount,
        wishlistCount,
        cartBump,
        wishBump,
        isLoggedIn,
        addToCart,
        updateQty,
        removeFromCart,
        moveToWishlist,
        applyCoupon,
        removeCoupon,
        toggleWishlist,
        moveAllWishlistToCart,
        isInWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
