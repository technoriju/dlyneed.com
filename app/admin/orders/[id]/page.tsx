import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminOrderDetail,
  AdminOrderDetailView,
} from "@/components/admin/AdminOrderDetailView";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order #${id} | ShopMate Admin`,
    robots: { index: false, follow: false },
  };
}

async function OrderDetailContent({ params }: PageProps) {
  const { id } = await params;
  const admin = await getAdminSession();
  if (!admin) {
    redirect(`/admin/login?next=/admin/orders/${id}`);
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, phone: true, email: true },
      },
      items: true,
      events: {
        orderBy: { at: "asc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <AdminLayout username={admin.username}>
      <AdminOrderDetailView initialOrder={order as AdminOrderDetail} />
    </AdminLayout>
  );
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-xs">Loading order...</p>
        </div>
      }
    >
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
