import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateStatusSchema = z.object({
  status: z.enum([
    "PENDING_PAYMENT",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUNDED",
    "PAYMENT_FAILED",
  ]),
  note: z.string().optional(),
  awb: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const json = await req.json();
    const parsed = updateStatusSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid status update" },
        { status: 400 }
      );
    }

    const { status, note, awb } = parsed.data;

    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      // If order is transitioned to CANCELLED from an active state, restock items
      if (status === "CANCELLED" && order.status !== "CANCELLED") {
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
          status,
          ...(awb ? { awb } : {}),
          events: {
            create: {
              status,
              note: note || `Order updated to ${status} by admin`,
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
    console.error("PATCH /api/admin/orders/[id]/status error:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
