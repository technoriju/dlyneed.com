"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { InfoIcon } from "@/components/layout/icons";
import { useToast } from "@/components/ui/Toast";

type Step = "phone" | "otp" | "profile";

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const { isLoggedIn, loginUser } = useCart();
  const { showToast } = useToast();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  // If already logged in, redirect to next destination
  useEffect(() => {
    if (isLoggedIn) {
      router.replace(next);
    }
  }, [isLoggedIn, next, router]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpInputs.current[0]?.focus(), 50);
    }
  }, [step]);

  // Handle phone submit
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setError("Enter a 10-digit mobile number starting with 6–9.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send code.");
        return;
      }

      setDevOtp(data.devOtp || null);
      if (data.devOtp) {
        // Auto-fill in dev mode if convenient, but let user see inputs
        const digits = data.devOtp.split("");
        setOtp(digits);
      }
      setStep("otp");
      showToast(`Code sent to +91 ${clean}`);
    } catch {
      setError("Failed to send verification code. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit inputs
  const handleOtpChange = (index: number, val: string) => {
    setError(null);
    const digits = val.replace(/\D/g, "");

    // Handle paste of multiple digits
    if (digits.length > 1) {
      const newOtp = [...otp];
      for (let i = 0; i < 6 && i < digits.length; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      const nextIdx = Math.min(5, digits.length);
      otpInputs.current[nextIdx]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digits.slice(-1);
    setOtp(newOtp);

    if (digits && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  // Handle OTP submit
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = otp.join("");
    if (code.length < 6) {
      setError("Enter all 6 digits of the code.");
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, "");
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed.");
        return;
      }

      if (data.isNew) {
        // New user: proceed to step 3 (profile)
        setStep("profile");
      } else if (data.user) {
        // Existing user: logged in
        await loginUser(data.user);
        const firstName = data.user.name.split(" ")[0] || data.user.name;
        showToast(`Welcome back, ${firstName}!`);
        router.push(next);
      }
    } catch {
      setError("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setError(null);
    const clean = phone.replace(/\D/g, "");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resend code.");
        return;
      }
      setDevOtp(data.devOtp || null);
      if (data.devOtp) {
        setOtp(data.devOtp.split(""));
      }
      showToast("Verification code resent");
    } catch {
      setError("Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Profile submit (new users)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setError("Enter your full name.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, email: email.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        return;
      }

      await loginUser(data.user);
      const firstName = data.user.name.split(" ")[0] || data.user.name;
      showToast(`Account created. Welcome, ${firstName}!`);
      router.push(next);
    } catch {
      setError("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto mt-4 sm:mt-6 max-w-[440px] rounded-lg border border-border bg-surface p-4 sm:p-8 shadow-card">
      {/* STEP 1: Phone */}
      {step === "phone" && (
        <div className="grid gap-5">
          <div>
            <h1 className="text-[26px] font-semibold text-ink-900">Sign in or create account</h1>
            <p className="mt-1.5 text-sm text-ink-500">
              Use your mobile number. We&apos;ll text you a one-time code.
            </p>
          </div>

          <form onSubmit={handlePhoneSubmit} className="grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="phone" className="text-[13px] font-semibold text-ink-900">
                Mobile number
              </label>
              <div className="flex items-stretch">
                <span className="grid place-items-center rounded-l-sm border border-r-0 border-border-strong bg-surface-muted px-3 text-sm font-semibold text-ink-700">
                  +91
                </span>
                <input
                  id="phone"
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel-national"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="h-11 min-w-0 flex-1 rounded-r-sm border border-border-strong bg-surface px-3 text-sm text-ink-900 outline-none focus:border-brand-600"
                />
              </div>
              {error && (
                <span role="alert" className="text-xs font-medium text-bad">
                  {error}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[52px] w-full cursor-pointer items-center justify-center rounded-sm bg-brand-600 px-7 text-base font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Sending code..." : "Send code"}
            </button>
          </form>

          <p className="text-xs text-ink-500">
            By continuing you agree to ShopMate&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      )}

      {/* STEP 2: OTP */}
      {step === "otp" && (
        <div className="grid gap-5">
          <div>
            <h1 className="text-[26px] font-semibold text-ink-900">Enter verification code</h1>
            <p className="mt-1.5 text-sm text-ink-500">
              We sent a 6-digit code to +91 {phone}.{" "}
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                }}
                className="font-semibold text-brand-600 hover:underline"
              >
                Change
              </button>
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="grid gap-4.5" noValidate>
            <div className="flex justify-between gap-2" role="group" aria-label="6-digit verification code">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpInputs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Digit ${i + 1}`}
                  value={otp[i]}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  className="size-11 sm:size-12 rounded-sm border border-border-strong text-center text-lg sm:text-xl font-bold text-ink-900 outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 max-[360px]:size-9 max-[360px]:text-base"
                />
              ))}
            </div>

            {/* Development Mock Notice */}
            <div className="flex items-start gap-2.5 rounded-md border border-border bg-brand-50 p-3 text-[13px] text-ink-700">
              <InfoIcon size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <span>
                {devOtp ? (
                  <>
                    Development simulator code: <strong className="text-ink-900 font-mono font-bold">{devOtp}</strong>
                  </>
                ) : (
                  "Development simulator active. Check the server console or resend code."
                )}
              </span>
            </div>

            {error && (
              <p role="alert" className="text-[13px] font-medium text-bad">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[52px] w-full cursor-pointer items-center justify-center rounded-sm bg-brand-600 px-7 text-base font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify and continue"}
            </button>

            <p className="text-center text-[13px] text-ink-500">
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
            </p>
          </form>
        </div>
      )}

      {/* STEP 3: Profile (New Users) */}
      {step === "profile" && (
        <div className="grid gap-5">
          <div>
            <h1 className="text-[26px] font-semibold text-ink-900">Welcome to ShopMate</h1>
            <p className="mt-1.5 text-sm text-ink-500">One last step: tell us your name.</p>
          </div>

          <form onSubmit={handleProfileSubmit} className="grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="pname" className="text-[13px] font-semibold text-ink-900">
                Full name
              </label>
              <input
                id="pname"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Riju Karar"
                className="h-11 rounded-sm border border-border-strong bg-surface px-3 text-sm text-ink-900 outline-none focus:border-brand-600"
              />
            </div>

            <div className="grid gap-1.5">
              <label htmlFor="pemail" className="text-[13px] font-semibold text-ink-900">
                Email <span className="font-normal text-ink-500">(optional, for receipts)</span>
              </label>
              <input
                id="pemail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11 rounded-sm border border-border-strong bg-surface px-3 text-sm text-ink-900 outline-none focus:border-brand-600"
              />
            </div>

            {error && (
              <p role="alert" className="text-[13px] font-medium text-bad">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-[52px] w-full cursor-pointer items-center justify-center rounded-sm bg-brand-600 px-7 text-base font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
