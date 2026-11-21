"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { StatusPill } from "@/components/account/StatusPill";
import { inr } from "@/lib/format";

export interface AdminOrderItem {
  id: string;
  orderId: string;
  variantId: string;
  name: string;
  option: string | null;
  image: string;
  unitPaise: number;
  qty: number;
}

export interface AdminOrderSummary {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  status: string;
  items: AdminOrderItem[];
  addressSnapshot: any;
  delivery: string;
  paymentMethod: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  feesPaise: number;
  totalPaise: number;
  awb: string | null;
  createdAt: string | Date;
}

interface AdminOrdersViewProps {
  initialOrders: AdminOrderSummary[];
}

const STATUS_FILTERS = [
  { key: "all", label: "All Orders" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PACKED", label: "Packed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "RETURN_REQUESTED", label: "Return Requested" },
  { key: "REFUNDED", label: "Refunded" },
];

export function AdminOrdersView({ initialOrders }: AdminOrdersViewProps) {
  const [orders, setOrders] = useState<AdminOrderSummary[]>(initialOrders);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = orders.filter((o) => {
    if (selectedStatus !== "all" && o.status !== selectedStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const addr = (o.addressSnapshot as any) || {};
      const matchId = o.id.toLowerCase().includes(q);
      const matchName = o.user.name.toLowerCase().includes(q);
      const matchPhone = o.user.phone.includes(q);
      const matchCity = addr.city && addr.city.toLowerCase().includes(q);
      const matchAwb = o.awb && o.awb.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchPhone && !matchCity && !matchAwb) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex-1 p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Orders Management
          </h1>
          <p className="text-sm text-ink-500">
            Monitor incoming orders, advance fulfillment status, enter shipping AWB, and handle returns.
          </p>
        </div>
        <div className="text-sm text-ink-500 font-medium">
          Total: <b className="text-ink-900">{orders.length}</b> orders
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs sm:text-sm">
        {STATUS_FILTERS.map((tab) => {
          const isActive = selectedStatus === tab.key;
          const count =
            tab.key === "all"
              ? orders.length
              : orders.filter((o) => o.status === tab.key).length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedStatus(tab.key)}
              className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3 py-2 font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white font-semibold"
                  : "text-ink-600 hover:bg-surface-muted"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-surface-muted text-ink-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-ink-400">🔍</span>
        <input
          type="text"
          placeholder="Search by Order # (e.g. SM10440), customer name, phone, city, or AWB tracking..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 shadow-xs focus:border-brand-600 focus:outline-none"
        />
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Order # & Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Total & Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-500">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const addr = (order.addressSnapshot as any) || {};
                  const createdDate = new Date(order.createdAt).toLocaleDateString(
                    "en-IN",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );
                  const totalItemsQty = order.items.reduce(
                    (sum, i) => sum + i.qty,
                    0
                  );

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-muted/50 transition-colors"
                    >
                      {/* Order ID & Date */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-brand-700 hover:underline"
                        >
                          #{order.id}
                        </Link>
                        <div className="text-xs text-ink-500 mt-0.5">
                          {createdDate}
                        </div>
                        {order.awb && (
                          <div className="mt-1 font-mono text-[11px] text-ink-600">
                            AWB: <span className="font-semibold">{order.awb}</span>
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink-900">
                          {order.user.name}
                        </div>
                        <div className="text-xs text-ink-500 font-mono">
                          {order.user.phone}
                        </div>
                        <div className="text-xs text-ink-400">
                          {addr.city ? `${addr.city}, ${addr.state || ""}` : "—"}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {order.items.slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                className="relative size-8 shrink-0 overflow-hidden rounded-full border border-surface bg-surface-muted"
                              >
                                <Image
                                  src={item.image || "/images/products/backpack.jpg"}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="32px"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="text-xs text-ink-600">
                            <span className="font-bold text-ink-900">
                              {totalItemsQty}
                            </span>{" "}
                            {totalItemsQty === 1 ? "item" : "items"}
                          </div>
                        </div>
                        <div className="mt-1 max-w-[200px] truncate text-[11px] text-ink-500">
                          {order.items.map((i) => i.name).join(", ")}
                        </div>
                      </td>

                      {/* Total & Payment */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-ink-900">
                          {inr(order.totalPaise)}
                        </div>
                        <div className="mt-0.5 inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-600 border border-border">
                          {order.paymentMethod === "cod" ? "Cash on Delivery" : "Prepaid (Razorpay)"}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusPill status={order.status} />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-xs hover:border-brand-600 hover:text-brand-600 transition-colors"
                        >
                          <span>Manage</span>
                          <span>→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
