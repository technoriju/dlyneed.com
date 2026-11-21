import React from "react";

export type OrderStatusType =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURNED"
  | "REFUNDED"
  | "PAYMENT_FAILED";

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  CONFIRMED: { label: "Confirmed", className: "bg-warn/15 text-warn" },
  PACKED: { label: "Packed", className: "bg-warn/15 text-warn" },
  SHIPPED: { label: "Shipped", className: "bg-info/15 text-info" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", className: "bg-info/15 text-info" },
  DELIVERED: { label: "Delivered", className: "bg-ok/15 text-ok" },
  CANCELLED: { label: "Cancelled", className: "bg-bad/15 text-bad" },
  RETURN_REQUESTED: { label: "Return requested", className: "bg-surface-muted text-ink-700 border border-border" },
  RETURNED: { label: "Returned", className: "bg-surface-muted text-ink-700 border border-border" },
  REFUNDED: { label: "Refunded", className: "bg-surface-muted text-ink-700 border border-border" },
  PAYMENT_FAILED: { label: "Payment failed", className: "bg-bad/15 text-bad" },
  PENDING_PAYMENT: { label: "Pending payment", className: "bg-warn/15 text-warn" },
};

export function StatusPill({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || {
    label: status.replace(/_/g, " "),
    className: "bg-surface-muted text-ink-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}
