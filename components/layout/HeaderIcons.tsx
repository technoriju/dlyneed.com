"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { CartIcon, HeartIcon, UserIcon } from "./icons";

const iconBtn =
  "relative grid size-[42px] place-items-center rounded-full border border-border bg-surface text-ink-900 hover:border-brand-500 hover:text-brand-600 max-[480px]:size-[38px]";

export function HeaderIcons() {
  const { cartCount, wishlistCount, cartBump, wishBump, isLoggedIn } = useCart();

  return (
    <div className="flex gap-2 max-[960px]:ml-auto max-[480px]:gap-1.5">
      <Link href="/account/wishlist" aria-label="Wishlist" className={iconBtn} id="wishBtn">
        <HeartIcon />
        {wishlistCount > 0 && (
          <span
            id="wishCount"
            className={`absolute -top-1 -right-1 min-w-[19px] h-[19px] rounded-full bg-brand-600 px-[5px] text-center text-[11px] font-bold leading-[19px] text-white ${
              wishBump ? "animate-bump" : ""
            }`}
          >
            {wishlistCount}
          </span>
        )}
      </Link>
      <Link href="/cart" aria-label="Cart" className={iconBtn} id="cartBtn">
        <CartIcon />
        {cartCount > 0 && (
          <span
            id="cartCount"
            className={`absolute -top-1 -right-1 min-w-[19px] h-[19px] rounded-full bg-brand-600 px-[5px] text-center text-[11px] font-bold leading-[19px] text-white ${
              cartBump ? "animate-bump" : ""
            }`}
          >
            {cartCount}
          </span>
        )}
      </Link>
      <Link
        href={isLoggedIn ? "/account" : "/login?next=/account"}
        aria-label="Account"
        className={iconBtn}
        id="acctBtn"
      >
        <UserIcon />
      </Link>
    </div>
  );
}
