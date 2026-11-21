import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");

    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: {
        items: true,
        events: {
          orderBy: { at: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let filtered = orders;
    if (filter === "active") {
      filtered = orders.filter((o) =>
        ["CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(o.status)
      );
    } else if (filter === "delivered") {
      filtered = orders.filter((o) =>
        ["DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"].includes(o.status)
      );
    } else if (filter === "cancelled") {
      filtered = orders.filter((o) =>
        ["CANCELLED", "PAYMENT_FAILED"].includes(o.status)
      );
    }

    return NextResponse.json({ orders: filtered });
  } catch (err) {
    console.error("GET /api/orders error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
