"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { StatusPill } from "@/components/account/StatusPill";
import { btnPrimary, btnSecondary } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { addDays, fmtDate, inr } from "@/lib/format";

export interface OrderItemData {
  id: string;
  variantId: string;
  name: string;
  option?: string | null;
  image: string;
  unitPaise: number;
  qty: number;
}

export interface OrderEventData {
  id: string;
  status: string;
  note?: string | null;
  at: Date | string;
}

export interface OrderData {
  id: string;
  userId: string;
  status: string;
  items: OrderItemData[];
  addressSnapshot: any;
  delivery: string;
  paymentMethod: string;
  subtotalPaise: number;
  discountPaise: number;
  couponCode?: string | null;
  shippingPaise: number;
  feesPaise: number;
  totalPaise: number;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  awb?: string | null;
  events: OrderEventData[];
  createdAt: Date | string;
}

type OrderFilter = "all" | "active" | "delivered" | "cancelled";

const IN_PROGRESS_STATUSES = ["CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "PENDING_PAYMENT"];
const DELIVERED_STATUSES = ["DELIVERED", "RETURN_REQUESTED", "RETURNED", "REFUNDED"];
const CANCELLED_STATUSES = ["CANCELLED", "PAYMENT_FAILED"];

export function OrdersView({ initialOrders }: { initialOrders: OrderData[] }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [orders] = useState<OrderData[]>(initialOrders);
  const [buyingAgain, setBuyingAgain] = useState<string | null>(null);

  const activeCount = orders.filter((o) => IN_PROGRESS_STATUSES.includes(o.status)).length;
  const deliveredCount = orders.filter((o) => DELIVERED_STATUSES.includes(o.status)).length;
  const cancelledCount = orders.filter((o) => CANCELLED_STATUSES.includes(o.status)).length;

  const filteredOrders = orders.filter((o) => {
    if (filter === "active") return IN_PROGRESS_STATUSES.includes(o.status);
    if (filter === "delivered") return DELIVERED_STATUSES.includes(o.status);
    if (filter === "cancelled") return CANCELLED_STATUSES.includes(o.status);
    return true;
  });

  const handleBuyAgain = async (order: OrderData) => {
    setBuyingAgain(order.id);
    try {
      for (const item of order.items) {
        await addToCart(item.variantId, item.qty);
      }
      showToast("Items added to cart");
      router.push("/cart");
    } catch {
      showToast("Failed to re-add items to cart");
    } finally {
      setBuyingAgain(null);
    }
  };

  const getOrderSubtitle = (order: OrderData) => {
    const isCancelled = order.status === "CANCELLED" || order.status === "PAYMENT_FAILED";
    if (isCancelled) {
      const cancelEvent = order.events.find((e) => e.status === "CANCELLED");
      const cancelDate = cancelEvent ? cancelEvent.at : order.createdAt;
      const isCod = order.paymentMethod === "cod";
      return `Cancelled on ${fmtDate(cancelDate, { day: "numeric", month: "short" })}${
        isCod ? " · refund not needed" : " · refunded / reversal initiated"
      }`;
    }

    if (order.status === "DELIVERED") {
      const delEvent = order.events.find((e) => e.status === "DELIVERED");
      const delDate = delEvent ? delEvent.at : order.createdAt;
      return `Delivered on ${fmtDate(delDate, { day: "numeric", month: "short" })}`;
    }

    if (order.status === "RETURN_REQUESTED") {
      return "Pickup will be scheduled within 2 days";
    }

    if (order.status === "RETURNED" || order.status === "REFUNDED") {
      return "Return completed · refund processed";
    }

    const eta = addDays(order.delivery === "express" ? 2 : 5, new Date(order.createdAt));
    return `Arriving by ${fmtDate(eta, { weekday: "short", day: "numeric", month: "short" })}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-4.5">
        <h1 className="text-[clamp(24px,3.2vw,30px)] font-bold tracking-tight text-ink-900">
          My Orders
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {orders.length} order{orders.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4.5 flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar" role="group" aria-label="Filter orders">
        {[
          { key: "all", label: "All", count: orders.length },
          { key: "active", label: "In progress", count: activeCount },
          { key: "delivered", label: "Delivered", count: deliveredCount },
          { key: "cancelled", label: "Cancelled", count: cancelledCount },
        ].map((tab) => {
          const isSelected = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key as OrderFilter)}
              aria-pressed={isSelected}
              className={`h-9 shrink-0 cursor-pointer rounded-full px-3.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-ink-900 text-white"
                  : "border border-border-strong bg-surface text-ink-700 hover:border-ink-900"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const firstItem = order.items[0];
            const remainingCount = order.items.length - 1;
            const isInProgress = IN_PROGRESS_STATUSES.includes(order.status);
            const isDelivered = order.status === "DELIVERED";

            return (
              <article
                key={order.id}
                className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
              >
                {/* Order Head Meta */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-muted px-3.5 sm:px-4.5 py-3 text-xs text-ink-500">
                  <div className="flex flex-wrap gap-4 sm:gap-7">
                    <div>
                      <span className="block text-ink-500">Order placed</span>
                      <b className="text-sm font-semibold text-ink-900">
                        {fmtDate(order.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                      </b>
                    </div>
                    <div>
                      <span className="block text-ink-500">Total</span>
                      <b className="text-sm font-semibold text-ink-900">{inr(order.totalPaise)}</b>
                    </div>
                    <div>
                      <span className="block text-ink-500">Order #</span>
                      <b className="text-sm font-semibold text-ink-900">{order.id}</b>
                    </div>
                  </div>
                </div>

                {/* Order Body */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 p-3.5 sm:p-4.5">
                  <div className="flex items-center gap-3">
                    {/* Thumbnails */}
                    <div className="flex shrink-0 gap-2">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="relative size-14 sm:size-15 overflow-hidden rounded-md border border-border bg-surface-muted shrink-0"
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="60px"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Order Text Info */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1">
                        <StatusPill status={order.status} />
                      </div>
                      <b className="block text-sm font-semibold text-ink-900 truncate">
                        {firstItem ? firstItem.name : "Order item"}
                        {remainingCount > 0 ? ` and ${remainingCount} more item${remainingCount > 1 ? "s" : ""}` : ""}
                      </b>
                      <span className="mt-0.5 block text-xs text-ink-500">
                        {getOrderSubtitle(order)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex h-9 flex-1 sm:flex-initial items-center justify-center rounded-md bg-brand-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-700 active:scale-95"
                    >
                      {isInProgress ? "Track order" : "View details"}
                    </Link>
                    {isDelivered && (
                      <button
                        type="button"
                        onClick={() => handleBuyAgain(order)}
                        disabled={buyingAgain === order.id}
                        className="inline-flex h-9 flex-1 sm:flex-initial cursor-pointer items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-xs font-semibold text-ink-700 transition-colors hover:bg-surface-muted disabled:opacity-50 active:scale-95"
                      >
                        {buyingAgain === order.id ? "Adding..." : "Buy again"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface p-12 text-center">
          <h2 className="text-lg font-semibold text-ink-900">No orders here</h2>
          <p className="max-w-[40ch] text-sm text-ink-500">
            Orders in this group will show up here.
          </p>
          <Link href="/shop" className={`${btnPrimary} mt-2`}>
            Start shopping
          </Link>
        </div>
      )}
    </div>
  );
}
