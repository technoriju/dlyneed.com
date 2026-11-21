import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | ShopMate",
  description: "ShopMate Privacy Policy compliant with India's Digital Personal Data Protection (DPDP) Act 2023.",
  alternates: {
    canonical: "/policies/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-[clamp(26px,3.5vw,34px)] font-bold tracking-tight text-ink-900">
          Privacy Policy
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Compliant with India&apos;s Digital Personal Data Protection (DPDP) Act 2023 · Effective November 2026
        </p>
      </div>

      <div className="space-y-8 rounded-xl border border-border bg-surface p-6 sm:p-8 text-sm leading-relaxed text-ink-700 shadow-sm">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">1. Overview &amp; Commitment</h2>
          <p>
            ShopMate (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) respects your privacy and is committed to protecting your personal data in full compliance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">2. Personal Data We Collect</h2>
          <p>We collect only the minimum information necessary to provide our ecommerce services:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <b>Identity &amp; Contact:</b> Full name, 10-digit mobile phone number (used for passwordless SMS OTP login), and optional email address.
            </li>
            <li>
              <b>Delivery Addresses:</b> Full street address, landmark, city, state, and 6-digit postal pincode for accurate package fulfillment.
            </li>
            <li>
              <b>Transaction Records:</b> Order history, purchased items, chosen payment methods (e.g. UPI, card, COD), and Razorpay transaction references.
            </li>
            <li>
              <b>Sensitive Financial Data:</b> We <b>never</b> store credit/debit card numbers, CVVs, or UPI PINs on our servers. All payment transactions are securely handled directly by Razorpay, an RBI-authorized Payment Aggregator complying with PCI-DSS Level 1 security standards.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">3. Purpose of Data Processing</h2>
          <p>Your personal data is collected and processed exclusively for legitimate purposes:</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Account creation and secure phone-OTP verification.</li>
            <li>Processing, dispatching, delivering, and tracking your orders.</li>
            <li>Facilitating secure online payments and processing refunds via Razorpay.</li>
            <li>Providing customer support and order status alerts (via SMS/email).</li>
            <li>Promotional newsletters and sale announcements (only with your affirmative opt-in consent).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">4. Your Rights Under the DPDP Act</h2>
          <p>As a Data Principal under India&apos;s DPDP Act, you have the following enforceable rights:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs">
            <li>
              <b>Right to Access:</b> Review all personal data held about you in your profile settings.
            </li>
            <li>
              <b>Right to Correction:</b> Update and modify your personal details and addresses directly in your account.
            </li>
            <li>
              <b>Right to Erasure (Data Deletion):</b> Request complete deletion of your account and associated personal data by emailing our Data Grievance Officer.
            </li>
            <li>
              <b>Right to Withdraw Consent:</b> Uncheck marketing consent checkboxes in your profile at any time.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">5. Data Storage, Security &amp; Retention</h2>
          <p>
            User authentication sessions are stored in hardened <code>httpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code> cookies. All customer data is hosted in Mumbai-region servers (ap-south-1) with industry-standard TLS 1.3 encryption in transit and AES-256 encryption at rest.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-900">6. Grievance Redressal Officer</h2>
          <p>
            In accordance with the DPDP Act and the Information Technology Act, 2000, the name and contact details of the Grievance Officer are provided below:
          </p>
          <div className="rounded-lg bg-surface-muted p-4 text-xs space-y-1 border border-border">
            <b className="text-ink-900 block">Grievance Officer: Mr. Rajesh Sharma</b>
            <p>ShopMate Retail Private Limited</p>
            <p>4th Floor, Tech Hub Towers, Outer Ring Road, Bengaluru, Karnataka – 560103, India</p>
            <p>Email: <b className="text-ink-900">grievance@shopmate.example</b></p>
            <p className="text-ink-500">We acknowledge grievances within 48 hours and resolve issues within 15 working days.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
