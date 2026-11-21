import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shipping Policy | ShopMate",
  description: "Learn about ShopMate shipping rates, delivery timelines across India, courier partners, and tracking.",
  alternates: {
    canonical: "/policies/shipping",
  },
};

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-[clamp(26px,3.5vw,34px)] font-bold tracking-tight text-ink-900">
          Shipping Policy
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Last updated: November 2026 · Effective across India
        </p>
      </div>

      <div className="space-y-8 rounded-xl border border-border bg-surface p-6 sm:p-8 text-sm leading-relaxed text-ink-700 shadow-sm">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">1. Delivery Options &amp; Charges</h2>
          <p>
            At ShopMate, we partner with premier courier networks (including Delhivery, Shiprocket, and BlueDart) to deliver quality products swiftly and safely across India.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-border text-xs">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-ink-900">
                  <th className="p-3 font-semibold">Delivery Speed</th>
                  <th className="p-3 font-semibold">Estimated Time</th>
                  <th className="p-3 font-semibold">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-medium text-ink-900">Standard Delivery</td>
                  <td className="p-3">3 – 5 business days</td>
                  <td className="p-3">
                    <b className="text-ok">FREE</b> on orders ₹999 or more (₹79 for orders under ₹999)
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-ink-900">Express Delivery</td>
                  <td className="p-3">1 – 2 business days (metro cities)</td>
                  <td className="p-3">Flat ₹149 per order</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">2. Serviceable Locations &amp; Pincode Check</h2>
          <p>
            We deliver to over 19,000 pincodes across India. You can verify deliverability and estimated transit times directly on any product page by entering your 6-digit postal pincode.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">3. Order Processing &amp; Tracking</h2>
          <p>
            Orders placed before 2:00 PM IST on business days are processed and handed over to our delivery partners the same day. Once your order has shipped, you will receive an SMS and email notification with your Air Waybill (AWB) number and direct courier tracking link.
          </p>
          <p>
            You can also monitor live tracking milestones under{" "}
            <Link href="/account/orders" className="font-semibold text-brand-600 hover:underline">
              My Orders
            </Link>{" "}
            at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">4. Cash on Delivery (COD)</h2>
          <p>
            Cash on Delivery is available for orders up to ₹10,000 for a nominal convenience fee of ₹49. For security and fraud prevention, orders exceeding ₹10,000 must be prepaid using Razorpay (UPI, Credit/Debit Cards, or Net Banking).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">5. Damaged or Tampered Packages</h2>
          <p>
            If your parcel arrives with a damaged or broken outer seal, please refuse delivery from the courier executive and contact our customer support team immediately at{" "}
            <b className="text-ink-900">support@shopmate.example</b> with photos. We will arrange an immediate replacement or full refund.
          </p>
        </section>
      </div>
    </div>
  );
}
