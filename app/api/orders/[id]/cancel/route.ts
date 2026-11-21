import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { createRazorpayRefund } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const cancelSchema = z.object({
  reason: z.string().trim().optional().default("Customer requested cancellation"),
});

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!["CONFIRMED", "PACKED"].includes(order.status)) {
      return NextResponse.json(
        { error: `Cannot cancel an order with status "${order.status}". Only confirmed or packed orders can be cancelled.` },
        { status: 400 }
      );
    }

    let reason = "Customer requested cancellation";
    try {
      const json = await req.json();
      const parsed = cancelSchema.safeParse(json);
      if (parsed.success && parsed.data.reason) {
        reason = parsed.data.reason;
      }
    } catch {
      // Body might be empty
    }

    let refundNote = "";
    if (order.paymentMethod !== "cod" && order.razorpayPaymentId) {
      try {
        const refund = await createRazorpayRefund({
          paymentId: order.razorpayPaymentId,
          amountPaise: order.totalPaise,
          notes: {
            orderId: order.id,
            reason,
          },
        });
        refundNote = ` · Refund of ₹${(order.totalPaise / 100).toFixed(2)} initiated (${refund.id})`;
      } catch (err) {
        console.warn("Refund creation failed during order cancellation:", err);
        refundNote = " · Refund processing queued";
      }
    } else if (order.paymentMethod === "cod") {
      refundNote = " · Nothing was charged (COD)";
    }

    const updated = await db.$transaction(async (tx) => {
      // 1. Restock items
      for (const item of order.items) {
        await tx.variant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.qty } },
        });
      }

      // 2. Update order status and add event
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          events: {
            create: {
              status: "CANCELLED",
              note: `Cancelled: ${reason}${refundNote}`,
            },
          },
        },
        include: {
          items: true,
          events: {
            orderBy: { at: "asc" },
          },
        },
      });

      return updatedOrder;
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("POST /api/orders/[id]/cancel error:", err);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
