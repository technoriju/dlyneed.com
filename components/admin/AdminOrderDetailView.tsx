"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { StatusPill } from "@/components/account/StatusPill";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui/button";
import { inr } from "@/lib/format";

export interface AdminOrderDetail {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
  status: string;
  delivery: string;
  paymentMethod: string;
  subtotalPaise: number;
  discountPaise: number;
  couponCode: string | null;
  shippingPaise: number;
  feesPaise: number;
  totalPaise: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  awb: string | null;
  createdAt: string | Date;
  addressSnapshot: any;
  items: Array<{
    id: string;
    variantId: string;
    name: string;
    option: string | null;
    image: string;
    unitPaise: number;
    qty: number;
  }>;
  events: Array<{
    id: string;
    status: string;
    note: string | null;
    at: string | Date;
  }>;
}

interface AdminOrderDetailViewProps {
  initialOrder: AdminOrderDetail;
}

export function AdminOrderDetailView({
  initialOrder,
}: AdminOrderDetailViewProps) {
  const router = useRouter();
  const [order, setOrder] = useState<AdminOrderDetail>(initialOrder);
  const [loadingAction, setLoadingAction] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Ship Modal State
  const [isShipModalOpen, setIsShipModalOpen] = useState(false);
  const [awbInput, setAwbInput] = useState(order.awb || "");
  const [courierName, setCourierName] = useState("BlueDart");

  // Custom Status Transition State
  const [customStatus, setCustomStatus] = useState(order.status);
  const [customNote, setCustomNote] = useState("");

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpdateStatus = async (
    targetStatus: string,
    note?: string,
    awb?: string
  ) => {
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          note: note || `Order updated to ${targetStatus} by admin`,
          awb: awb || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setOrder(data.order);
      setIsShipModalOpen(false);
      notify("success", `Order status updated to ${targetStatus}`);
      router.refresh();
    } catch (err: any) {
      notify("error", err.message || "Failed to update order status");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleProcessRefund = async () => {
    if (
      !confirm(
        `Are you sure you want to process a full refund of ${inr(
          order.totalPaise
        )} for Order #${order.id}? If items were returned or cancelled, inventory will be restocked.`
      )
    ) {
      return;
    }

    setLoadingAction(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/refund`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process refund");

      setOrder(data.order);
      notify("success", `Refund processed successfully: ${data.refundId}`);
      router.refresh();
    } catch (err: any) {
      notify("error", err.message || "Failed to process refund");
    } finally {
      setLoadingAction(false);
    }
  };

  const addr = (order.addressSnapshot as any) || {};

  return (
    <div className="flex-1 p-4 sm:p-8 space-y-6">
      {/* Notification banner */}
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

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-ink-500 mb-1">
            <Link
              href="/admin/orders"
              className="text-brand-600 hover:underline flex items-center gap-1"
            >
              <span>← Orders</span>
            </Link>
            <span>/</span>
            <span className="font-mono font-semibold">#{order.id}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 font-mono">
              Order #{order.id}
            </h1>
            <StatusPill status={order.status} />
          </div>
          <p className="text-xs text-ink-500 mt-1">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Action Controls for Quick Status Progression */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === "CONFIRMED" && (
            <button
              type="button"
              disabled={loadingAction}
              onClick={() => handleUpdateStatus("PACKED", "Order packed in warehouse")}
              className={`${btnPrimary} !py-2 text-xs`}
            >
              📦 Mark as Packed
            </button>
          )}

          {order.status === "PACKED" && (
            <button
              type="button"
              disabled={loadingAction}
              onClick={() => setIsShipModalOpen(true)}
              className={`${btnPrimary} !py-2 text-xs`}
            >
              🚚 Dispatch & Ship Order
            </button>
          )}

          {order.status === "SHIPPED" && (
            <>
              <button
                type="button"
                disabled={loadingAction}
                onClick={() =>
                  handleUpdateStatus(
                    "OUT_FOR_DELIVERY",
                    "Package out for delivery with local courier"
                  )
                }
                className={`${btnSecondary} !py-2 text-xs`}
              >
                🚴 Out for Delivery
              </button>
              <button
                type="button"
                disabled={loadingAction}
                onClick={() =>
                  handleUpdateStatus(
                    "DELIVERED",
                    "Shipment successfully delivered to recipient"
                  )
                }
                className={`${btnPrimary} !py-2 text-xs`}
              >
                ✅ Mark as Delivered
              </button>
            </>
          )}

          {order.status === "OUT_FOR_DELIVERY" && (
            <button
              type="button"
              disabled={loadingAction}
              onClick={() =>
                handleUpdateStatus(
                  "DELIVERED",
                  "Shipment successfully delivered to recipient"
                )
              }
              className={`${btnPrimary} !py-2 text-xs`}
            >
              ✅ Mark as Delivered
            </button>
          )}

          {(order.status === "RETURN_REQUESTED" ||
            order.status === "CANCELLED" ||
            (order.status === "DELIVERED" && order.paymentMethod !== "cod")) && (
            <button
              type="button"
              disabled={loadingAction}
              onClick={handleProcessRefund}
              className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              💸 Process Refund
            </button>
          )}

          {order.status === "REFUNDED" && (
            <span className="rounded-lg bg-ok/10 border border-ok/20 px-3 py-2 text-xs font-semibold text-ok">
              ✓ Refund Processed
            </span>
          )}

          {order.status !== "DELIVERED" &&
            order.status !== "CANCELLED" &&
            order.status !== "REFUNDED" && (
              <button
                type="button"
                disabled={loadingAction}
                onClick={() => {
                  if (
                    confirm(
                      "Cancel this order? Order items will automatically be restocked into inventory."
                    )
                  ) {
                    handleUpdateStatus(
                      "CANCELLED",
                      "Order cancelled by admin (stock restored)"
                    );
                  }
                }}
                className={`${btnDanger} !py-2 text-xs`}
              >
                Cancel Order
              </button>
            )}
        </div>
      </div>

      {/* Grid: Details & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Items & Audit Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-ink-900">
              Ordered Items ({order.items.length})
            </h2>

            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
                    <Image
                      src={item.image || "/images/products/backpack.jpg"}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-ink-900 text-sm truncate">
                      {item.name}
                    </h3>
                    {item.option && (
                      <p className="text-xs text-ink-500">
                        Option: <span className="font-medium">{item.option}</span>
                      </p>
                    )}
                    <p className="text-xs text-ink-500 mt-0.5">
                      {item.qty} × {inr(item.unitPaise)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-ink-900 text-sm">
                      {inr(item.unitPaise * item.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-border pt-4 space-y-2 text-sm text-ink-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-medium text-ink-900">
                  {inr(order.subtotalPaise)}
                </span>
              </div>
              {order.discountPaise > 0 && (
                <div className="flex justify-between text-ok">
                  <span>
                    Coupon Discount{" "}
                    {order.couponCode && (
                      <span className="font-mono font-bold">({order.couponCode})</span>
                    )}
                  </span>
                  <span className="font-medium">-{inr(order.discountPaise)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping ({order.delivery})</span>
                <span className="font-medium text-ink-900">
                  {order.shippingPaise === 0 ? "Free" : inr(order.shippingPaise)}
                </span>
              </div>
              {order.feesPaise > 0 && (
                <div className="flex justify-between">
                  <span>Handling & Payment Fees</span>
                  <span className="font-medium text-ink-900">
                    {inr(order.feesPaise)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-ink-900">
                <span>Grand Total</span>
                <span className="text-brand-700">{inr(order.totalPaise)}</span>
              </div>
            </div>
          </div>

          {/* Event Audit History Timeline */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-ink-900">
              Order Event History & Tracking
            </h2>

            <div className="relative border-l-2 border-border ml-3 space-y-6 pl-5">
              {order.events.map((ev, idx) => {
                const dateStr = new Date(ev.at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <div key={ev.id || idx} className="relative">
                    <span className="absolute -left-[27px] top-1 size-3.5 rounded-full border-2 border-surface bg-brand-600" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-ink-900">
                          {ev.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-ink-400 font-mono">
                          {dateStr}
                        </span>
                      </div>
                      {ev.note && (
                        <p className="text-xs text-ink-600 mt-0.5">{ev.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Delivery Info & Admin Override */}
        <div className="space-y-6">
          {/* Customer & Shipping Card */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-ink-900">
              Customer & Delivery
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-ink-500 block">Customer Name</span>
                <span className="font-semibold text-ink-900">
                  {order.user.name}
                </span>
              </div>

              <div>
                <span className="text-xs text-ink-500 block">Phone</span>
                <span className="font-mono text-ink-900">{order.user.phone}</span>
              </div>

              {order.user.email && (
                <div>
                  <span className="text-xs text-ink-500 block">Email</span>
                  <span className="text-ink-900">{order.user.email}</span>
                </div>
              )}

              <div className="border-t border-border pt-3">
                <span className="text-xs text-ink-500 block mb-1">
                  Shipping Address ({addr.type || "Delivery"})
                </span>
                <p className="text-ink-800 text-xs leading-relaxed">
                  <span className="font-semibold">{addr.name || order.user.name}</span>
                  <br />
                  {addr.line1}
                  {addr.line2 && <><br />{addr.line2}</>}
                  <br />
                  {addr.city}, {addr.state} - {addr.pincode}
                </p>
              </div>

              <div className="border-t border-border pt-3">
                <span className="text-xs text-ink-500 block">Delivery Method</span>
                <span className="font-medium text-ink-900 capitalize">
                  {order.delivery} Delivery
                </span>
              </div>

              <div>
                <span className="text-xs text-ink-500 block">Payment Method</span>
                <div className="mt-1 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-800">
                  {order.paymentMethod === "cod" ? "💵 Cash on Delivery" : "💳 Prepaid Razorpay"}
                </div>
              </div>

              {order.razorpayPaymentId && (
                <div>
                  <span className="text-xs text-ink-500 block">
                    Razorpay Payment ID
                  </span>
                  <span className="font-mono text-xs text-ink-700">
                    {order.razorpayPaymentId}
                  </span>
                </div>
              )}

              {order.awb && (
                <div className="rounded-lg bg-info/10 border border-info/20 p-3">
                  <span className="text-xs text-info font-bold block uppercase tracking-wider">
                    Courier AWB Tracking
                  </span>
                  <span className="font-mono font-bold text-ink-900 text-sm mt-0.5 block">
                    {order.awb}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Manual Admin Status Override Card */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-ink-900">
              Admin Status Override
            </h2>
            <p className="text-xs text-ink-500">
              Manually advance or adjust order state with custom audit log note.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">
                  Change Status
                </label>
                <select
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-muted p-2 text-xs font-medium text-ink-900 focus:border-brand-600 focus:outline-none"
                >
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PACKED">PACKED</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="RETURN_REQUESTED">RETURN_REQUESTED</option>
                  <option value="RETURNED">RETURNED</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">
                  Audit Log Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Package collected by customer at hub"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-muted p-2 text-xs text-ink-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <button
                type="button"
                disabled={loadingAction || customStatus === order.status}
                onClick={() => handleUpdateStatus(customStatus, customNote)}
                className="w-full rounded-lg bg-ink-900 py-2 text-xs font-semibold text-white hover:bg-black disabled:opacity-40 transition-colors cursor-pointer"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ship Order Modal */}
      {isShipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-ink-900">
              Ship Order #{order.id}
            </h3>
            <p className="text-xs text-ink-500">
              Enter the carrier tracking AWB number. The customer will be able to track their package.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">
                  Courier / Logistics Partner
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-muted p-2 text-xs text-ink-900 focus:border-brand-600 focus:outline-none"
                >
                  <option value="BlueDart">BlueDart Express</option>
                  <option value="Delhivery">Delhivery</option>
                  <option value="Shadowfax">Shadowfax</option>
                  <option value="DTDC">DTDC</option>
                  <option value="India Post">India Post Speed Post</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-700 block mb-1">
                  AWB Tracking Number <span className="text-bad">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BD-98237498"
                  value={awbInput}
                  onChange={(e) => setAwbInput(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface-muted p-2 font-mono text-sm text-ink-900 focus:border-brand-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsShipModalOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-ink-700 hover:bg-surface-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loadingAction || !awbInput.trim()}
                onClick={() =>
                  handleUpdateStatus(
                    "SHIPPED",
                    `Dispatched with ${courierName} (AWB: ${awbInput.trim()})`,
                    awbInput.trim()
                  )
                }
                className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
              >
                Confirm Shipment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
