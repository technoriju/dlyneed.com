import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCouponByCode, getUserCart } from "@/lib/cart-server";
import {
  calculateCouponDiscount,
  COD_FEE_PAISE,
  EXPRESS_SHIPPING_FEE_PAISE,
  FREE_SHIPPING_THRESHOLD_PAISE,
  STANDARD_SHIPPING_FEE_PAISE,
} from "@/lib/pricing";
import { getSessionUser } from "@/lib/session";

const quoteSchema = z.object({
  addressId: z.string().optional(),
  delivery: z.enum(["standard", "express"]).default("standard"),
  paymentMethod: z.enum(["upi", "card", "netbanking", "wallet", "cod"]).default("upi"),
  couponCode: z.string().nullable().optional(),
});

export const MAX_COD_ORDER_PAISE = 10000_00; // ₹10,000 max for COD (spec §5)

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = quoteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid quote parameters" }, { status: 400 });
    }

    const { delivery, paymentMethod, couponCode } = parsed.data;

    // Load actual lines from DB
    const { items } = await getUserCart(user.id);
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const mrpTotalPaise = items.reduce((sum, item) => sum + item.mrpPaise * item.qty, 0);
    const subtotalPaise = items.reduce((sum, item) => sum + item.pricePaise * item.qty, 0);
    const mrpDiscountPaise = Math.max(0, mrpTotalPaise - subtotalPaise);

    // Coupon
    let couponDiscountPaise = 0;
    let couponMeetsMin = true;
    let validCouponCode: string | null = null;

    if (couponCode) {
      const coupon = await getCouponByCode(couponCode);
      if (coupon && coupon.isActive) {
        const res = calculateCouponDiscount(coupon, subtotalPaise);
        validCouponCode = coupon.code;
        couponDiscountPaise = res.discountPaise;
        couponMeetsMin = res.meetsMinOrder;
      }
    }

    const effectiveSubtotal = Math.max(0, subtotalPaise - couponDiscountPaise);
    const shippingPaise =
      effectiveSubtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : STANDARD_SHIPPING_FEE_PAISE;

    const expressFeePaise = delivery === "express" ? EXPRESS_SHIPPING_FEE_PAISE : 0;

    // Check base total without COD fee to verify COD availability
    const baseTotalBeforeCod = effectiveSubtotal + shippingPaise + expressFeePaise;
    const codAvailable = baseTotalBeforeCod + COD_FEE_PAISE <= MAX_COD_ORDER_PAISE;

    const effectivePaymentMethod =
      paymentMethod === "cod" && !codAvailable ? "upi" : paymentMethod;
    const codFeePaise = effectivePaymentMethod === "cod" ? COD_FEE_PAISE : 0;
    const feesPaise = expressFeePaise + codFeePaise;
    const totalPaise = effectiveSubtotal + shippingPaise + feesPaise;
    const totalSavingsPaise = mrpDiscountPaise + couponDiscountPaise;

    return NextResponse.json({
      items,
      count: items.reduce((sum, i) => sum + i.qty, 0),
      mrpTotalPaise,
      subtotalPaise,
      mrpDiscountPaise,
      couponCode: validCouponCode,
      couponDiscountPaise,
      couponMeetsMin,
      shippingPaise,
      feesPaise,
      expressFeePaise,
      codFeePaise,
      totalPaise,
      totalSavingsPaise,
      codAvailable,
      delivery,
      paymentMethod: effectivePaymentMethod,
    });
  } catch (err) {
    console.error("POST /api/checkout/quote error:", err);
    return NextResponse.json({ error: "Failed to calculate quote" }, { status: 500 });
  }
}
