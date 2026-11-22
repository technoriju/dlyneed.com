"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { categoryNav } from "@/lib/nav";
import { MenuIcon, XIcon } from "./icons";

const linkCls = "flex min-h-[44px] items-center rounded-md px-3 py-2.5 font-medium text-ink-900 transition-colors hover:bg-surface-muted active:bg-brand-50";
const headCls = "mx-3 mt-4 mb-1 text-xs font-bold tracking-[.6px] text-ink-500 uppercase";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const firstLink = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLink.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid size-[42px] place-items-center rounded-full border border-border bg-surface text-ink-900 transition-colors hover:border-brand-500 hover:text-brand-600 max-[480px]:size-[38px] min-[961px]:hidden"
      >
        <MenuIcon />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-80 bg-ink-900/40 backdrop-blur-xs transition-opacity"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <nav
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[min(84vw,320px)] flex-col gap-1 overflow-y-auto bg-surface p-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-[calc(env(safe-area-inset-bottom,0px)+24px)] shadow-pop"
            onClick={(e) => (e.target as HTMLElement).closest("a") && close()}
          >
            <div className="flex items-center justify-between px-2 pb-3 mb-1 border-b border-border">
              <Image src="/logo.svg" alt="ShopMate" width={124} height={30} className="h-[28px] w-auto" />
              <button
                type="button"
                aria-label="Close menu"
                onClick={close}
                className="grid size-9 place-items-center rounded-full text-ink-500 hover:bg-surface-muted hover:text-ink-900"
              >
                <XIcon size={18} />
              </button>
            </div>
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
