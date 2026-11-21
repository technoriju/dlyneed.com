"use client";

import Link from "next/link";
import React, { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { BoxIcon, HeartIcon } from "@/components/layout/icons";
import { btnPrimary } from "@/components/ui/button";
import { useToast } from "@/components/ui/Toast";
import { fmtDate } from "@/lib/format";

interface ProfileViewProps {
  initialUser: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    createdAt?: Date | string;
  };
  orderCount: number;
}

export function ProfileView({ initialUser, orderCount }: ProfileViewProps) {
  const { wishlistCount } = useCart();
  const { showToast } = useToast();

  const [name, setName] = useState(initialUser.name);
  const [email, setEmail] = useState(initialUser.email || "");
  const [gender, setGender] = useState("");
  const [newsletter, setNewsletter] = useState(true);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cleanPhone = initialUser.phone.replace(/^\+91/, "");
  const memberSince = initialUser.createdAt
    ? fmtDate(initialUser.createdAt, { month: "long", year: "numeric" })
    : "November 2026";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setEmailError(null);

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setNameError("Full name must be at least 2 characters.");
      return;
    }

    const trimmedEmail = email.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update profile");
        return;
      }

      showToast("Profile saved");
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4.5">
        <h1 className="text-[clamp(24px,3.2vw,30px)] font-bold tracking-tight text-ink-900">
          Profile
        </h1>
        <p className="mt-1 text-sm text-ink-500">Member since {memberSince}</p>
      </div>

      {/* Profile Form Panel */}
      <section className="rounded-xl border border-border bg-surface p-5.5 shadow-sm">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="u-name" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
              Full name
            </label>
            <input
              id="u-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              className={`h-11 rounded-lg border bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600 ${
                nameError ? "border-bad" : "border-border-strong"
              }`}
            />
            {nameError && <span className="text-xs text-bad">{nameError}</span>}
          </div>

          {/* Mobile number (read-only) */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="u-phone" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
              Mobile number
            </label>
            <div className="flex h-11 items-center rounded-lg border border-border bg-surface-muted px-3.5 text-sm text-ink-700">
              <span className="font-medium text-ink-500 mr-2">+91</span>
              <input
                id="u-phone"
                type="text"
                value={cleanPhone}
                readOnly
                aria-describedby="u-phone-h"
                className="w-full bg-transparent font-medium text-ink-900 outline-none cursor-default"
              />
            </div>
            <span id="u-phone-h" className="text-xs text-ink-500">
              Verified. To change it, contact support.
            </span>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="u-email" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
              Email
            </label>
            <input
              id="u-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
              placeholder="you@example.com"
              className={`h-11 rounded-lg border bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600 ${
                emailError ? "border-bad" : "border-border-strong"
              }`}
            />
            {emailError && <span className="text-xs text-bad">{emailError}</span>}
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="u-gender" className="text-xs font-semibold text-ink-700 uppercase tracking-wider">
              Gender <span className="font-normal text-ink-500 normal-case">(optional)</span>
            </label>
            <select
              id="u-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="h-11 rounded-lg border border-border-strong bg-surface px-3.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-600 focus:ring-1 focus:ring-brand-600 cursor-pointer"
            >
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Newsletter check */}
          <div className="sm:col-span-2 mt-1">
            <label className="flex items-center gap-2.5 text-sm text-ink-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="size-4 rounded border-border-strong text-brand-600 accent-brand-600 focus:ring-brand-500"
              />
              <span>Send me offers and new arrivals by email</span>
            </label>
          </div>

          {/* Submit */}
          <div className="sm:col-span-2 mt-2">
            <button
              type="submit"
              disabled={saving}
              className={`${btnPrimary} min-w-[140px] cursor-pointer disabled:opacity-50`}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>

      {/* Quick link cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/account/orders"
          className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-brand-500 hover:shadow-sm"
        >
          <b className="flex items-center gap-2 text-base font-semibold text-ink-900 group-hover:text-brand-600">
            <BoxIcon size={20} className="text-brand-600" />
            <span>{orderCount} order{orderCount === 1 ? "" : "s"}</span>
          </b>
          <span className="mt-1 text-sm text-ink-500">Track, return or buy again</span>
        </Link>

        <Link
          href="/account/wishlist"
          className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4.5 transition-all hover:border-brand-500 hover:shadow-sm"
        >
          <b className="flex items-center gap-2 text-base font-semibold text-ink-900 group-hover:text-brand-600">
            <HeartIcon size={20} className="text-brand-600" />
            <span>{wishlistCount} saved item{wishlistCount === 1 ? "" : "s"}</span>
          </b>
          <span className="mt-1 text-sm text-ink-500">Your wishlist</span>
        </Link>
      </div>
    </div>
  );
}
