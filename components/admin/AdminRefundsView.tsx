"use client";

import Link from "next/link";
import React, { useState } from "react";
import { StatusPill } from "@/components/account/StatusPill";
import { inr } from "@/lib/format";

export interface AdminRefundOrder {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  status: string;
  paymentMethod: string;
  totalPaise: number;
  razorpayPaymentId: string | null;
  createdAt: string | Date;
  events: Array<{
    status: string;
    note: string | null;
    at: string | Date;
  }>;
}

interface AdminRefundsViewProps {
  initialOrders: AdminRefundOrder[];
}

export function AdminRefundsView({ initialOrders }: AdminRefundsViewProps) {
  const [orders, setOrders] = useState<AdminRefundOrder[]>(initialOrders);
  const [tab, setTab] = useState<"pending" | "refunded" | "all">("pending");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const pendingOrders = orders.filter(
    (o) => o.status === "RETURN_REQUESTED" || (o.status === "CANCELLED" && o.paymentMethod !== "cod")
  );
  const refundedOrders = orders.filter((o) => o.status === "REFUNDED");

  const pendingAmountPaise = pendingOrders.reduce((sum, o) => sum + o.totalPaise, 0);
  const refundedAmountPaise = refundedOrders.reduce((sum, o) => sum + o.totalPaise, 0);

  const displayed = orders.filter((o) => {
    if (tab === "pending") {
      if (o.status !== "RETURN_REQUESTED" && !(o.status === "CANCELLED" && o.paymentMethod !== "cod")) {
        return false;
      }
    } else if (tab === "refunded") {
      if (o.status !== "REFUNDED") return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchName = o.user.name.toLowerCase().includes(q);
      const matchPhone = o.user.phone.includes(q);
      if (!matchId && !matchName && !matchPhone) return false;
    }
    return true;
  });

  const handleProcessRefund = async (order: AdminRefundOrder) => {
    const isRazorpay = order.paymentMethod !== "cod" && order.razorpayPaymentId;
    const confirmMsg = isRazorpay
      ? `Process Razorpay online refund of ${inr(order.totalPaise)} to ${order.user.name} for Order #${order.id}?`
      : `Mark offline/COD refund of ${inr(order.totalPaise)} as processed for Order #${order.id}?`;

    if (!confirm(confirmMsg)) return;

    setProcessingId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process refund");

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "REFUNDED" } : o))
      );
      notify("success", `Refund processed: ${data.refundId}`);
    } catch (err: any) {
      notify("error", err.message || "Failed to process refund");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 space-y-6">
      {/* Top Notification */}
      {notification && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium ${
            notification.type === "success"
              ? "bg-ok/10 text-ok border border-ok/20"
              : "bg-bad/10 text-bad border border-bad/20"
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            Refunds & Return Approvals
          </h1>
          <p className="text-sm text-ink-500">
            Process customer return requests, execute Razorpay automated refunds, and restock goods.
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2 text-center">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-amber-800">
              Pending Actions
            </span>
            <span className="text-lg font-bold text-amber-900 font-mono">
              {inr(pendingAmountPaise)} ({pendingOrders.length})
            </span>
          </div>
          <div className="rounded-xl border border-ok/30 bg-ok/10 px-4 py-2 text-center">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-ok">
              Total Refunded
            </span>
            <span className="text-lg font-bold text-ok font-mono">
              {inr(refundedAmountPaise)} ({refundedOrders.length})
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            tab === "pending"
              ? "bg-brand-600 text-white"
              : "text-ink-600 hover:bg-surface-muted"
          }`}
        >
          Pending Attention ({pendingOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("refunded")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            tab === "refunded"
              ? "bg-brand-600 text-white"
              : "text-ink-600 hover:bg-surface-muted"
          }`}
        >
          Completed Refunds ({refundedOrders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
            tab === "all"
              ? "bg-brand-600 text-white"
              : "text-ink-600 hover:bg-surface-muted"
          }`}
        >
          All ({orders.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-ink-400">🔍</span>
        <input
          type="text"
          placeholder="Search by Order # or customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-sm text-ink-900 placeholder:text-ink-400 shadow-xs focus:border-brand-600 focus:outline-none"
        />
      </div>

      {/* Refunds Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Order # & Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Payment Info</th>
                <th className="px-4 py-3">Refund Amount</th>
                <th className="px-4 py-3">Latest Note / Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-500">
                    No refund records found for this view.
                  </td>
                </tr>
              ) : (
                displayed.map((order) => {
                  const latestEvent = order.events?.[0];
                  const isProcessing = processingId === order.id;
                  const isRefunded = order.status === "REFUNDED";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-surface-muted/50 transition-colors"
                    >
                      {/* Order # */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-mono font-bold text-brand-700 hover:underline"
                        >
                          #{order.id}
                        </Link>
                        <div className="text-xs text-ink-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-ink-900">
                          {order.user.name}
                        </div>
                        <div className="text-xs text-ink-500 font-mono">
                          {order.user.phone}
                        </div>
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-xs text-ink-800">
                          {order.paymentMethod === "cod"
                            ? "Cash on Delivery"
                            : "Prepaid Razorpay"}
                        </div>
                        {order.razorpayPaymentId && (
                          <div className="font-mono text-[11px] text-ink-500">
                            {order.razorpayPaymentId}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-ink-900 font-mono">
                          {inr(order.totalPaise)}
                        </span>
                      </td>

                      {/* Note */}
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-xs text-ink-600 truncate">
                          {latestEvent?.note || "—"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusPill status={order.status} />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right">
                        {isRefunded ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ok">
                            <span>✓</span>
                            <span>Completed</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleProcessRefund(order)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition-colors"
                          >
                            <span>💸 Process Refund</span>
                          </button>
                        )}
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
