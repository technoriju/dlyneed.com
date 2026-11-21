// Business rules and pricing calculations (spec §5, §6 and prototype).
// All money is handled in paise (integers). Never trust the browser totals.

export const FREE_SHIPPING_THRESHOLD_PAISE = 999_00; // ₹999
export const STANDARD_SHIPPING_FEE_PAISE = 79_00; // ₹79
export const EXPRESS_SHIPPING_FEE_PAISE = 149_00; // ₹149
export const COD_FEE_PAISE = 49_00; // ₹49
export const MAX_QTY_PER_LINE = 10;
export const MIN_QTY_PER_LINE = 1;

export interface CouponData {
  code: string;
  type: string; // "percent" | "flat"
  value: number; // percent (10 = 10%) or paise (flat discount)
  maxDiscountPaise: number | null;
  minOrderPaise: number;
  isActive: boolean;
  expiresAt: Date | null;
}

export interface CouponDiscountResult {
  code: string;
  discountPaise: number;
  isValid: boolean;
  meetsMinOrder: boolean;
  minOrderPaise: number;
  message?: string;
}

export interface CartPricedItem {
  id: string; // CartItem ID or variantId
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  optionName: string | null;
  optionValue: string;
  pricePaise: number;
  mrpPaise: number;
  qty: number;
  stock: number;
}

export interface CartTotals {
  itemCount: number;
  totalQty: number;
  mrpTotalPaise: number;
  subtotalPaise: number;
  mrpDiscountPaise: number;
  couponCode: string | null;
  couponDiscountPaise: number;
  couponMeetsMin: boolean;
  couponMinOrderPaise: number;
  shippingPaise: number;
  freeShippingMissingPaise: number;
  freeShippingProgressPct: number;
  totalPaise: number;
  totalSavingsPaise: number;
}

/**
 * Calculates discount for a given coupon and subtotal.
 */
export function calculateCouponDiscount(
  coupon: CouponData,
  subtotalPaise: number
): CouponDiscountResult {
  if (!coupon.isActive) {
    return {
      code: coupon.code,
      discountPaise: 0,
      isValid: false,
      meetsMinOrder: false,
      minOrderPaise: coupon.minOrderPaise,
      message: "Coupon is not active",
    };
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return {
      code: coupon.code,
      discountPaise: 0,
      isValid: false,
      meetsMinOrder: false,
      minOrderPaise: coupon.minOrderPaise,
      message: "Coupon has expired",
    };
  }

  if (subtotalPaise < coupon.minOrderPaise) {
    return {
      code: coupon.code,
      discountPaise: 0,
      isValid: true,
      meetsMinOrder: false,
      minOrderPaise: coupon.minOrderPaise,
      message: `Needs ₹${coupon.minOrderPaise / 100}+ order`,
    };
  }

  let discount = 0;
  if (coupon.type === "percent") {
    discount = Math.round((subtotalPaise * coupon.value) / 100);
    if (coupon.maxDiscountPaise !== null) {
      discount = Math.min(discount, coupon.maxDiscountPaise);
    }
  } else if (coupon.type === "flat") {
    discount = coupon.value;
  }

  discount = Math.min(discount, subtotalPaise);

  return {
    code: coupon.code,
    discountPaise: discount,
    isValid: true,
    meetsMinOrder: true,
    minOrderPaise: coupon.minOrderPaise,
  };
}

/**
 * Calculates cart totals including MRP discount, coupon discount, delivery fee,
 * and free shipping progress meter.
 */
export function calculateCartTotals(
  items: Array<{ mrpPaise: number; pricePaise: number; qty: number }>,
  coupon: CouponData | null
): CartTotals {
  const itemCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const mrpTotalPaise = items.reduce((sum, item) => sum + item.mrpPaise * item.qty, 0);
  const subtotalPaise = items.reduce((sum, item) => sum + item.pricePaise * item.qty, 0);
  const mrpDiscountPaise = Math.max(0, mrpTotalPaise - subtotalPaise);

  let couponCode: string | null = null;
  let couponDiscountPaise = 0;
  let couponMeetsMin = true;
  let couponMinOrderPaise = 0;

  if (coupon) {
    couponCode = coupon.code;
    couponMinOrderPaise = coupon.minOrderPaise;
    const res = calculateCouponDiscount(coupon, subtotalPaise);
    couponDiscountPaise = res.discountPaise;
    couponMeetsMin = res.meetsMinOrder;
  }

  const effectiveSubtotalPaise = Math.max(0, subtotalPaise - couponDiscountPaise);

  // Free delivery when (subtotal - coupon) >= ₹999, otherwise ₹79. 0 if cart is empty.
  const shippingPaise =
    itemCount === 0
      ? 0
      : effectiveSubtotalPaise >= FREE_SHIPPING_THRESHOLD_PAISE
      ? 0
      : STANDARD_SHIPPING_FEE_PAISE;

  const freeShippingMissingPaise = Math.max(
    0,
    FREE_SHIPPING_THRESHOLD_PAISE - effectiveSubtotalPaise
  );
  const freeShippingProgressPct =
    FREE_SHIPPING_THRESHOLD_PAISE > 0
      ? Math.min(100, Math.round((effectiveSubtotalPaise / FREE_SHIPPING_THRESHOLD_PAISE) * 100))
      : 100;

  const totalPaise = effectiveSubtotalPaise + shippingPaise;
  const totalSavingsPaise = mrpDiscountPaise + couponDiscountPaise;

  return {
    itemCount,
    totalQty,
    mrpTotalPaise,
    subtotalPaise,
    mrpDiscountPaise,
    couponCode,
    couponDiscountPaise,
    couponMeetsMin,
    couponMinOrderPaise,
    shippingPaise,
    freeShippingMissingPaise,
    freeShippingProgressPct,
    totalPaise,
    totalSavingsPaise,
  };
}
