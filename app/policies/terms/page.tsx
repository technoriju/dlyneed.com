import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | ShopMate",
  description: "Terms and Conditions governing the use of ShopMate ecommerce platform in India.",
  alternates: {
    canonical: "/policies/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-[clamp(26px,3.5vw,34px)] font-bold tracking-tight text-ink-900">
          Terms of Service
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Last updated: November 2026 · Governed by the Laws of India
        </p>
      </div>

      <div className="space-y-8 rounded-xl border border-border bg-surface p-6 sm:p-8 text-sm leading-relaxed text-ink-700 shadow-sm">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using ShopMate (&ldquo;the Website&rdquo;), you agree to be bound by these Terms of Service and all related policies, including our Shipping, Returns, and Privacy policies. If you do not agree to these terms, please refrain from using our platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">2. Eligibility &amp; User Accounts</h2>
          <p>
            You must be at least 18 years old and competent to contract under the Indian Contract Act, 1872. You agree to provide accurate, current, and complete personal and delivery details during checkout and account registration.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">3. Pricing, GST &amp; Product Information</h2>
          <p>
            All prices listed on ShopMate are denominated in Indian Rupees (INR) and <b>include Goods and Services Tax (GST)</b>. Your tax invoice will clearly break down CGST, SGST, or IGST as applicable under Indian taxation laws.
          </p>
          <p>
            While we strive for complete accuracy, errors in pricing or product descriptions may occasionally occur. In the event of an inadvertent pricing error, we reserve the right to cancel the order and provide a full refund.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">4. Payments &amp; Security</h2>
          <p>
            Payment processing is facilitated through Razorpay. You agree to use valid, authorized payment instruments. Any fraudulent transactions or chargebacks will be investigated and reported to law enforcement authorities.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">5. Limitation of Liability</h2>
          <p>
            ShopMate shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use our products or services, beyond the total purchase price of the relevant order.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">6. Governing Law &amp; Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
          </p>
        </section>
      </div>
    </div>
  );
}
