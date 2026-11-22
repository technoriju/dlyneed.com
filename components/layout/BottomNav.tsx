"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartContext";
import { CartIcon, HeartIcon, HomeIcon, SearchIcon, UserIcon } from "./icons";

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount, wishlistCount, cartBump, wishBump, isLoggedIn } = useCart();

  // Don't show bottom nav inside admin
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const isHome = pathname === "/";
  const isShop = pathname === "/shop" || pathname.startsWith("/category") || pathname === "/deals";
  const isWishlist = pathname === "/account/wishlist";
  const isCart = pathname === "/cart";
  const isAccount = (pathname.startsWith("/account") && !isWishlist) || pathname.startsWith("/login");

  const itemCls = (active: boolean) =>
    `relative flex flex-1 flex-col items-center justify-center py-2 text-[11px] font-medium transition-colors ${
      active ? "text-brand-600 font-semibold" : "text-ink-500 hover:text-ink-900"
    }`;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)] md:hidden shadow-[0_-4px_16px_rgba(17,17,17,0.06)]"
    >
      <div className="flex h-14 items-center justify-around px-1">
        {/* Home */}
        <Link href="/" aria-current={isHome ? "page" : undefined} className={itemCls(isHome)}>
          <HomeIcon size={20} />
          <span className="mt-0.5">Home</span>
        </Link>

        {/* Shop */}
        <Link href="/shop" aria-current={isShop ? "page" : undefined} className={itemCls(isShop)}>
          <SearchIcon size={20} />
          <span className="mt-0.5">Shop</span>
        </Link>

        {/* Wishlist */}
        <Link
          href="/account/wishlist"
          aria-current={isWishlist ? "page" : undefined}
          className={itemCls(isWishlist)}
        >
          <div className="relative">
            <HeartIcon size={20} />
            {wishlistCount > 0 && (
              <span
                className={`absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-brand-600 px-1 text-center text-[10px] font-bold leading-[17px] text-white ${
                  wishBump ? "animate-bump" : ""
                }`}
              >
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="mt-0.5">Wishlist</span>
        </Link>

        {/* Cart */}
        <Link href="/cart" aria-current={isCart ? "page" : undefined} className={itemCls(isCart)}>
          <div className="relative">
            <CartIcon size={20} />
            {cartCount > 0 && (
              <span
                className={`absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-brand-600 px-1 text-center text-[10px] font-bold leading-[17px] text-white ${
                  cartBump ? "animate-bump" : ""
                }`}
              >
                {cartCount}
              </span>
            )}
          </div>
          <span className="mt-0.5">Cart</span>
        </Link>

        {/* Account */}
        <Link
          href={isLoggedIn ? "/account" : "/login?next=/account"}
          aria-current={isAccount ? "page" : undefined}
          className={itemCls(isAccount)}
        >
          <UserIcon size={20} />
          <span className="mt-0.5">Account</span>
        </Link>
      </div>
    </nav>
  );
}
