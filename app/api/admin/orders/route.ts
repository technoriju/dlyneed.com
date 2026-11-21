import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q")?.toLowerCase();

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    let orders = await db.order.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true },
        },
        items: true,
        events: {
          orderBy: { at: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (q) {
      orders = orders.filter((o) => {
        const addr = (o.addressSnapshot as any) || {};
        return (
          o.id.toLowerCase().includes(q) ||
          o.user.name.toLowerCase().includes(q) ||
          o.user.phone.includes(q) ||
          (addr.name && addr.name.toLowerCase().includes(q)) ||
          (o.awb && o.awb.toLowerCase().includes(q))
        );
      });
    }

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("GET /api/admin/orders error:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
