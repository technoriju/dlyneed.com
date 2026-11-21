import type { Metadata } from "next";
import { HeadsetIcon } from "@/components/layout/icons";

export const metadata: Metadata = {
  title: "Contact Us | ShopMate",
  description: "Get in touch with ShopMate customer support. We are available every day from 9 AM to 9 PM IST.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-[clamp(26px,3.5vw,34px)] font-bold tracking-tight text-ink-900">
          Contact Us
        </h1>
        <p className="mt-1 text-base text-ink-500">
          Have a question about an order or product? Our team is here to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_1fr] items-start">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="grid size-10 place-items-center rounded-full bg-brand-100 text-brand-600">
                <HeadsetIcon size={20} />
              </span>
              <div>
                <b className="block text-sm font-semibold text-ink-900">Customer Support</b>
                <span className="text-xs text-ink-500">7 days a week, 9:00 AM – 9:00 PM IST</span>
              </div>
            </div>
            <div className="space-y-2 text-xs border-t border-border pt-4">
              <div className="flex justify-between items-baseline">
                <span className="text-ink-500">Toll-Free Phone:</span>
                <b className="font-semibold text-ink-900">1800 000 0000</b>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-ink-500">Support Email:</span>
                <b className="font-semibold text-ink-900">support@shopmate.example</b>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-ink-500">Order Enquiries:</span>
                <b className="font-semibold text-ink-900">orders@shopmate.example</b>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm text-xs space-y-2">
            <h2 className="text-sm font-bold text-ink-900">Registered Office</h2>
            <p className="text-ink-700 leading-relaxed">
              ShopMate Retail Private Limited<br />
              4th Floor, Tech Hub Towers, Outer Ring Road,<br />
              Bellandur, Bengaluru, Karnataka – 560103, India
            </p>
            <p className="text-ink-500 pt-1">
              CIN: U52100KA2026PTC184920 · GSTIN: 29AABCS1429P1ZK
            </p>
          </div>
        </div>

        {/* Quick Help Aside */}
        <aside className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-ink-900">Quick Self-Service</h2>
          <p className="text-ink-500 leading-relaxed">
            Need an instant update on your package or want to initiate a return?
          </p>
          <div className="space-y-2 pt-2">
            <a
              href="/account/orders"
              className="flex items-center justify-between rounded-lg border border-border-strong bg-surface px-4 py-3 font-semibold text-ink-900 hover:border-brand-600 transition-colors"
            >
              <span>Track My Order</span>
              <span className="text-brand-600">→</span>
            </a>
            <a
              href="/help"
              className="flex items-center justify-between rounded-lg border border-border-strong bg-surface px-4 py-3 font-semibold text-ink-900 hover:border-brand-600 transition-colors"
            >
              <span>Browse Help &amp; FAQs</span>
              <span className="text-brand-600">→</span>
            </a>
            <a
              href="/policies/returns"
              className="flex items-center justify-between rounded-lg border border-border-strong bg-surface px-4 py-3 font-semibold text-ink-900 hover:border-brand-600 transition-colors"
            >
              <span>30-Day Return Policy</span>
              <span className="text-brand-600">→</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
