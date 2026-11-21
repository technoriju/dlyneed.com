import type { Metadata } from "next";
import Link from "next/link";
import { btnPrimary } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Help & FAQs | ShopMate",
  description: "Find answers about orders, delivery speeds, payment methods, returns and cancellations on ShopMate.",
  alternates: {
    canonical: "/help",
  },
};

const faqs = [
  {
    q: "Where is my order?",
    a: "Go to My Orders and tap Track order. You'll see each step, from packed to delivered, with the courier tracking number once it ships.",
  },
  {
    q: "How long does delivery take?",
    a: "Standard delivery takes 3–5 business days and is free on orders over ₹999 (otherwise ₹79). Express delivery reaches metro cities in 1–2 business days for ₹149.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "UPI (Google Pay, PhonePe, Paytm, BHIM), credit and debit cards (Visa, Mastercard, RuPay, Amex), net banking, wallets, and cash on delivery for orders up to ₹10,000. Online payments are processed securely by Razorpay.",
  },
  {
    q: "Can I cancel my order?",
    a: "Yes, until it ships. Open the order in My Orders and tap Cancel order. Online payments are refunded to the original method within 5–7 business days.",
  },
  {
    q: "How do returns work?",
    a: "Return any unused item within 30 days of delivery. Open the order, tap Return items and choose a pickup slot. The refund is issued once the courier collects it.",
  },
  {
    q: "My payment failed but money was deducted.",
    a: "Failed payments are automatically reversed by your bank within 5–7 business days. If it doesn't show up by then, contact us with your order number.",
  },
  {
    q: "Do prices include GST?",
    a: "Yes. All prices shown include GST. Your invoice shows the GST breakup.",
  },
];

export default function HelpPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[clamp(26px,3.5vw,34px)] font-bold tracking-tight text-ink-900">
            Help &amp; FAQs
          </h1>
          <p className="mt-1 text-base text-ink-500">
            Answers about orders, delivery, payments and returns.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* FAQ Accordion List */}
          <div className="grid gap-3">
            {faqs.map((faq, i) => (
              <details
                key={faq.q}
                open={i === 0}
                className="group rounded-xl border border-border bg-surface shadow-sm transition-all open:border-border-strong"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4.5 font-semibold text-ink-900 select-none">
                  <span>{faq.q}</span>
                  <span className="text-xl font-medium leading-none text-brand-600 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="border-t border-border/50 px-4.5 pt-3 pb-4 text-sm leading-relaxed text-ink-700">
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </div>

          {/* Contact Support Aside */}
          <aside className="sticky top-[calc(92px+env(safe-area-inset-top,0px))] rounded-xl border border-border bg-surface p-6 shadow-sm">
            <h2 className="text-base font-bold text-ink-900">Still need help?</h2>
            <p className="mt-1 text-xs text-ink-500 leading-relaxed">
              Our support team replies within a few hours, every day 9 am – 9 pm IST.
            </p>

            <div className="mt-5 space-y-3 border-t border-border pt-4 text-xs">
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-ink-500">Email</span>
                <b className="font-semibold text-ink-900">support@shopmate.example</b>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-ink-500">Phone</span>
                <b className="font-semibold text-ink-900">1800 000 0000</b>
              </div>
              <div className="flex justify-between items-baseline gap-2">
                <span className="text-ink-500">Hours</span>
                <span className="font-medium text-ink-700">9 am – 9 pm, All days</span>
              </div>
            </div>

            <div className="mt-6">
              <Link href="/contact" className={`${btnPrimary} w-full text-xs`}>
                Contact Us
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
