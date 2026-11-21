import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCouponByCode } from "@/lib/cart-server";
import { calculateCouponDiscount } from "@/lib/pricing";

const couponApplySchema = z.object({
  code: z.string().min(1).max(30),
  subtotalPaise: z.number().int().nonnegative().optional().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = couponApplySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please enter a valid coupon code" }, { status: 400 });
    }

    const { code, subtotalPaise } = parsed.data;
    const coupon = await getCouponByCode(code);

    if (!coupon) {
      return NextResponse.json({ error: "Invalid coupon code" }, { status: 400 });
    }

    const result = calculateCouponDiscount(coupon, subtotalPaise);
    if (!result.isValid) {
      return NextResponse.json({ error: result.message || "Invalid coupon code" }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        maxDiscountPaise: coupon.maxDiscountPaise,
        minOrderPaise: coupon.minOrderPaise,
      },
      discountPaise: result.discountPaise,
      meetsMinOrder: result.meetsMinOrder,
      message: result.message,
    });
  } catch (err) {
    console.error("POST /api/cart/coupon error:", err);
    return NextResponse.json({ error: "Failed to apply coupon" }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true, message: "Coupon removed" });
}
