import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { OrderDetailView } from "@/components/account/OrderDetailView";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order ${id} | ShopMate`,
    description: `Track and view details for order ${id}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function OrderDetailContent({ params }: PageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=/account/orders/${id}`);
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: {
        orderBy: { at: "asc" },
      },
    },
  });

  if (!order || order.userId !== user.id) {
    notFound();
  }

  return (
    <AccountShell user={user}>
      <OrderDetailView order={order} />
    </AccountShell>
  );
}

export default function OrderDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-sm">Loading order details...</p>
        </div>
      }
    >
      <OrderDetailContent params={params} />
    </Suspense>
  );
}
