import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckIcon } from "@/components/layout/icons";
import { db } from "@/lib/db";
import { addDays, fmtDate, inr } from "@/lib/format";
import { getSessionUser } from "@/lib/session";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Order ${id} Confirmed | ShopMate`,
    description: "Your ShopMate order has been placed successfully.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function OrderConfirmedContent({ params }: PageProps) {
  const { id } = await params;
  const user = await getSessionUser();

  if (!user) {
    redirect(`/login?next=/order/${id}/confirmed`);
  }

  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: true,
    },
  });

  if (!order || order.userId !== user.id) {
    notFound();
  }

  const addr = (order.addressSnapshot as {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    type?: string;
  }) || {};

  const isExpress = order.delivery === "express";
  const eta = addDays(isExpress ? 2 : 5, order.createdAt);
  const isCod = order.paymentMethod === "cod";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Confirmation Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-ok/15 text-ok">
          <CheckIcon size={36} />
        </div>
        <h1 className="text-[clamp(24px,3.5vw,32px)] font-bold tracking-tight text-ink-900">
          Thank you, your order is placed!
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          We&apos;ve sent the details to +91 {user.phone || addr.phone}
          {user.email ? ` and ${user.email}` : ""}.
        </p>
      </div>

      {/* Key-Value Strip */}
      <div className="mt-8 grid grid-cols-1 divide-y divide-border rounded-xl border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0 shadow-card">
        <div className="p-4 text-center sm:text-left">
          <small className="block text-xs uppercase tracking-wider text-ink-500">
            Order number
          </small>
          <b className="mt-1 block text-base font-bold text-ink-900">{order.id}</b>
        </div>
        <div className="p-4 text-center sm:text-left">
          <small className="block text-xs uppercase tracking-wider text-ink-500">
            Estimated delivery
          </small>
          <b className="mt-1 block text-base font-bold text-ink-900">
            {fmtDate(eta, { weekday: "short", day: "numeric", month: "short" })}
          </b>
        </div>
        <div className="p-4 text-center sm:text-left">
          <small className="block text-xs uppercase tracking-wider text-ink-500">
            {isCod ? "Pay on delivery" : "Amount paid"}
          </small>
          <b className="mt-1 block text-base font-bold text-ink-900">
            {inr(order.totalPaise)}
          </b>
        </div>
      </div>

      {/* Items & Delivery Address Box */}
      <div className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-card space-y-6">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Items</h2>
          <div className="mt-3 divide-y divide-border/60">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3 text-sm">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{item.name}</p>
                  <p className="text-xs text-ink-500">
                    {item.option ? `${item.option} · ` : ""}Qty {item.qty}
                  </p>
                </div>
                <div className="text-right font-medium text-ink-900">
                  {inr(item.unitPaise * item.qty)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="border-t border-border pt-4 text-sm">
          <b className="block text-ink-900">Delivering to</b>
          <div className="mt-1 space-y-0.5 text-ink-700">
            <p className="font-semibold text-ink-900">{addr.name}</p>
            <p>
              {addr.line1}
              {addr.line2 ? `, ${addr.line2}` : ""}
            </p>
            <p>
              {addr.city}, {addr.state} – {addr.pincode}
            </p>
            <p className="text-xs text-ink-500">+91 {addr.phone}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={`/account/orders/${order.id}`}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-6 font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Track order
        </Link>
        <Link
          href="/shop"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-surface px-6 font-semibold text-ink-700 transition-colors hover:bg-surface-muted"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmedPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-20 text-center text-ink-500">
          <div className="mx-auto size-9 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-sm">Loading order details...</p>
        </div>
      }
    >
      <OrderConfirmedContent params={params} />
    </Suspense>
  );
}
