import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalOrders,
      ordersByStatus,
      revenueResult,
      totalProducts,
      activeProducts,
      variants,
      recentOrders,
    ] = await Promise.all([
      db.order.count(),
      db.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      db.order.aggregate({
        where: {
          status: {
            in: ["CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"],
          },
        },
        _sum: {
          totalPaise: true,
        },
      }),
      db.product.count(),
      db.product.count({ where: { isActive: true } }),
      db.variant.findMany({
        where: { stock: { lte: 5 } },
        include: {
          product: {
            select: { name: true, slug: true },
          },
        },
        orderBy: { stock: "asc" },
      }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const group of ordersByStatus) {
      statusCounts[group.status] = group._count.id;
    }

    return NextResponse.json({
      revenuePaise: revenueResult._sum.totalPaise || 0,
      totalOrders,
      statusCounts,
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: totalProducts - activeProducts,
      },
      lowStockVariants: variants,
      recentOrders,
    });
  } catch (err) {
    console.error("GET /api/admin/stats error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
