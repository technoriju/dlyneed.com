"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { StatusPill } from "@/components/account/StatusPill";
import { CheckIcon, XIcon } from "@/components/layout/icons";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { addDays, fmtDate, inr } from "@/lib/format";
import type { OrderData, OrderItemData } from "./OrdersView";

interface OrderDetailViewProps {
  order: OrderData;
}

const STAGES = [
  { key: "CONFIRMED", label: "Order confirmed" },
  { key: "PACKED", label: "Packed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { key: "DELIVERED", label: "Delivered" },
] as const;

export function OrderDetailView({ order: initialOrder }: OrderDetailViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [order, setOrder] = useState<OrderData>(initialOrder);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Ordered by mistake");
  const [returnReason, setReturnReason] = useState("Size or fit issue");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [buyingAgain, setBuyingAgain] = useState(false);

  const isCancelled = order.status === "CANCELLED" || order.status === "PAYMENT_FAILED";
  const isReturnRequested = order.status === "RETURN_REQUESTED" || order.status === "RETURNED" || order.status === "REFUNDED";
  const isDelivered = order.status === "DELIVERED";

  const canCancel = ["CONFIRMED", "PACKED"].includes(order.status);

  // 30 days check for return
  const deliveredEvent = order.events.find((e) => e.status === "DELIVERED");
  const deliveredDate = deliveredEvent ? new Date(deliveredEvent.at) : new Date(order.createdAt);
  const isWithin30Days = Date.now() - deliveredDate.getTime() < 30 * 24 * 60 * 60 * 1000;
  const canReturn = isDelivered && isWithin30Days;

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

  const currentStageIndex = STAGES.findIndex((s) => s.key === order.status);
  const eta = addDays(order.delivery === "express" ? 2 : 5, new Date(order.createdAt));

  const formatTimestamp = (d: Date | string) => {
    return fmtDate(d, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelSubmit = async () => {
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to cancel order");
        return;
      }
      setOrder(data.order);
      setShowCancelModal(false);
      showToast(`Order ${order.id} cancelled`);
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReturnSubmit = async () => {
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: returnReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to request return");
        return;
      }
      setOrder(data.order);
      setShowReturnModal(false);
      showToast(`Return requested for ${order.id}`);
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleBuyAgain = async () => {
    setBuyingAgain(true);
    try {
      for (const item of order.items) {
        await addToCart(item.variantId, item.qty);
      }
      showToast("Items added to cart");
      router.push("/cart");
    } catch {
      showToast("Failed to re-add items");
    } finally {
      setBuyingAgain(false);
    }
  };

  const mrpTotalPaise = order.items.reduce((sum, item) => sum + item.unitPaise * item.qty, 0);

  return (
    <div>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-3.5 flex items-center gap-2 text-xs text-ink-500">
        <Link href="/account/orders" className="hover:text-brand-600 transition-colors">
          My Orders
        </Link>
        <span aria-hidden="true" className="text-border-strong">/</span>
        <span aria-current="page" className="font-semibold text-ink-900">
          {order.id}
        </span>
      </nav>

      {/* Page Heading */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[clamp(24px,3.2vw,30px)] font-bold tracking-tight text-ink-900">
            Order {order.id}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Placed on {formatTimestamp(order.createdAt)}
          </p>
        </div>
        <div>
          <StatusPill status={order.status} />
        </div>
      </div>

      <div className="grid gap-4.5">
        {/* Tracking Timeline */}
        <section className="rounded-xl border border-border bg-surface p-5.5 shadow-sm">
          <h2 className="mb-4.5 text-base font-bold text-ink-900">
            {isCancelled ? "Order status" : "Track your order"}
          </h2>

          {isCancelled ? (
            /* Cancelled Timeline */
            <ol className="relative ml-2 space-y-6 border-l-2 border-border pl-6">
              <li className="relative">
                <span className="absolute -left-[31px] grid size-7 place-items-center rounded-full bg-brand-600 text-white">
                  <CheckIcon size={14} />
                </span>
                <div>
                  <b className="block text-sm font-semibold text-ink-900">Order confirmed</b>
                  <small className="text-xs text-ink-500">
                    {formatTimestamp(order.createdAt)}
                  </small>
                </div>
              </li>
              <li className="relative">
                <span className="absolute -left-[31px] grid size-7 place-items-center rounded-full bg-bad text-white">
                  <XIcon size={14} />
                </span>
                <div>
                  <b className="block text-sm font-semibold text-bad">Cancelled</b>
                  <small className="block text-xs text-ink-500">
                    {formatTimestamp(
                      order.events.find((e) => e.status === "CANCELLED")?.at || order.createdAt
                    )}
                    {order.paymentMethod === "cod"
                      ? " · nothing was charged"
                      : " · refund to original payment method in 5–7 business days"}
                  </small>
                </div>
              </li>
            </ol>
          ) : (
            /* Standard Tracking Timeline */
            <ol className="relative ml-2 space-y-6 border-l-2 border-border pl-6">
              {STAGES.map(({ key: stageKey, label }, i) => {
                const event = order.events.find((e) => e.status === stageKey);
                const isDone = isReturnRequested || (currentStageIndex !== -1 && i <= currentStageIndex);
                const isCurrent = i === currentStageIndex && !isReturnRequested;

                let timeText = "Pending";
                if (event) {
                  timeText = formatTimestamp(event.at);
                } else if (stageKey === "DELIVERED") {
                  timeText = `Expected by ${fmtDate(eta, { weekday: "short", day: "numeric", month: "short" })}`;
                }

                if (stageKey === "SHIPPED" && isDone && order.awb) {
                  timeText += ` · ${order.awb}`;
                }

                return (
                  <li key={stageKey} className="relative">
                    <span
                      className={`absolute -left-[31px] grid size-7 place-items-center rounded-full transition-all ${
                        isDone
                          ? "bg-brand-600 text-white"
                          : isCurrent
                          ? "border-2 border-brand-600 bg-surface ring-4 ring-brand-100 text-brand-600"
                          : "border-2 border-border-strong bg-surface"
                      }`}
                    >
                      {isDone ? <CheckIcon size={14} /> : null}
                    </span>
                    <div>
                      <b
                        className={`block text-sm font-semibold ${
                          isDone || isCurrent ? "text-ink-900" : "text-ink-500"
                        }`}
                      >
                        {label}
                      </b>
                      <small className="block text-xs text-ink-500">{timeText}</small>
                    </div>
                  </li>
                );
              })}

              {/* If return requested step */}
              {isReturnRequested && (
                <li className="relative">
                  <span className="absolute -left-[31px] grid size-7 place-items-center rounded-full border-2 border-brand-600 bg-surface ring-4 ring-brand-100 text-brand-600">
                    <CheckIcon size={14} />
                  </span>
                  <div>
                    <b className="block text-sm font-semibold text-ink-900">Return requested</b>
                    <small className="block text-xs text-ink-500">
                      {formatTimestamp(
                        order.events.find((e) => e.status === "RETURN_REQUESTED")?.at || new Date()
                      )}
                      {" · pickup within 2 days, refund after pickup"}
                    </small>
                  </div>
                </li>
              )}
            </ol>
          )}
        </section>

        {/* Items in this Order */}
        <section className="rounded-xl border border-border bg-surface p-5.5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-ink-900">Items in this order</h2>
          <div className="divide-y divide-border/60">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3.5 py-3"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div>
                  <b className="block text-sm font-semibold text-ink-900">{item.name}</b>
                  <p className="text-xs text-ink-500">
                    {item.option ? `${item.option} · ` : ""}Qty {item.qty}
                  </p>
                </div>
                <b className="text-sm font-bold text-ink-900">
                  {inr(item.unitPaise * item.qty)}
                </b>
              </div>
            ))}
          </div>

          {/* Action buttons row */}
          <div className="mt-4 flex flex-wrap gap-2.5 border-t border-border pt-4">
            {canCancel && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className={`${btnDanger} cursor-pointer !h-9 !px-4 !text-xs`}
              >
                Cancel order
              </button>
            )}

            {canReturn && (
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className={`${btnSecondary} cursor-pointer !h-9 !px-4 !text-xs`}
              >
                Return items
              </button>
            )}

            {(isDelivered || isCancelled) && (
              <button
                type="button"
                onClick={handleBuyAgain}
                disabled={buyingAgain}
                className={`${btnSecondary} cursor-pointer !h-9 !px-4 !text-xs disabled:opacity-50`}
              >
                {buyingAgain ? "Adding..." : "Buy again"}
              </button>
            )}

            <Link
              href="/help"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-transparent px-3 text-xs font-semibold text-ink-700 hover:bg-surface-muted transition-colors"
            >
              Need help?
            </Link>
          </div>
        </section>

        {/* Cards Row: Delivery Address & Payment Summary */}
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          {/* Delivery Address */}
          <section className="rounded-xl border border-border bg-surface p-4.5 shadow-sm text-sm">
            <h2 className="mb-2 text-sm font-bold text-ink-900">Delivery address</h2>
            <div className="space-y-0.5 text-ink-700">
              <b className="block font-semibold text-ink-900">{addr.name}</b>
              <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
              <p>{addr.city}, {addr.state} {addr.pincode}</p>
              <p className="text-xs text-ink-500">Phone: +91 {addr.phone}</p>
            </div>
            <div className="mt-3 border-t border-border pt-2">
              <span className="text-xs font-medium text-ink-500">
                {order.delivery === "express" ? "Express delivery (1–2 days)" : "Standard delivery (3–5 days)"}
              </span>
            </div>
          </section>

          {/* Payment */}
          <section className="rounded-xl border border-border bg-surface p-4.5 shadow-sm text-sm">
            <h2 className="mb-2 text-sm font-bold text-ink-900">Payment</h2>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">Method</span>
                <b className="font-semibold text-ink-900 capitalize">{order.paymentMethod}</b>
              </div>
              {order.razorpayPaymentId && (
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Payment ID</span>
                  <span className="font-mono text-ink-700">{order.razorpayPaymentId}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">Items (MRP)</span>
                <span className="text-ink-700">{inr(mrpTotalPaise)}</span>
              </div>
              {order.discountPaise > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Discount</span>
                  <span className="text-ok font-medium">− {inr(order.discountPaise)}</span>
                </div>
              )}
              {order.couponCode && (
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">Coupon ({order.couponCode})</span>
                  <span className="text-ok font-medium">Applied</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-ink-500">Delivery & fees</span>
                <span className="text-ink-700">
                  {order.shippingPaise + order.feesPaise > 0
                    ? inr(order.shippingPaise + order.feesPaise)
                    : "Free"}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm font-bold text-ink-900">
                <span>Total</span>
                <span>{inr(order.totalPaise)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-ink-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cx-h"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl animate-scale-up">
            <h2 id="cx-h" className="text-lg font-bold text-ink-900">
              Cancel this order?
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              {order.paymentMethod === "cod"
                ? "Nothing has been charged, so there's nothing to refund."
                : `Your refund of ${inr(order.totalPaise)} goes back to your ${order.paymentMethod} within 5–7 business days.`}
            </p>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="cx-r" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Reason
              </label>
              <select
                id="cx-r"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="h-11 rounded-lg border border-border-strong bg-surface px-3.5 text-sm text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 cursor-pointer"
              >
                <option>Ordered by mistake</option>
                <option>Found a better price</option>
                <option>Delivery is too slow</option>
                <option>Other</option>
              </select>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className={btnSecondary}
                disabled={submittingAction}
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={submittingAction}
                className={`${btnDanger} cursor-pointer`}
              >
                {submittingAction ? "Cancelling..." : "Yes, cancel order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturnModal && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-ink-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ret-h"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl animate-scale-up">
            <h2 id="ret-h" className="text-lg font-bold text-ink-900">
              Return items?
            </h2>
            <p className="mt-2 text-sm text-ink-500">
              A courier will pick up the items within 2 days. Your refund is issued after pickup.
            </p>

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="ret-r" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
                Reason
              </label>
              <select
                id="ret-r"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="h-11 rounded-lg border border-border-strong bg-surface px-3.5 text-sm text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 cursor-pointer"
              >
                <option>Size or fit issue</option>
                <option>Damaged or defective</option>
                <option>Not as described</option>
                <option>Changed my mind</option>
              </select>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReturnModal(false)}
                className={btnSecondary}
                disabled={submittingAction}
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={handleReturnSubmit}
                disabled={submittingAction}
                className={`${btnPrimary} cursor-pointer`}
              >
                {submittingAction ? "Requesting..." : "Request return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
