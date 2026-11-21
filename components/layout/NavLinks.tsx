"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/lib/nav";

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden gap-[22px] text-sm leading-none font-medium min-[961px]:flex">
      {mainNav.map(({ href, label }) => {
        const on = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`py-2 hover:text-brand-600 ${on ? "text-brand-600" : "text-ink-700"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
