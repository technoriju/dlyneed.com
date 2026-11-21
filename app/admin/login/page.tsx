"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import { LockIcon } from "@/components/layout/icons";
import { btnPrimary } from "@/components/ui/button";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passcode.trim()) {
      setError("Please enter the admin passcode");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid passcode");
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-7 shadow-lg">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <LockIcon size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">
            ShopMate Admin
          </h1>
          <p className="mt-1 text-xs text-ink-500">
            Enter your secret administrative passcode to proceed
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 rounded-lg bg-bad/10 p-3 text-xs font-semibold text-bad">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="passcode"
              className="block text-xs font-semibold uppercase tracking-wider text-ink-700"
            >
              Admin Passcode
            </label>
            <input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError(null);
              }}
              placeholder="e.g. admin123"
              autoFocus
              className="h-11 w-full rounded-lg border border-border-strong bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
            />
            <span className="text-[11px] text-ink-400">
              Default development passcode: <code>admin123</code>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${btnPrimary} w-full cursor-pointer disabled:opacity-50`}
          >
            {loading ? "Authenticating..." : "Sign In to Admin Console"}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-ink-500 hover:text-brand-600 transition-colors"
          >
            ← Back to Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
