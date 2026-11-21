import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminOrdersView,
  AdminOrderSummary,
} from "@/components/admin/AdminOrdersView";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Orders Management | ShopMate Admin",
  robots: { index: false, follow: false },
};

async function OrdersContent() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login?next=/admin/orders");
  }

  const orders = await db.order.findMany({
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true },
      },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminLayout username={admin.username}>
      <AdminOrdersView initialOrders={orders as AdminOrderSummary[]} />
    </AdminLayout>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-xs">Loading orders...</p>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
