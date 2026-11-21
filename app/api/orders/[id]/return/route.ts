import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const returnSchema = z.object({
  reason: z.string().trim().optional().default("Size or fit issue"),
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
        events: {
          orderBy: { at: "desc" },
        },
      },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: `Cannot request a return for order in "${order.status}" status. Returns are only allowed for delivered orders.` },
        { status: 400 }
      );
    }

    // Check 30-day window
    const deliveredEvent = order.events.find((e) => e.status === "DELIVERED");
    const deliveredAt = deliveredEvent ? deliveredEvent.at.getTime() : order.createdAt.getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - deliveredAt > thirtyDaysMs) {
      return NextResponse.json(
        { error: "Returns are only allowed within 30 days of delivery." },
        { status: 400 }
      );
    }

    let reason = "Size or fit issue";
    try {
      const json = await req.json();
      const parsed = returnSchema.safeParse(json);
      if (parsed.success && parsed.data.reason) {
        reason = parsed.data.reason;
      }
    } catch {
      // Body might be empty
    }

    const updated = await db.order.update({
      where: { id: order.id },
      data: {
        status: "RETURN_REQUESTED",
        events: {
          create: {
            status: "RETURN_REQUESTED",
            note: `Return requested: ${reason}. Pickup scheduled within 2 days.`,
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

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("POST /api/orders/[id]/return error:", err);
    return NextResponse.json({ error: "Failed to request return" }, { status: 500 });
  }
}
