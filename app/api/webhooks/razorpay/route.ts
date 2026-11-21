import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    if (!verifyWebhookSignature(rawBody, signature)) {
      console.warn("Razorpay webhook signature verification failed");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    if (eventType === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      const rzpOrderId = payment?.order_id;
      const rzpPaymentId = payment?.id;

      if (rzpOrderId) {
        const order = await db.order.findUnique({
          where: { razorpayOrderId: rzpOrderId },
          include: { items: true },
        });

        // Idempotent: only act if order is still PENDING_PAYMENT
        if (order && order.status === "PENDING_PAYMENT") {
          await db.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: "CONFIRMED",
                razorpayPaymentId: rzpPaymentId,
                events: {
                  create: {
                    status: "CONFIRMED",
                    note: "Payment captured via Razorpay webhook",
                  },
                },
              },
            });

            for (const item of order.items) {
              await tx.variant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.qty } },
              });
            }

            await tx.cartItem.deleteMany({
              where: { userId: order.userId },
            });
          });
        }
      }
    } else if (eventType === "payment.failed") {
      const payment = event.payload?.payment?.entity;
      const rzpOrderId = payment?.order_id;

      if (rzpOrderId) {
        const order = await db.order.findUnique({
          where: { razorpayOrderId: rzpOrderId },
        });

        if (order && order.status === "PENDING_PAYMENT") {
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "PAYMENT_FAILED",
              events: {
                create: {
                  status: "PAYMENT_FAILED",
                  note: payment?.error_description || "Payment failed via Razorpay",
                },
              },
            },
          });
        }
      }
    } else if (eventType === "refund.processed") {
      const refund = event.payload?.refund?.entity;
      const rzpPaymentId = refund?.payment_id;

      if (rzpPaymentId) {
        const order = await db.order.findUnique({
          where: { razorpayPaymentId: rzpPaymentId },
        });

        if (order) {
          const refundInr = refund?.amount ? (refund.amount / 100).toFixed(2) : "0.00";
          await db.order.update({
            where: { id: order.id },
            data: {
              status: "REFUNDED",
              events: {
                create: {
                  status: "REFUNDED",
                  note: `Refund of ₹${refundInr} processed via Razorpay`,
                },
              },
            },
          });
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
