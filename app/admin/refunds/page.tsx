import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminRefundOrder,
  AdminRefundsView,
} from "@/components/admin/AdminRefundsView";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Refunds & Returns | ShopMate Admin",
  robots: { index: false, follow: false },
};

async function RefundsContent() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login?next=/admin/refunds");
  }

  const orders = await db.order.findMany({
    where: {
      status: {
        in: ["RETURN_REQUESTED", "CANCELLED", "REFUNDED", "RETURNED"],
      },
    },
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true },
      },
      events: {
        orderBy: { at: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminLayout username={admin.username}>
      <AdminRefundsView initialOrders={orders as unknown as AdminRefundOrder[]} />
    </AdminLayout>
  );
}

export default function AdminRefundsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-xs">Loading refunds & return requests...</p>
        </div>
      }
    >
      <RefundsContent />
    </Suspense>
  );
}
