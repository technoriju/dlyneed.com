"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";
import { useCart } from "@/components/cart/CartContext";
import { BoxIcon, HeartIcon, LogoutIcon, PinIcon, UserIcon } from "@/components/layout/icons";

interface AccountShellProps {
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
  };
  children: React.ReactNode;
}

export function AccountShell({ user, children }: AccountShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useCart();

  const navItems = [
    { href: "/account/orders", label: "My Orders", icon: BoxIcon },
    { href: "/account/wishlist", label: "Wishlist", icon: HeartIcon },
    { href: "/account/addresses", label: "Addresses", icon: PinIcon },
    { href: "/account", label: "Profile", icon: UserIcon },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const cleanPhone = user.phone.replace(/^\+91/, "");

  return (
    <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8">
      {/* Mobile Horizontal Subnav (< md) */}
      <nav
        aria-label="Account mobile navigation"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-border md:hidden"
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href);
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-brand-600 text-white shadow-xs"
                  : "border border-border bg-surface text-ink-700 hover:bg-surface-muted"
              }`}
            >
              <IconComponent size={15} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-bad hover:bg-bad/10 transition-colors"
        >
          <LogoutIcon size={15} />
          <span>Sign out</span>
        </button>
      </nav>

      {/* Desktop Side navigation (md+) */}
      <nav
        aria-label="Account"
        className="sticky top-[calc(92px+env(safe-area-inset-top,0px))] hidden md:flex flex-col gap-0.5 rounded-xl border border-border bg-surface p-2.5 shadow-sm"
      >
        {/* User Identity */}
        <div className="mb-2 flex items-center gap-3 border-b border-border px-2.5 pt-3 pb-4">
          <span className="grid size-10.5 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {getInitials(user.name)}
          </span>
          <div className="min-w-0">
            <b className="block truncate text-sm font-semibold text-ink-900">{user.name}</b>
            <small className="block truncate text-xs text-ink-500">+91 {cleanPhone}</small>
          </div>
        </div>

        {/* Links */}
        {navItems.map((item) => {
          const isActive =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href);
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-100 font-semibold text-ink-900"
                  : "text-ink-700 hover:bg-surface-muted"
              }`}
            >
              <IconComponent size={18} className={isActive ? "text-brand-600" : "text-ink-500"} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-surface-muted"
        >
          <LogoutIcon size={18} className="text-ink-500" />
          <span>Sign out</span>
        </button>
      </nav>

      {/* Main Account Content */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
