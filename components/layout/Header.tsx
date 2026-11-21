import Image from "next/image";
import Link from "next/link";
import { HeaderIcons } from "./HeaderIcons";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";
import { SearchForm } from "./SearchForm";

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
        <HeaderIcons />
      </div>
      <div className="mx-auto max-w-[1200px] px-4 pb-3 min-[961px]:hidden">
        <SearchForm id="q2" />
      </div>
    </header>
  );
}
