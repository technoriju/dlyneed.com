"use client";

import Link from "next/link";
import React, { useState } from "react";
import { StatusPill } from "@/components/account/StatusPill";
import { fmtDate, inr } from "@/lib/format";

interface DashboardViewProps {
  initialData: {
    revenuePaise: number;
    totalOrders: number;
    statusCounts: Record<string, number>;
    products: {
      total: number;
      active: number;
      inactive: number;
    };
    lowStockVariants: Array<{
      id: string;
      sku: string;
      value: string;
      stock: number;
      product: { name: string; slug: string };
    }>;
    recentOrders: Array<{
      id: string;
      createdAt: string;
      totalPaise: number;
      status: string;
      paymentMethod: string;
      items: Array<{ name: string; qty: number }>;
    }>;
  };
}

export function DashboardView({ initialData }: DashboardViewProps) {
  const [data, setData] = useState(initialData);
  const [replenishing, setReplenishing] = useState<string | null>(null);

  const handleQuickAddStock = async (variantId: string) => {
    setReplenishing(variantId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, delta: 5 }),
      });
      if (res.ok) {
        setData((prev) => ({
          ...prev,
          lowStockVariants: prev.lowStockVariants
            .map((v) => (v.id === variantId ? { ...v, stock: v.stock + 5 } : v))
            .filter((v) => v.stock <= 5),
        }));
      }
    } finally {
      setReplenishing(null);
    }
  };

  return (
    <div className="space-y-7">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">
          Store Dashboard
        </h1>
        <p className="mt-1 text-xs text-ink-500">
          Real-time metrics, order progression, and inventory status
        </p>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Total Revenue
          </span>
          <b className="mt-2 block text-2xl font-bold text-ink-900">
            {inr(data.revenuePaise)}
          </b>
          <span className="mt-1 block text-[11px] text-ok font-medium">
            From confirmed &amp; delivered orders
          </span>
        </div>

        {/* Total Orders */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Total Orders
          </span>
          <b className="mt-2 block text-2xl font-bold text-ink-900">
            {data.totalOrders}
          </b>
          <div className="mt-1.5 flex flex-wrap gap-1 text-[11px]">
            <span className="rounded bg-warn/15 px-1.5 py-0.5 font-semibold text-warn">
              {data.statusCounts.CONFIRMED || 0} confirmed
            </span>
            <span className="rounded bg-info/15 px-1.5 py-0.5 font-semibold text-info">
              {data.statusCounts.SHIPPED || 0} shipped
            </span>
          </div>
        </div>

        {/* Catalog Products */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Catalog Products
          </span>
          <b className="mt-2 block text-2xl font-bold text-ink-900">
            {data.products.total}
          </b>
          <span className="mt-1 block text-[11px] text-ink-500">
            {data.products.active} active · {data.products.inactive} draft
          </span>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
            Low Stock Variants
          </span>
          <b
            className={`mt-2 block text-2xl font-bold ${
              data.lowStockVariants.length > 0 ? "text-warn" : "text-ink-900"
            }`}
          >
            {data.lowStockVariants.length}
          </b>
          <span className="mt-1 block text-[11px] text-ink-500">
            Variants with &le; 5 units remaining
          </span>
        </div>
      </div>

      {/* Two Column Section: Recent Orders & Low Stock Table */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              View all &rarr;
            </Link>
          </div>

          {data.recentOrders.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-bold text-ink-900 hover:text-brand-600"
                      >
                        {order.id}
                      </Link>
                      <StatusPill status={order.status} />
                    </div>
                    <span className="text-ink-500">
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                      {fmtDate(order.createdAt, { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  <div className="text-right">
                    <b className="block text-ink-900">{inr(order.totalPaise)}</b>
                    <span className="capitalize text-ink-500">
                      {order.paymentMethod}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-ink-500">
              No orders placed yet.
            </p>
          )}
        </div>

        {/* Low Stock Action Table */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink-900">
              Low Stock Warnings (&le; 5)
            </h2>
            <Link
              href="/admin/inventory"
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Manage stock &rarr;
            </Link>
          </div>

          {data.lowStockVariants.length > 0 ? (
            <div className="divide-y divide-border/60">
              {data.lowStockVariants.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between py-3 text-xs"
                >
                  <div>
                    <b className="block text-ink-900">{v.product.name}</b>
                    <span className="text-ink-500">
                      {v.value} · SKU: <code>{v.sku}</code>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded px-2 py-0.5 font-bold ${
                        v.stock === 0
                          ? "bg-bad/15 text-bad"
                          : "bg-warn/15 text-warn"
                      }`}
                    >
                      {v.stock} in stock
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickAddStock(v.id)}
                      disabled={replenishing === v.id}
                      className="cursor-pointer rounded border border-border px-2 py-1 text-[11px] font-semibold text-ink-700 hover:bg-surface-muted transition-colors"
                    >
                      {replenishing === v.id ? "..." : "+5"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-xs text-ok font-medium">
              ✓ All products have healthy stock levels (&gt; 5 units).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
