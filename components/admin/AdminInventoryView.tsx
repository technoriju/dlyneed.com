"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { btnPrimary, btnSecondary } from "@/components/ui/button";

export interface AdminVariantItem {
  id: string;
  sku: string;
  value: string;
  stock: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: any;
    isActive: boolean;
    optionName?: string | null;
    category: {
      name: string;
    };
  };
}

interface AdminInventoryViewProps {
  initialVariants: AdminVariantItem[];
}

export function AdminInventoryView({ initialVariants }: AdminInventoryViewProps) {
  const [variants, setVariants] = useState<AdminVariantItem[]>(initialVariants);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editStockMap, setEditStockMap] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const filtered = variants.filter((v) => {
    if (lowStockOnly && v.stock > 5) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchSku = v.sku.toLowerCase().includes(q);
      const matchVal = v.value.toLowerCase().includes(q);
      const matchProd = v.product.name.toLowerCase().includes(q);
      if (!matchSku && !matchVal && !matchProd) return false;
    }
    return true;
  });

  const lowStockCount = variants.filter((v) => v.stock <= 5).length;
  const outOfStockCount = variants.filter((v) => v.stock === 0).length;

  const handleDelta = async (variantId: string, delta: number) => {
    setUpdatingId(variantId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, delta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, stock: data.variant.stock } : v))
      );
      notify("success", `Stock updated to ${data.variant.stock}`);
    } catch (err: any) {
      notify("error", err.message || "Failed to update stock");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDirectSave = async (variantId: string) => {
    const rawVal = editStockMap[variantId];
    if (rawVal === undefined) return;
    const stock = parseInt(rawVal, 10);
    if (isNaN(stock) || stock < 0) {
      notify("error", "Stock must be a positive number or zero");
      return;
    }

    setUpdatingId(variantId);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId, stock }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, stock: data.variant.stock } : v))
      );
      setEditStockMap((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      notify("success", `Stock set to ${data.variant.stock}`);
    } catch (err: any) {
      notify("error", err.message || "Failed to set stock");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 space-y-6">
      {/* Top Banner Alert */}
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
            Inventory & Stock
          </h1>
          <p className="text-sm text-ink-500">
            Track variant SKUs, replenish quantities, and manage low-stock alerts.
          </p>
        </div>

        {/* Quick Stock Status Stats */}
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
            <span className="block text-xs text-ink-500">Low Stock</span>
            <span className="text-base font-bold text-amber-600">
              {lowStockCount}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
            <span className="block text-xs text-ink-500">Out of Stock</span>
            <span className="text-base font-bold text-bad">{outOfStockCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-ink-400">🔍</span>
          <input
            type="text"
            placeholder="Search by SKU, product name, or variant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-surface-muted pl-9 pr-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:bg-surface focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-xs font-semibold transition-colors ${
            lowStockOnly
              ? "border-amber-500 bg-amber-50 text-amber-800"
              : "border-border bg-surface text-ink-700 hover:bg-surface-muted"
          }`}
        >
          <span>⚠️ Low Stock Only (≤ 5)</span>
          {lowStockOnly && <span className="text-amber-600">✓</span>}
        </button>
      </div>

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Product & Variant</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3 text-right">Quick Adjust</th>
                <th className="px-4 py-3 text-right">Direct Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-500">
                    No variants found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const isUpdating = updatingId === v.id;
                  const isLow = v.stock <= 5 && v.stock > 0;
                  const isOut = v.stock === 0;
                  const firstImg =
                    Array.isArray(v.product.images) && v.product.images.length > 0
                      ? v.product.images[0]
                      : "/images/products/backpack.jpg";

                  const directValue =
                    editStockMap[v.id] !== undefined
                      ? editStockMap[v.id]
                      : v.stock.toString();

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-surface-muted/50 transition-colors"
                    >
                      {/* Product & Variant */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
                            <Image
                              src={firstImg}
                              alt={v.product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/products/${v.product.slug}`}
                              target="_blank"
                              className="font-medium text-ink-900 hover:text-brand-600 transition-colors"
                            >
                              {v.product.name}
                            </Link>
                            <div className="text-xs text-ink-500">
                              {v.product.optionName || "Option"}:{" "}
                              <span className="font-semibold text-ink-700">
                                {v.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-ink-700">
                        {v.sku}
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 text-xs text-ink-600">
                        {v.product.category.name}
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isOut
                                ? "bg-bad/10 text-bad"
                                : isLow
                                ? "bg-amber-100 text-amber-800"
                                : "bg-ok/10 text-ok"
                            }`}
                          >
                            {v.stock} units
                          </span>
                          {isOut && (
                            <span className="text-[11px] font-semibold text-bad">
                              Out of stock
                            </span>
                          )}
                          {isLow && (
                            <span className="text-[11px] font-semibold text-amber-600">
                              Low stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Quick Adjust */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={isUpdating || v.stock === 0}
                            onClick={() => handleDelta(v.id, -1)}
                            className="size-7 rounded border border-border bg-surface text-xs font-bold text-ink-700 hover:bg-surface-muted disabled:opacity-40 transition-colors cursor-pointer"
                            title="Decrement 1"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleDelta(v.id, 1)}
                            className="size-7 rounded border border-border bg-surface text-xs font-bold text-brand-600 hover:bg-brand-50 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Increment 1"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleDelta(v.id, 5)}
                            className="size-7 rounded border border-border bg-surface text-xs font-bold text-brand-600 hover:bg-brand-50 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Increment 5"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleDelta(v.id, 10)}
                            className="size-7 rounded border border-border bg-surface text-xs font-bold text-brand-600 hover:bg-brand-50 disabled:opacity-40 transition-colors cursor-pointer"
                            title="Increment 10"
                          >
                            +10
                          </button>
                        </div>
                      </td>

                      {/* Direct Edit */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <input
                            type="number"
                            min="0"
                            value={directValue}
                            onChange={(e) =>
                              setEditStockMap({
                                ...editStockMap,
                                [v.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleDirectSave(v.id);
                            }}
                            className="w-16 rounded border border-border px-2 py-1 text-right text-xs font-semibold text-ink-900 focus:border-brand-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleDirectSave(v.id)}
                            className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
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
