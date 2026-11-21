import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCouponByCode, getUserCart } from "@/lib/cart-server";
import {
  calculateCouponDiscount,
  COD_FEE_PAISE,
  EXPRESS_SHIPPING_FEE_PAISE,
  FREE_SHIPPING_THRESHOLD_PAISE,
  STANDARD_SHIPPING_FEE_PAISE,
} from "@/lib/pricing";
import { createRazorpayOrder } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";
import { MAX_COD_ORDER_PAISE } from "../quote/route";

const createOrderSchema = z.object({
  addressId: z.string().min(1, "Delivery address is required"),
  delivery: z.enum(["standard", "express"]).default("standard"),
  paymentMethod: z.enum(["upi", "card", "netbanking", "wallet", "cod"]).default("upi"),
  couponCode: z.string().nullable().optional(),
});

/**
 * Generates the next sequential Order ID in the format SM10440+ (spec §4, §5).
 */
async function generateNextOrderId(): Promise<string> {
  const count = await db.order.count();
  let candidateNum = 10440 + count;
  let candidateId = `SM${candidateNum}`;

  while (await db.order.findUnique({ where: { id: candidateId } })) {
    candidateNum++;
    candidateId = `SM${candidateNum}`;
  }

  return candidateId;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = createOrderSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid order parameters" },
        { status: 400 }
      );
    }

    const { addressId, delivery, paymentMethod, couponCode } = parsed.data;

    // Verify address belongs to user
    const address = await db.address.findFirst({
      where: { id: addressId, userId: user.id },
    });
    if (!address) {
      return NextResponse.json({ error: "Selected address not found" }, { status: 400 });
    }

    // Load actual lines from DB
    const { items } = await getUserCart(user.id);
    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const mrpTotalPaise = items.reduce((sum, item) => sum + item.mrpPaise * item.qty, 0);
    const subtotalPaise = items.reduce((sum, item) => sum + item.pricePaise * item.qty, 0);
    const mrpDiscountPaise = Math.max(0, mrpTotalPaise - subtotalPaise);

    // Coupon verification
    let couponDiscountPaise = 0;
    let validCouponCode: string | null = null;

    if (couponCode) {
      const coupon = await getCouponByCode(couponCode);
      if (coupon && coupon.isActive) {
        const res = calculateCouponDiscount(coupon, subtotalPaise);
        if (res.meetsMinOrder) {
          validCouponCode = coupon.code;
          couponDiscountPaise = res.discountPaise;
        }
      }
    }

    const effectiveSubtotal = Math.max(0, subtotalPaise - couponDiscountPaise);
    const shippingPaise =
      effectiveSubtotal >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : STANDARD_SHIPPING_FEE_PAISE;
    const expressFeePaise = delivery === "express" ? EXPRESS_SHIPPING_FEE_PAISE : 0;

    // Check COD rules
    const isCod = paymentMethod === "cod";
    if (isCod) {
      const codCheckTotal = effectiveSubtotal + shippingPaise + expressFeePaise + COD_FEE_PAISE;
      if (codCheckTotal > MAX_COD_ORDER_PAISE) {
        return NextResponse.json(
          { error: "Cash on delivery is not available for orders over ₹10,000" },
          { status: 400 }
        );
      }
    }

    const codFeePaise = isCod ? COD_FEE_PAISE : 0;
    const feesPaise = expressFeePaise + codFeePaise;
    const totalPaise = effectiveSubtotal + shippingPaise + feesPaise;
    const discountPaise = mrpDiscountPaise + couponDiscountPaise;

    const orderId = await generateNextOrderId();

    const addressSnapshot = {
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      type: address.type,
    };

    if (isCod) {
      // Direct confirmation for COD orders (spec §6)
      await db.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            id: orderId,
            userId: user.id,
            status: "CONFIRMED",
            addressSnapshot,
            delivery,
            paymentMethod: "cod",
            subtotalPaise,
            discountPaise,
            couponCode: validCouponCode,
            shippingPaise,
            feesPaise,
            totalPaise,
            items: {
              create: items.map((item) => ({
                variantId: item.variantId,
                name: item.name,
                option: item.optionValue || null,
                image: item.image,
                unitPaise: item.pricePaise,
                qty: item.qty,
              })),
            },
            events: {
              create: {
                status: "CONFIRMED",
                note: "Order placed via Cash on Delivery",
              },
            },
          },
        });

        // Decrement stock for each item variant
        for (const item of items) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.qty } },
          });
        }

        // Clear user's cart
        await tx.cartItem.deleteMany({
          where: { userId: user.id },
        });
      });

      return NextResponse.json({
        success: true,
        orderId,
        isCod: true,
        status: "CONFIRMED",
        redirectUrl: `/order/${orderId}/confirmed`,
      });
    }

    // Online payment flow: create order in PENDING_PAYMENT status and initiate Razorpay
    const rzpOrder = await createRazorpayOrder({
      amountPaise: totalPaise,
      receipt: orderId,
      notes: {
        orderId,
        userId: user.id,
      },
    });

    await db.order.create({
      data: {
        id: orderId,
        userId: user.id,
        status: "PENDING_PAYMENT",
        addressSnapshot,
        delivery,
        paymentMethod,
        subtotalPaise,
        discountPaise,
        couponCode: validCouponCode,
        shippingPaise,
        feesPaise,
        totalPaise,
        razorpayOrderId: rzpOrder.id,
        items: {
          create: items.map((item) => ({
            variantId: item.variantId,
            name: item.name,
            option: item.optionValue || null,
            image: item.image,
            unitPaise: item.pricePaise,
            qty: item.qty,
          })),
        },
        events: {
          create: {
            status: "PENDING_PAYMENT",
            note: `Order initiated, awaiting ${paymentMethod.toUpperCase()} payment via Razorpay`,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      orderId,
      isCod: false,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: "INR",
      keyId: rzpOrder.keyId,
      isMock: rzpOrder.isMock ?? false,
      prefill: {
        name: address.name,
        contact: address.phone,
        email: user.email || undefined,
      },
    });
  } catch (err) {
    console.error("POST /api/checkout/create-order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
