import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";

const verifySchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay Signature is required"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = verifySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid verification payload" },
        { status: 400 }
      );
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

    // Fetch order with items
    const order = await db.order.findFirst({
      where: { id: orderId, userId: user.id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotent check: if already confirmed, return success immediately
    if (order.status === "CONFIRMED") {
      return NextResponse.json({
        success: true,
        orderId,
        redirectUrl: `/order/${orderId}/confirmed`,
      });
    }

    // Verify signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      // Record payment failure event
      await db.orderEvent.create({
        data: {
          orderId: order.id,
          status: "PAYMENT_FAILED",
          note: `Signature verification failed for payment ${razorpay_payment_id}`,
        },
      });

      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    // Atomically confirm order, decrement stock, and clear user's cart
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          razorpayPaymentId: razorpay_payment_id,
          events: {
            create: {
              status: "CONFIRMED",
              note: `Payment verified (${razorpay_payment_id})`,
            },
          },
        },
      });

      // Decrement variant stocks
      for (const item of order.items) {
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
      redirectUrl: `/order/${orderId}/confirmed`,
    });
  } catch (err) {
    console.error("POST /api/checkout/verify error:", err);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
