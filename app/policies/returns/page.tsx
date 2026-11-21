import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cancellation & Return Policy | ShopMate",
  description: "ShopMate 30-day return policy, order cancellation rules, pickup process, and Razorpay refund timelines.",
  alternates: {
    canonical: "/policies/returns",
  },
};

export default function ReturnsPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-[clamp(26px,3.5vw,34px)] font-bold tracking-tight text-ink-900">
          Cancellation &amp; Return Policy
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Last updated: November 2026 · 30-Day Hassle-Free Returns
        </p>
      </div>

      <div className="space-y-8 rounded-xl border border-border bg-surface p-6 sm:p-8 text-sm leading-relaxed text-ink-700 shadow-sm">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">1. Order Cancellation Policy</h2>
          <p>
            You can cancel an order free of charge at any time while it remains in <b>Confirmed</b> or <b>Packed</b> status, before it has been dispatched from our fulfillment center.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <b>How to cancel:</b> Go to{" "}
              <Link href="/account/orders" className="font-semibold text-brand-600 hover:underline">
                My Orders
              </Link>
              , select your active order, and tap &ldquo;Cancel order&rdquo;.
            </li>
            <li>
              <b>Prepaid orders (UPI, Cards, Net Banking):</b> Full order amount is automatically reversed to your original payment method within 5–7 business days via Razorpay.
            </li>
            <li>
              <b>Cash on delivery orders:</b> No charge is applied; order is cancelled immediately.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">2. 30-Day Return Policy</h2>
          <p>
            We offer an easy <b>30-day return policy</b> from the date your package was delivered. If you are not completely satisfied with your purchase (size/fit issues, changed mind, defective or damaged goods), you can initiate a return directly online.
          </p>
          <div className="rounded-lg bg-surface-muted p-4 text-xs space-y-1.5 border border-border">
            <b className="text-ink-900 block">Eligibility Criteria:</b>
            <ul className="list-disc pl-5 space-y-1">
              <li>Item must be unused, unwashed, and in its original condition.</li>
              <li>All original brand tags, labels, and warranty cards must remain attached.</li>
              <li>Item must be returned with its original packaging and accessories.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">3. Return Pickup Process</h2>
          <p>
            Once a return request is submitted in your account, our courier partner will schedule a doorstep pickup within <b>2 business days</b>.
          </p>
          <p>
            The pickup executive will conduct a quick physical check of the item and provide you with a return acknowledgment receipt.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">4. Refund Timelines</h2>
          <p>
            Refunds are initiated immediately upon courier pickup or verification at our hub:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-border text-xs">
              <thead>
                <tr className="bg-surface-muted border-b border-border text-ink-900">
                  <th className="p-3 font-semibold">Original Payment Method</th>
                  <th className="p-3 font-semibold">Refund Destination</th>
                  <th className="p-3 font-semibold">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-3 font-medium text-ink-900">UPI (GPay, PhonePe, Paytm)</td>
                  <td className="p-3">Linked Bank Account via UPI</td>
                  <td className="p-3 font-semibold text-ok">24 – 48 Hours</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-ink-900">Credit / Debit Card</td>
                  <td className="p-3">Card Issuing Bank</td>
                  <td className="p-3">5 – 7 Business Days</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-ink-900">Net Banking / Wallets</td>
                  <td className="p-3">Original Source Account</td>
                  <td className="p-3">3 – 5 Business Days</td>
                </tr>
                <tr>
                  <td className="p-3 font-medium text-ink-900">Cash on Delivery (COD)</td>
                  <td className="p-3">Bank Transfer (NEFT/IMPS) or UPI ID</td>
                  <td className="p-3">2 – 4 Business Days after details verified</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">5. Contact Support for Assistance</h2>
          <p>
            For any queries regarding refunds or returns, write to us at{" "}
            <b className="text-ink-900">support@shopmate.example</b> or call our toll-free support line at{" "}
            <b className="text-ink-900">1800 000 0000</b> (9:00 AM – 9:00 PM IST).
          </p>
        </section>
      </div>
    </div>
  );
}
