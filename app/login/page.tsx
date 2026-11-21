import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginView } from "@/components/auth/LoginView";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create your ShopMate account with mobile OTP.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-sm">Loading...</p>
        </div>
      }
    >
      <LoginView />
    </Suspense>
  );
}
