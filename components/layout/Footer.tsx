import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "./NewsletterForm";

const shopLinks = [
  { href: "/shop", label: "All products" },
  { href: "/category/electronics", label: "Electronics" },
  { href: "/category/fashion", label: "Fashion" },
  { href: "/category/beauty", label: "Beauty" },
  { href: "/deals", label: "Deals" },
];

const serviceLinks = [
  { href: "/account/orders", label: "Track Order" },
  { href: "/policies/returns", label: "Returns & Refunds" },
  { href: "/policies/shipping", label: "Shipping Policy" },
  { href: "/help", label: "Help & FAQs" },
  { href: "/contact", label: "Contact Us" },
];

function LinkList({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm leading-tight font-semibold">{title}</h4>
      <ul className="grid gap-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="text-sm text-ink-500 hover:text-brand-600">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function Year() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export function Footer() {
  return (
    <footer className="bg-brand-50 pb-[calc(60px+env(safe-area-inset-bottom,0px))] md:pb-0">
      <div className="mx-auto max-w-[1200px] px-4 pt-10 sm:pt-14 pb-7">
        <div className="grid grid-cols-[1.3fr_1fr_1fr_1.6fr] gap-8 max-[960px]:grid-cols-2 max-[720px]:grid-cols-1">
          <div>
            <Image src="/logo.svg" alt="ShopMate" width={132} height={32} className="h-8 w-auto" />
            <p className="mt-3 text-sm text-ink-500">Your one-stop shop for quality products at the best prices.</p>
          </div>
          <LinkList title="Shop" links={shopLinks} />
          <LinkList title="Customer Service" links={serviceLinks} />
          <div>
            <h4 className="mb-4 text-sm leading-tight font-semibold">Subscribe to our newsletter</h4>
            <p className="text-sm text-ink-500">Get the latest updates on new products and upcoming sales.</p>
            <NewsletterForm />
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border-strong pt-5 text-[13px] text-ink-500">
          <div className="flex flex-wrap items-center gap-3">
            <span>© <Year /> ShopMate. All rights reserved.</span>
            <span aria-hidden="true" className="text-border-strong">·</span>
            <Link href="/policies/privacy" className="hover:text-brand-600 transition-colors">
              Privacy Policy
            </Link>
            <span aria-hidden="true" className="text-border-strong">·</span>
            <Link href="/policies/terms" className="hover:text-brand-600 transition-colors">
              Terms of Service
            </Link>
          </div>
          <span>Prices include GST · Payments by Razorpay</span>
        </div>
      </div>
    </footer>
  );
}
