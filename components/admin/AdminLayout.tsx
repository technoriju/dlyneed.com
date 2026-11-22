"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import {
  BoxIcon,
  CartIcon,
  LockIcon,
  LogoutIcon,
} from "@/components/layout/icons";

interface AdminLayoutProps {
  children: React.ReactNode;
  username?: string;
}

export function AdminLayout({ children, username = "Admin" }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/products", label: "Products", icon: "📦" },
    { href: "/admin/inventory", label: "Inventory", icon: "📈" },
    { href: "/admin/orders", label: "Orders", icon: "🛒" },
    { href: "/admin/refunds", label: "Refunds", icon: "💸" },
    { href: "/admin/coupons", label: "Coupons", icon: "🎟️" },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {
      // Ignored
    }
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="-mx-3.5 sm:-mx-4 -mt-4 sm:-mt-7 -mb-[calc(76px+env(safe-area-inset-bottom,0px))] md:-mb-16 min-h-screen bg-surface-muted flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-50 flex h-14 sm:h-15 items-center justify-between border-b border-border bg-surface px-3 sm:px-8 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white text-sm">
              SM
            </span>
            <div className="leading-tight">
              <b className="block text-sm font-bold text-ink-900">ShopMate</b>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-medium text-ink-700 hover:bg-surface-muted transition-colors"
          >
            <span>View Storefront</span>
            <span className="text-ink-400">↗</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-ink-700">
            <span className="size-2 rounded-full bg-ok" />
            <span className="font-semibold">{username}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-2.5 sm:px-3 py-1.5 font-semibold text-bad hover:bg-bad/10 transition-colors"
          >
            <LogoutIcon size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col md:flex-row">
        {/* Sidebar Nav */}
        <nav
          aria-label="Admin Navigation"
          className="w-full shrink-0 border-b border-border bg-surface p-2.5 sm:p-3 md:w-56 md:border-b-0 md:border-r md:p-4"
        >
          <div className="flex flex-row md:flex-col gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex shrink-0 items-center gap-2 sm:gap-2.5 rounded-lg px-2.5 sm:px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-brand-600 text-white shadow-xs"
                      : "text-ink-700 hover:bg-surface-muted hover:text-ink-900"
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Content View */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
