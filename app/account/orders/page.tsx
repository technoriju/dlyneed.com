import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { OrdersView } from "@/components/account/OrdersView";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Orders | ShopMate",
  description: "Track and manage your ShopMate orders.",
  robots: {
    index: false,
    follow: false,
  },
};

async function AccountOrdersContent() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/account/orders");
  }

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

  return (
    <AccountShell user={user}>
      <OrdersView initialOrders={orders} />
    </AccountShell>
  );
}

export default function AccountOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-sm">Loading your orders...</p>
        </div>
      }
    >
      <AccountOrdersContent />
    </Suspense>
  );
}
