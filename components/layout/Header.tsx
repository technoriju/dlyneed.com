import Image from "next/image";
import Link from "next/link";
import { CartIcon, HeartIcon, UserIcon } from "./icons";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { SearchForm } from "./SearchForm";

const iconBtn =
  "relative grid size-[42px] place-items-center rounded-full border border-border bg-surface text-ink-900 hover:border-brand-500 hover:text-brand-600 max-[480px]:size-[38px]";

// Wishlist/cart count badges are added with the cart store (build step 6).
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1200px] items-center gap-5 px-4 py-3">
        <MobileMenu />
        <Link href="/" aria-label="ShopMate home" className="shrink-0">
          <Image src="/logo.svg" alt="ShopMate" width={132} height={32} priority className="h-8 w-auto max-[480px]:h-7" />
        </Link>
        <NavLinks />
        <SearchForm id="q1" className="ml-auto max-w-[380px] flex-1 max-[960px]:hidden" />
        <div className="flex gap-2 max-[960px]:ml-auto max-[480px]:gap-1.5">
          <Link href="/account/wishlist" aria-label="Wishlist" className={iconBtn}>
            <HeartIcon />
          </Link>
          <Link href="/cart" aria-label="Cart" className={iconBtn}>
            <CartIcon />
          </Link>
          <Link href="/account" aria-label="Account" className={iconBtn}>
            <UserIcon />
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-[1200px] px-4 pb-3 min-[961px]:hidden">
        <SearchForm id="q2" />
      </div>
    </header>
  );
}
