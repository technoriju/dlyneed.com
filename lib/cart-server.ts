import "server-only";
import { type CardProduct } from "@/lib/catalog-types";
import { db } from "@/lib/db";
import {
  calculateCartTotals,
  type CartPricedItem,
  type CartTotals,
  type CouponData,
  MAX_QTY_PER_LINE,
  MIN_QTY_PER_LINE,
} from "@/lib/pricing";

export async function getCouponByCode(code: string): Promise<CouponData | null> {
  const cleanCode = code.trim().toUpperCase();
  const coupon = await db.coupon.findUnique({
    where: { code: cleanCode },
  });
  if (!coupon) return null;

  return {
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    maxDiscountPaise: coupon.maxDiscountPaise,
    minOrderPaise: coupon.minOrderPaise,
    isActive: coupon.isActive,
    expiresAt: coupon.expiresAt,
  };
}

/**
 * Hydrates an array of variantId + qty into fully priced cart lines from the database.
 * Filters out inactive products or missing variants.
 */
export async function hydrateCartItems(
  items: Array<{ variantId: string; qty: number }>
): Promise<CartPricedItem[]> {
  if (!items || items.length === 0) return [];

  const variantIds = items.map((i) => i.variantId);
  const variants = await db.variant.findMany({
    where: {
      id: { in: variantIds },
      product: { isActive: true },
    },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          images: true,
          pricePaise: true,
          mrpPaise: true,
          optionName: true,
        },
      },
    },
  });

  const variantMap = new Map(variants.map((v) => [v.id, v]));
  const pricedLines: CartPricedItem[] = [];

  for (const item of items) {
    const v = variantMap.get(item.variantId);
    if (!v) continue;

    const images = (v.product.images as string[]) || [];
    const image = images[0] || "/images/products/placeholder.jpg";
    const qty = Math.max(MIN_QTY_PER_LINE, Math.min(MAX_QTY_PER_LINE, item.qty, v.stock));

    pricedLines.push({
      id: v.id,
      variantId: v.id,
      productId: v.product.id,
      slug: v.product.slug,
      name: v.product.name,
      image,
      optionName: v.product.optionName,
      optionValue: v.value,
      pricePaise: v.product.pricePaise,
      mrpPaise: v.product.mrpPaise,
      qty,
      stock: v.stock,
    });
  }

  return pricedLines;
}

/**
 * Loads user cart lines from the database, hydrates, and computes totals.
 */
export async function getUserCart(
  userId: string,
  couponCode?: string | null
): Promise<{ items: CartPricedItem[]; summary: CartTotals; coupon: CouponData | null }> {
  const cartRows = await db.cartItem.findMany({
    where: { userId },
    select: { variantId: true, qty: true },
  });

  const items = await hydrateCartItems(cartRows);
  const coupon = couponCode ? await getCouponByCode(couponCode) : null;
  const summary = calculateCartTotals(items, coupon);

  return { items, summary, coupon };
}

/**
 * Merges guest cart items into the user's database cart (spec §6).
 */
export async function mergeGuestCart(
  userId: string,
  guestItems: Array<{ variantId: string; qty: number }>
): Promise<void> {
  if (!guestItems || guestItems.length === 0) return;

  for (const item of guestItems) {
    const existing = await db.cartItem.findUnique({
      where: {
        userId_variantId: {
          userId,
          variantId: item.variantId,
        },
      },
    });

    if (existing) {
      const mergedQty = Math.min(MAX_QTY_PER_LINE, existing.qty + item.qty);
      await db.cartItem.update({
        where: { id: existing.id },
        data: { qty: mergedQty },
      });
    } else {
      // Ensure variant exists before inserting
      const variant = await db.variant.findUnique({
        where: { id: item.variantId },
      });
      if (variant) {
        const qty = Math.max(MIN_QTY_PER_LINE, Math.min(MAX_QTY_PER_LINE, item.qty));
        await db.cartItem.create({
          data: {
            userId,
            variantId: item.variantId,
            qty,
          },
        });
      }
    }
  }
}

/**
 * Loads user's wishlist from DB and maps to CardProduct format.
 */
export async function getUserWishlist(userId: string): Promise<CardProduct[]> {
  const rows = await db.wishlistItem.findMany({
    where: { userId, product: { isActive: true } },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          images: true,
          pricePaise: true,
          mrpPaise: true,
          ratingAvg: true,
          ratingCount: true,
          variants: {
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  return rows.map((r) => {
    const images = (r.product.images as string[]) || [];
    return {
      id: r.product.id,
      slug: r.product.slug,
      name: r.product.name,
      image: images[0] || "",
      pricePaise: r.product.pricePaise,
      mrpPaise: r.product.mrpPaise,
      ratingAvg: r.product.ratingAvg,
      ratingCount: r.product.ratingCount,
      defaultVariantId: r.product.variants[0]?.id,
    };
  });
}

/**
 * Merges guest wishlist product IDs into the user's database wishlist.
 */
export async function mergeGuestWishlist(userId: string, productIds: string[]): Promise<void> {
  if (!productIds || productIds.length === 0) return;

  for (const productId of productIds) {
    try {
      await db.wishlistItem.upsert({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        update: {},
        create: {
          userId,
          productId,
        },
      });
    } catch {
      // Ignore if product does not exist
    }
  }
}
