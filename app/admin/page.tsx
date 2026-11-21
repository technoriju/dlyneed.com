import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardView } from "@/components/admin/DashboardView";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin Dashboard | ShopMate",
  robots: { index: false, follow: false },
};

async function DashboardContent() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login?next=/admin");
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
      take: 6,
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

  const initialData = {
    revenuePaise: revenueResult._sum.totalPaise || 0,
    totalOrders,
    statusCounts,
    products: {
      total: totalProducts,
      active: activeProducts,
      inactive: totalProducts - activeProducts,
    },
    lowStockVariants: variants,
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      totalPaise: o.totalPaise,
      status: o.status,
      paymentMethod: o.paymentMethod,
      items: o.items.map((i) => ({ name: i.name, qty: i.qty })),
    })),
  };

  return (
    <AdminLayout username={admin.username}>
      <DashboardView initialData={initialData} />
    </AdminLayout>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-xs">Loading dashboard...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
