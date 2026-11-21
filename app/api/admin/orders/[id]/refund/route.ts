import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { createRazorpayRefund } from "@/lib/razorpay";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let refundId = `admin_manual_${Date.now()}`;
    let refundNote = "Refund processed by admin";

    if (order.paymentMethod !== "cod" && order.razorpayPaymentId) {
      const refund = await createRazorpayRefund({
        paymentId: order.razorpayPaymentId,
        amountPaise: order.totalPaise,
        notes: {
          orderId: order.id,
          initiatedBy: "admin",
        },
      });
      refundId = refund.id;
      refundNote = `Razorpay refund of ₹${(order.totalPaise / 100).toFixed(2)} processed (${refund.id})`;
    } else {
      refundNote = `COD / offline refund of ₹${(order.totalPaise / 100).toFixed(2)} processed by admin`;
    }

    const updated = await db.$transaction(async (tx) => {
      // If order was in RETURN_REQUESTED or DELIVERED, restock items
      if (order.status === "RETURN_REQUESTED" || order.status === "DELIVERED") {
        for (const item of order.items) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.qty } },
          });
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: "REFUNDED",
          events: {
            create: {
              status: "REFUNDED",
              note: refundNote,
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

    return NextResponse.json({ success: true, refundId, order: updated });
  } catch (err) {
    console.error("POST /api/admin/orders/[id]/refund error:", err);
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 });
  }
}
