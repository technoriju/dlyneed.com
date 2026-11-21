"use client";

import React, { useState } from "react";
import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui/button";
import { inr } from "@/lib/format";

export interface AdminCouponItem {
  code: string;
  type: string; // percent | flat
  value: number; // percent e.g. 10 or flat in paise e.g. 20000
  maxDiscountPaise: number | null;
  minOrderPaise: number;
  isActive: boolean;
  expiresAt: string | Date | null;
  perUserLimit: number;
}

interface AdminCouponsViewProps {
  initialCoupons: AdminCouponItem[];
}

export function AdminCouponsView({ initialCoupons }: AdminCouponsViewProps) {
  const [coupons, setCoupons] = useState<AdminCouponItem[]>(initialCoupons);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [type, setType] = useState<"percent" | "flat">("percent");
  const [value, setValue] = useState("10"); // percent e.g. 10 or flat in rupees e.g. 200
  const [minOrderInr, setMinOrderInr] = useState("499");
  const [maxDiscountInr, setMaxDiscountInr] = useState("500");
  const [expiresAt, setExpiresAt] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const notify = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const filtered = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = coupons.filter((c) => c.isActive).length;

  const openCreateModal = () => {
    setCode("");
    setType("percent");
    setValue("10");
    setMinOrderInr("499");
    setMaxDiscountInr("500");
    setExpiresAt("");
    setPerUserLimit("1");
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode || cleanCode.length < 3) {
      setFormError("Code must be at least 3 characters");
      return;
    }

    const numVal = parseInt(value, 10);
    if (isNaN(numVal) || numVal <= 0) {
      setFormError("Discount value must be a positive integer");
      return;
    }

    // In DB: percent is stored as integer (e.g. 10 = 10%), flat is stored in paise (e.g. ₹200 = 20000 paise)
    const storedValue = type === "flat" ? numVal * 100 : numVal;
    const minOrderPaise = minOrderInr ? parseInt(minOrderInr, 10) * 100 : 0;
    const maxDiscountPaise =
      type === "percent" && maxDiscountInr
        ? parseInt(maxDiscountInr, 10) * 100
        : null;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          type,
          value: storedValue,
          minOrderPaise,
          maxDiscountPaise,
          expiresAt: expiresAt || null,
          perUserLimit: parseInt(perUserLimit, 10) || 1,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create coupon");

      setCoupons((prev) => [data.coupon, ...prev]);
      setIsModalOpen(false);
      notify("success", `Coupon "${cleanCode}" created successfully!`);
    } catch (err: any) {
      setFormError(err.message || "Failed to create coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (coupon: AdminCouponItem) => {
    setActionInProgress(coupon.code);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: coupon.code,
          isActive: !coupon.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update coupon");

      setCoupons((prev) =>
        prev.map((c) => (c.code === coupon.code ? data.coupon : c))
      );
      notify(
        "success",
        `Coupon "${coupon.code}" is now ${
          !coupon.isActive ? "active" : "inactive"
        }`
      );
    } catch (err: any) {
      notify("error", err.message || "Failed to toggle status");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) {
      return;
    }

    setActionInProgress(couponCode);
    try {
      const res = await fetch(
        `/api/admin/coupons?code=${encodeURIComponent(couponCode)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete coupon");

      setCoupons((prev) => prev.filter((c) => c.code !== couponCode));
      notify("success", `Coupon "${couponCode}" deleted`);
    } catch (err: any) {
      notify("error", err.message || "Failed to delete coupon");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-8 space-y-6">
      {/* Top Banner */}
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
            Coupons & Discounts
          </h1>
          <p className="text-sm text-ink-500">
            Create promotional discount codes, set order value caps, and control expiration dates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border bg-surface px-3 py-2 text-center">
            <span className="block text-xs text-ink-500">Active</span>
            <span className="text-base font-bold text-ok">{activeCount}</span>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className={`${btnPrimary} flex items-center gap-1.5`}
          >
            <span>+</span>
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-ink-400">🔍</span>
        <input
          type="text"
          placeholder="Search coupons by code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface pl-9 pr-4 py-2 text-sm text-ink-900 placeholder:text-ink-400 shadow-xs focus:border-brand-600 focus:outline-none"
        />
      </div>

      {/* Coupons Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Max Discount</th>
                <th className="px-4 py-3">Expires At</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-ink-500">
                    No coupons found. Click &quot;+ Create Coupon&quot; to add one.
                  </td>
                </tr>
              ) : (
                filtered.map((coupon) => {
                  const isActing = actionInProgress === coupon.code;
                  const discountLabel =
                    coupon.type === "percent"
                      ? `${coupon.value}% OFF`
                      : `${inr(coupon.value)} FLAT OFF`;

                  const expiryStr = coupon.expiresAt
                    ? new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Never (No expiry)";

                  return (
                    <tr
                      key={coupon.code}
                      className="hover:bg-surface-muted/50 transition-colors"
                    >
                      {/* Code */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-200 bg-brand-50 px-2.5 py-1 font-mono text-xs font-bold text-brand-800">
                          🎟️ {coupon.code}
                        </span>
                        <div className="text-[11px] text-ink-400 mt-1">
                          Limit: {coupon.perUserLimit} per user
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-3 font-semibold text-ink-900">
                        {discountLabel}
                      </td>

                      {/* Min Order */}
                      <td className="px-4 py-3 text-ink-700">
                        {coupon.minOrderPaise > 0
                          ? inr(coupon.minOrderPaise)
                          : "None (₹0)"}
                      </td>

                      {/* Max Discount */}
                      <td className="px-4 py-3 text-ink-700">
                        {coupon.maxDiscountPaise
                          ? inr(coupon.maxDiscountPaise)
                          : "No cap"}
                      </td>

                      {/* Expires At */}
                      <td className="px-4 py-3 text-xs text-ink-600">
                        {expiryStr}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            coupon.isActive
                              ? "bg-ok/10 text-ok"
                              : "bg-surface-muted text-ink-400 border border-border"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleToggleActive(coupon)}
                            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-surface-muted disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            {coupon.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleDelete(coupon.code)}
                            className="rounded-md border border-bad/30 px-2 py-1 text-xs font-semibold text-bad hover:bg-bad/10 disabled:opacity-50 transition-colors cursor-pointer"
                            title="Delete coupon"
                          >
                            🗑️
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

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink-900">
                Create Discount Coupon
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-ink-400 hover:text-ink-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="rounded-lg bg-bad/10 p-3 text-xs font-medium text-bad border border-bad/20">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-ink-700 mb-1">
                  Coupon Code <span className="text-bad">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WELCOME10 or SAVE200"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded-md border border-border bg-surface-muted p-2 font-mono uppercase text-sm font-bold text-ink-900 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "percent" | "flat")
                    }
                    className="w-full rounded-md border border-border bg-surface-muted p-2 text-ink-900 focus:border-brand-600 focus:outline-none font-medium"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Rupee (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-ink-700 mb-1">
                    {type === "percent" ? "Percentage Value (%)" : "Flat Amount (₹)"}{" "}
                    <span className="text-bad">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={type === "percent" ? "10" : "200"}
                    className="w-full rounded-md border border-border bg-surface-muted p-2 font-bold text-ink-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrderInr}
                    onChange={(e) => setMinOrderInr(e.target.value)}
                    placeholder="499"
                    className="w-full rounded-md border border-border bg-surface-muted p-2 text-ink-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-700 mb-1">
                    Max Discount Cap (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={type === "flat"}
                    value={maxDiscountInr}
                    onChange={(e) => setMaxDiscountInr(e.target.value)}
                    placeholder={type === "flat" ? "N/A" : "500"}
                    className="w-full rounded-md border border-border bg-surface-muted p-2 text-ink-900 focus:border-brand-600 focus:outline-none disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-ink-700 mb-1">
                    Expiration Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface-muted p-2 text-ink-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-ink-700 mb-1">
                    Per User Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface-muted p-2 text-ink-900 focus:border-brand-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border text-brand-600 focus:ring-brand-600"
                />
                <label
                  htmlFor="couponActive"
                  className="text-xs font-semibold text-ink-800 cursor-pointer"
                >
                  Make coupon immediately active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-ink-700 hover:bg-surface-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
