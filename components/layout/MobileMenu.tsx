"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categoryNav } from "@/lib/nav";
import { MenuIcon } from "./icons";

const linkCls = "rounded-sm px-2 py-3 font-medium text-ink-900 hover:bg-surface-muted";
const headCls = "mx-2 mt-4 mb-1 text-xs tracking-[.5px] text-ink-500 uppercase";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid size-[42px] place-items-center rounded-full border border-border bg-surface text-ink-900 hover:border-brand-500 hover:text-brand-600 max-[480px]:size-[38px] min-[961px]:hidden"
      >
        <MenuIcon />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-80 bg-ink-900/40"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <nav
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col gap-1 overflow-auto bg-surface p-5"
            onClick={(e) => (e.target as HTMLElement).closest("a") && close()}
          >
            <Image src="/logo.svg" alt="ShopMate" width={124} height={30} className="mx-2 mb-3 h-[30px] w-auto" />
            <Link ref={firstLink} href="/" className={linkCls}>Home</Link>
            <Link href="/shop" className={linkCls}>Shop all</Link>
            <Link href="/deals" className={linkCls}>Deals</Link>
            <h4 className={headCls}>Categories</h4>
            {categoryNav.map((c) => (
              <Link key={c.slug} href={`/category/${c.slug}`} className={linkCls}>{c.label}</Link>
            ))}
            <h4 className={headCls}>Account</h4>
            <Link href="/account/orders" className={linkCls}>My Orders</Link>
            <Link href="/account/wishlist" className={linkCls}>Wishlist</Link>
            <Link href="/account/addresses" className={linkCls}>Addresses</Link>
            <Link href="/account" className={linkCls}>Profile</Link>
            <Link href="/help" className={linkCls}>Help &amp; FAQs</Link>
          </nav>
        </div>
      )}
    </>
  );
}
