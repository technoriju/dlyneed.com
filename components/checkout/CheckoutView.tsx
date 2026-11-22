"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import {
  BagIcon,
  CheckIcon,
  InfoIcon,
  LockIcon,
  XIcon,
} from "@/components/layout/icons";
import { INDIAN_STATES } from "@/lib/constants";
import { addDays, fmtDate, inr } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface Address {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  type: string;
  isDefault: boolean;
}

interface QuoteData {
  items: Array<{
    variantId: string;
    productName: string;
    optionName?: string | null;
    productImage: string;
    pricePaise: number;
    mrpPaise: number;
    qty: number;
  }>;
  count: number;
  mrpTotalPaise: number;
  subtotalPaise: number;
  mrpDiscountPaise: number;
  couponCode: string | null;
  couponDiscountPaise: number;
  couponMeetsMin: boolean;
  shippingPaise: number;
  feesPaise: number;
  expressFeePaise: number;
  codFeePaise: number;
  totalPaise: number;
  totalSavingsPaise: number;
  codAvailable: boolean;
  delivery: "standard" | "express";
  paymentMethod: "upi" | "card" | "netbanking" | "wallet" | "cod";
}

interface SimulatorState {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  method: string;
}

export function CheckoutView() {
  const router = useRouter();
  const { items, summary, couponCode, isLoggedIn, user, isLoading, clearCart } = useCart();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddr, setIsAddingNewAddr] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Address form fields
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrPin, setAddrPin] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrType, setAddrType] = useState<"Home" | "Work" | "Other">("Home");
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});
  const [savingAddr, setSavingAddr] = useState(false);

  // Delivery & Payment
  const [delivery, setDelivery] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<
    "upi" | "card" | "netbanking" | "wallet" | "cod"
  >("upi");

  // Server quote
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  // Process / Error / Simulator
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulator, setSimulator] = useState<SimulatorState | null>(null);

  // Load Razorpay script dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("razorpay-checkout-js")) return;

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Keep script cached
    };
  }, []);

  // Fetch addresses on mount when user is authenticated
  useEffect(() => {
    if (!isLoggedIn) return;

    let isMounted = true;
    async function fetchAddresses() {
      setLoadingAddresses(true);
      try {
        const res = await fetch("/api/addresses");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const list: Address[] = data.addresses || [];
            setAddresses(list);
            if (list.length > 0) {
              const def = list.find((a) => a.isDefault) || list[0];
              setSelectedAddressId(def.id);
              setIsAddingNewAddr(false);
            } else {
              setIsAddingNewAddr(true);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load addresses:", e);
      } finally {
        if (isMounted) setLoadingAddresses(false);
      }
    }

    fetchAddresses();
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // Recalculate quote from server
  const fetchQuote = useCallback(
    async (del: "standard" | "express", pay: "upi" | "card" | "netbanking" | "wallet" | "cod") => {
      if (!isLoggedIn) return;
      setLoadingQuote(true);
      try {
        const res = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            delivery: del,
            paymentMethod: pay,
            couponCode: couponCode || undefined,
            addressId: selectedAddressId || undefined,
          }),
        });

        if (res.ok) {
          const data: QuoteData = await res.json();
          setQuote(data);
          // If COD became unavailable and pay was COD, switch to UPI
          if (!data.codAvailable && pay === "cod") {
            setPaymentMethod("upi");
          }
        }
      } catch (e) {
        console.error("Failed to get quote:", e);
      } finally {
        setLoadingQuote(false);
      }
    },
    [isLoggedIn, couponCode, selectedAddressId]
  );

  useEffect(() => {
    fetchQuote(delivery, paymentMethod);
  }, [delivery, paymentMethod, fetchQuote]);

  // Handle Address Creation
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (addrName.trim().length < 2) {
      errs.name = "Enter the recipient's full name.";
    }
    if (!/^[6-9]\d{9}$/.test(addrPhone.trim())) {
      errs.phone = "Enter a 10-digit mobile number starting with 6–9.";
    }
    if (!/^[1-9]\d{5}$/.test(addrPin.trim())) {
      errs.pin = "Enter a valid 6-digit pincode.";
    }
    if (!addrCity.trim()) {
      errs.city = "Enter the city.";
    }
    if (addrLine1.trim().length < 5) {
      errs.line1 = "Enter the house number and street.";
    }
    if (!addrState) {
      errs.state = "Select the state.";
    }

    setAddrErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSavingAddr(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addrName.trim(),
          phone: addrPhone.trim(),
          pincode: addrPin.trim(),
          city: addrCity.trim(),
          line1: addrLine1.trim(),
          line2: addrLine2.trim() || undefined,
          state: addrState,
          type: addrType,
          isDefault: addresses.length === 0,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const created: Address = data.address;
        setAddresses((prev) => [created, ...prev]);
        setSelectedAddressId(created.id);
        setIsAddingNewAddr(false);
        // Reset form
        setAddrName("");
        setAddrPhone("");
        setAddrPin("");
        setAddrCity("");
        setAddrLine1("");
        setAddrLine2("");
        setAddrState("");
        setAddrType("Home");
        showToast("Address saved");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to save address");
      }
    } catch {
      showToast("Network error saving address");
    } finally {
      setSavingAddr(false);
    }
  };

  // Place Order / Pay handler
  const handlePlaceOrder = async () => {
    setError(null);

    if (!selectedAddressId) {
      setError("Please select or add a delivery address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          delivery,
          paymentMethod,
          couponCode: couponCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to initiate order. Please try again.");
        setSubmitting(false);
        return;
      }

      // COD path: immediately confirmed
      if (data.isCod) {
        clearCart();
        router.push(data.redirectUrl);
        return;
      }

      // Online payment flow:
      const methods: Record<string, string> = {
        upi: "UPI",
        card: "Credit / Debit Card",
        netbanking: "Net Banking",
        wallet: "Wallet",
      };

      // Check if real Razorpay checkout is available and key is not mock
      if (typeof window !== "undefined" && window.Razorpay && !data.isMock) {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "ShopMate",
          description: `Order ${data.orderId}`,
          order_id: data.razorpayOrderId,
          prefill: data.prefill,
          theme: { color: "#5f6b35" },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            try {
              const verifyRes = await fetch("/api/checkout/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: data.orderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) {
                clearCart();
                router.push(verifyData.redirectUrl);
              } else {
                setError(
                  verifyData.error ||
                    "Payment signature verification failed. Please contact support."
                );
              }
            } catch {
              setError("Network error while verifying payment.");
            } finally {
              setSubmitting(false);
            }
          },
          modal: {
            ondismiss: () => {
              setError("Payment was cancelled. Your cart is saved.");
              setSubmitting(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          setError(
            resp.error?.description ||
              "Payment failed and no money was taken from your account. Please try again."
          );
          setSubmitting(false);
        });
        rzp.open();
      } else {
        // Fallback to Prototype's Payment Simulator
        setSimulator({
          orderId: data.orderId,
          razorpayOrderId: data.razorpayOrderId,
          amount: data.amount,
          method: methods[paymentMethod] || "Online Payment",
        });
        setSubmitting(false);
      }
    } catch {
      setError("Network error while placing order.");
      setSubmitting(false);
    }
  };

  // Simulator actions
  const handleSimulateSuccess = async () => {
    if (!simulator) return;
    setSubmitting(true);
    try {
      const mockPaymentId = `pay_sim_${Date.now()}`;
      const res = await fetch("/api/checkout/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: simulator.orderId,
          razorpay_order_id: simulator.razorpayOrderId,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: "simulated_success",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSimulator(null);
        clearCart();
        router.push(data.redirectUrl);
      } else {
        setError(data.error || "Simulation failed");
      }
    } catch {
      setError("Error verifying simulated payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateFailure = () => {
    setSimulator(null);
    setError(
      "Payment failed and no money was taken from your account. Please try again or choose another payment method."
    );
  };

  // Loading state
  if (isLoading || (isLoggedIn && loadingAddresses && addresses.length === 0)) {
    return (
      <div className="py-20 text-center text-ink-500">
        <div className="mx-auto size-9 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
        <p className="mt-3 text-sm">Preparing checkout...</p>
      </div>
    );
  }

  // Guest State: prompt login
  if (!isLoggedIn) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-semibold text-ink-900">Sign in to check out</h1>
        <p className="mt-2 text-sm text-ink-500">
          Please sign in with your mobile number to view saved addresses and complete your order.
        </p>
        <div className="mt-6">
          <Link
            href="/login?next=/checkout"
            className="inline-flex h-11 items-center justify-center rounded-md bg-brand-600 px-6 font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Sign in or create account
          </Link>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="py-12">
        <h1 className="mb-6 text-[clamp(24px,3vw,32px)] font-semibold text-ink-900">Checkout</h1>
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-muted/50 p-12 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <BagIcon size={28} />
          </div>
          <h2 className="text-lg font-semibold text-ink-900">Nothing to check out</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
            Your cart is empty. Add a few items before proceeding to checkout.
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Start shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Compute display totals (prefer server quote, fallback to local summary)
  const displayItems = quote?.items || items.map((i) => ({
    variantId: i.variantId,
    productName: i.name,
    optionName: i.optionValue,
    productImage: i.image,
    pricePaise: i.pricePaise,
    mrpPaise: i.mrpPaise,
    qty: i.qty,
  }));

  const displayCount = quote?.count ?? summary.totalQty;
  const displaySubtotal = quote?.subtotalPaise ?? summary.subtotalPaise;
  const displayMrpDiscount = quote?.mrpDiscountPaise ?? summary.mrpDiscountPaise;
  const displayCouponDiscount = quote?.couponDiscountPaise ?? summary.couponDiscountPaise;
  const displayShipping = quote?.shippingPaise ?? summary.shippingPaise;
  const displayExpressFee = quote?.expressFeePaise ?? (delivery === "express" ? 149_00 : 0);
  const displayCodFee = quote?.codFeePaise ?? (paymentMethod === "cod" ? 49_00 : 0);
  const displayTotal =
    quote?.totalPaise ??
    displaySubtotal - displayCouponDiscount + displayShipping + displayExpressFee + displayCodFee;
  const displaySavings = displayMrpDiscount + displayCouponDiscount;

  const isCodAllowed = quote?.codAvailable ?? displayTotal <= 10000_00;

  return (
    <div className="pb-16 pt-2">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-ink-500" aria-label="Breadcrumb">
        <Link href="/cart" className="hover:text-brand-600">
          Cart
        </Link>
        <span aria-hidden="true">/</span>
        <span className="font-medium text-ink-900" aria-current="page">
          Checkout
        </span>
      </nav>

      <div className="mb-6">
        <h1 className="text-[clamp(26px,3.2vw,34px)] font-semibold tracking-[-0.3px] text-ink-900">
          Checkout
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Left Column: Steps */}
        <div className="space-y-6">
          {/* Signed-in banner */}
          <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-full bg-ok/15 text-ok">
                <CheckIcon size={16} />
              </span>
              <h2 className="text-base font-semibold text-ink-900">Signed in</h2>
            </div>
            <p className="mt-2 text-sm text-ink-700 pl-10">
              <b className="font-semibold text-ink-900">{user?.name}</b> · +91 {user?.phone}
              {user?.email ? ` · ${user.email}` : ""}
            </p>
          </section>

          {/* Step 1: Delivery address */}
          <section
            className="rounded-xl border border-border bg-surface p-5 shadow-card"
            aria-labelledby="s-addr"
          >
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                  1
                </span>
                <h2 id="s-addr" className="text-base font-semibold text-ink-900">
                  Delivery address
                </h2>
              </div>
              {addresses.length > 0 && !isAddingNewAddr && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewAddr(true);
                    setAddrName(user?.name || "");
                    setAddrPhone(user?.phone?.replace("+91", "") || "");
                  }}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  + Add new
                </button>
              )}
            </div>

            <div className="mt-4">
              {addresses.length > 0 && !isAddingNewAddr ? (
                <div className="space-y-3" role="radiogroup" aria-label="Saved addresses">
                  {addresses.map((a) => {
                    const isSelected = selectedAddressId === a.id;
                    return (
                      <label
                        key={a.id}
                        className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-all ${
                          isSelected
                            ? "border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-600"
                            : "border-border bg-surface hover:border-border-strong"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="addressSelect"
                            value={a.id}
                            checked={isSelected}
                            onChange={() => setSelectedAddressId(a.id)}
                            className="mt-1 size-4 accent-brand-600"
                          />
                          <div className="space-y-0.5 text-sm text-ink-700">
                            <p className="font-semibold text-ink-900">{a.name}</p>
                            <p>
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ""}
                            </p>
                            <p>
                              {a.city}, {a.state} – {a.pincode}
                            </p>
                            <p className="text-xs text-ink-500">+91 {a.phone}</p>
                          </div>
                        </div>
                        <span className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                          {a.type}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                /* Inline Address Form */
                <form onSubmit={handleSaveAddress} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="a-name" className="block text-xs font-medium text-ink-700">
                        Full name
                      </label>
                      <input
                        id="a-name"
                        type="text"
                        value={addrName}
                        onChange={(e) => setAddrName(e.target.value)}
                        className={`mt-1 h-10 w-full rounded-md border px-3 text-sm focus:outline-none ${
                          addrErrors.name
                            ? "border-bad focus:border-bad"
                            : "border-border focus:border-brand-600"
                        }`}
                        placeholder="Recipient full name"
                      />
                      {addrErrors.name && (
                        <p className="mt-1 text-xs text-bad">{addrErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="a-phone" className="block text-xs font-medium text-ink-700">
                        Mobile number
                      </label>
                      <div className="relative mt-1 flex">
                        <span className="inline-flex items-center rounded-l-md border border-r-0 border-border bg-surface-muted px-3 text-xs text-ink-500">
                          +91
                        </span>
                        <input
                          id="a-phone"
                          type="tel"
                          maxLength={10}
                          value={addrPhone}
                          onChange={(e) => setAddrPhone(e.target.value.replace(/\D/g, ""))}
                          className={`h-10 w-full rounded-r-md border px-3 text-sm focus:outline-none ${
                            addrErrors.phone
                              ? "border-bad focus:border-bad"
                              : "border-border focus:border-brand-600"
                          }`}
                          placeholder="10-digit number"
                        />
                      </div>
                      {addrErrors.phone && (
                        <p className="mt-1 text-xs text-bad">{addrErrors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="a-pin" className="block text-xs font-medium text-ink-700">
                        Pincode
                      </label>
                      <input
                        id="a-pin"
                        type="text"
                        maxLength={6}
                        value={addrPin}
                        onChange={(e) => setAddrPin(e.target.value.replace(/\D/g, ""))}
                        className={`mt-1 h-10 w-full rounded-md border px-3 text-sm focus:outline-none ${
                          addrErrors.pin
                            ? "border-bad focus:border-bad"
                            : "border-border focus:border-brand-600"
                        }`}
                        placeholder="6-digit pincode"
                      />
                      {addrErrors.pin && <p className="mt-1 text-xs text-bad">{addrErrors.pin}</p>}
                    </div>

                    <div>
                      <label htmlFor="a-city" className="block text-xs font-medium text-ink-700">
                        City
                      </label>
                      <input
                        id="a-city"
                        type="text"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                        className={`mt-1 h-10 w-full rounded-md border px-3 text-sm focus:outline-none ${
                          addrErrors.city
                            ? "border-bad focus:border-bad"
                            : "border-border focus:border-brand-600"
                        }`}
                        placeholder="City"
                      />
                      {addrErrors.city && (
                        <p className="mt-1 text-xs text-bad">{addrErrors.city}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="a-l1" className="block text-xs font-medium text-ink-700">
                        House no., building, street
                      </label>
                      <input
                        id="a-l1"
                        type="text"
                        value={addrLine1}
                        onChange={(e) => setAddrLine1(e.target.value)}
                        className={`mt-1 h-10 w-full rounded-md border px-3 text-sm focus:outline-none ${
                          addrErrors.line1
                            ? "border-bad focus:border-bad"
                            : "border-border focus:border-brand-600"
                        }`}
                        placeholder="Flat / House no., building, street"
                      />
                      {addrErrors.line1 && (
                        <p className="mt-1 text-xs text-bad">{addrErrors.line1}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="a-l2" className="block text-xs font-medium text-ink-700">
                        Area, landmark <span className="text-ink-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="a-l2"
                        type="text"
                        value={addrLine2}
                        onChange={(e) => setAddrLine2(e.target.value)}
                        className="mt-1 h-10 w-full rounded-md border border-border px-3 text-sm focus:border-brand-600 focus:outline-none"
                        placeholder="Nearby landmark, colony"
                      />
                    </div>

                    <div>
                      <label htmlFor="a-state" className="block text-xs font-medium text-ink-700">
                        State
                      </label>
                      <select
                        id="a-state"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                        className={`mt-1 h-10 w-full rounded-md border bg-surface px-3 text-sm focus:outline-none ${
                          addrErrors.state
                            ? "border-bad focus:border-bad"
                            : "border-border focus:border-brand-600"
                        }`}
                      >
                        <option value="">Select state</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      {addrErrors.state && (
                        <p className="mt-1 text-xs text-bad">{addrErrors.state}</p>
                      )}
                    </div>

                    <div>
                      <span className="block text-xs font-medium text-ink-700">Address type</span>
                      <div
                        className="mt-1 flex h-10 rounded-md border border-border bg-surface-muted p-0.5"
                        role="radiogroup"
                      >
                        {(["Home", "Work", "Other"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            role="radio"
                            aria-checked={addrType === t}
                            onClick={() => setAddrType(t)}
                            className={`flex-1 rounded text-xs font-medium transition-colors ${
                              addrType === t
                                ? "bg-surface text-ink-900 shadow-sm"
                                : "text-ink-500 hover:text-ink-900"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingAddr}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                    >
                      {savingAddr ? "Saving..." : "Save and deliver here"}
                    </button>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewAddr(false)}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-ink-700 hover:bg-surface-muted"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Step 2: Delivery speed */}
          <section
            className="rounded-xl border border-border bg-surface p-5 shadow-card"
            aria-labelledby="s-del"
          >
            <div className="flex items-center gap-3 border-b border-border/80 pb-4">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                2
              </span>
              <h2 id="s-del" className="text-base font-semibold text-ink-900">
                Delivery speed
              </h2>
            </div>

            <div className="mt-4 space-y-3" role="radiogroup" aria-label="Delivery speed">
              <label
                className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-all ${
                  delivery === "standard"
                    ? "border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-600"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="delSpeed"
                    value="standard"
                    checked={delivery === "standard"}
                    onChange={() => setDelivery("standard")}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <div>
                    <b className="block text-sm font-semibold text-ink-900">Standard delivery</b>
                    <span className="text-xs text-ink-500">
                      3–5 business days · by{" "}
                      {fmtDate(addDays(5), { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink-900">
                  {displayShipping === 0 ? "Free" : inr(displayShipping)}
                </span>
              </label>

              <label
                className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-all ${
                  delivery === "express"
                    ? "border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-600"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="delSpeed"
                    value="express"
                    checked={delivery === "express"}
                    onChange={() => setDelivery("express")}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <div>
                    <b className="block text-sm font-semibold text-ink-900">Express delivery</b>
                    <span className="text-xs text-ink-500">
                      1–2 business days in metro cities · by{" "}
                      {fmtDate(addDays(2), { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink-900">+₹149</span>
              </label>
            </div>
          </section>

          {/* Step 3: Payment method */}
          <section
            className="rounded-xl border border-border bg-surface p-5 shadow-card"
            aria-labelledby="s-pay"
          >
            <div className="flex items-center gap-3 border-b border-border/80 pb-4">
              <span className="flex size-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                3
              </span>
              <h2 id="s-pay" className="text-base font-semibold text-ink-900">
                Payment method
              </h2>
            </div>

            <div className="mt-4 space-y-3" role="radiogroup" aria-label="Payment method">
              {/* UPI */}
              <label
                className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-all ${
                  paymentMethod === "upi"
                    ? "border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-600"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payMethod"
                    value="upi"
                    checked={paymentMethod === "upi"}
                    onChange={() => setPaymentMethod("upi")}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <div>
                    <b className="block text-sm font-semibold text-ink-900">UPI</b>
                    <span className="text-xs text-ink-500">
                      Google Pay, PhonePe, Paytm, BHIM or any UPI app
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5" aria-hidden="true">
                      {["GPay", "PhonePe", "Paytm", "BHIM"].map((b) => (
                        <span
                          key={b}
                          className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-700"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </label>

              {/* Card */}
              <label
                className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-all ${
                  paymentMethod === "card"
                    ? "border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-600"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <div>
                    <b className="block text-sm font-semibold text-ink-900">
                      Credit / Debit card
                    </b>
                    <span className="text-xs text-ink-500">
                      Visa, Mastercard, RuPay, Amex · EMI available
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5" aria-hidden="true">
                      {["Visa", "Mastercard", "RuPay", "Amex"].map((b) => (
                        <span
                          key={b}
                          className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-700"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </label>

              {/* Net banking */}
              <label
                className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-all ${
                  paymentMethod === "netbanking"
                    ? "border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-600"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payMethod"
                    value="netbanking"
                    checked={paymentMethod === "netbanking"}
                    onChange={() => setPaymentMethod("netbanking")}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <div>
                    <b className="block text-sm font-semibold text-ink-900">Net banking</b>
                    <span className="text-xs text-ink-500">All major Indian banks</span>
                    <div className="mt-1.5 flex flex-wrap gap-1.5" aria-hidden="true">
                      {["SBI", "HDFC", "ICICI", "Axis"].map((b) => (
                        <span
                          key={b}
                          className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-ink-700"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </label>

              {/* Wallets */}
              <label
                className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4 transition-all ${
                  paymentMethod === "wallet"
                    ? "border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-600"
                    : "border-border bg-surface hover:border-border-strong"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payMethod"
                    value="wallet"
                    checked={paymentMethod === "wallet"}
                    onChange={() => setPaymentMethod("wallet")}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <div>
                    <b className="block text-sm font-semibold text-ink-900">Wallets</b>
                    <span className="text-xs text-ink-500">
                      Paytm, PhonePe, Amazon Pay, Mobikwik
                    </span>
                  </div>
                </div>
              </label>

              {/* Cash on delivery */}
              <label
                className={`flex items-start justify-between gap-4 rounded-lg border p-4 transition-all ${
                  isCodAllowed
                    ? paymentMethod === "cod"
                      ? "cursor-pointer border-brand-600 bg-brand-50/40 shadow-sm ring-1 ring-brand-600"
                      : "cursor-pointer border-border bg-surface hover:border-border-strong"
                    : "cursor-not-allowed border-border bg-surface opacity-55"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payMethod"
                    value="cod"
                    disabled={!isCodAllowed}
                    checked={paymentMethod === "cod"}
                    onChange={() => isCodAllowed && setPaymentMethod("cod")}
                    className="mt-1 size-4 accent-brand-600"
                  />
                  <div>
                    <b className="block text-sm font-semibold text-ink-900">Cash on delivery</b>
                    <span className="text-xs text-ink-500">
                      {isCodAllowed
                        ? "Pay in cash or UPI when it arrives"
                        : "Not available for orders over ₹10,000"}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink-900">+₹49</span>
              </label>
            </div>

            {/* Note */}
            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-surface-muted/60 p-3 text-xs text-ink-600">
              <span className="text-brand-600">
                <LockIcon size={16} />
              </span>
              <p>
                {paymentMethod === "cod"
                  ? "No online payment needed. You'll pay the delivery partner upon delivery."
                  : "When you tap Pay, Razorpay's secure checkout opens to complete the payment. ShopMate never sees or stores your card or UPI details."}
              </p>
            </div>
          </section>

          {/* Error Banner */}
          {error && (
            <div
              className="flex items-start gap-3 rounded-xl border border-bad/30 bg-bad/5 p-4 text-sm text-bad"
              role="alert"
            >
              <span className="mt-0.5 shrink-0">
                <InfoIcon size={18} />
              </span>
              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Summary */}
        <div className="lg:sticky lg:top-24">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <h2 className="text-lg font-semibold text-ink-900">Order summary</h2>
              <span className="text-xs text-ink-500">
                {displayCount} item{displayCount === 1 ? "" : "s"}
              </span>
            </div>

            {/* Item Previews */}
            <div className="divide-y divide-border/60 py-2">
              {displayItems.map((item: any) => {
                const name = item.name || item.productName || "Product";
                const image = item.image || item.productImage || "/images/products/placeholder.jpg";
                const opt = item.optionValue || item.optionName;
                return (
                  <div key={item.variantId} className="flex items-center gap-3 py-3 text-sm">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface-muted">
                      <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-900">{name}</p>
                      <p className="text-xs text-ink-500">
                        {opt ? `${opt} · ` : ""}Qty {item.qty}
                      </p>
                    </div>
                    <div className="text-right font-medium text-ink-900">
                      {inr(item.pricePaise * item.qty)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Breakdown */}
            <div className="space-y-2.5 border-t border-border/80 py-4 text-sm">
              <div className="flex justify-between text-ink-700">
                <span>Subtotal</span>
                <span className="font-medium text-ink-900">{inr(displaySubtotal)}</span>
              </div>

              {displayMrpDiscount > 0 && (
                <div className="flex justify-between text-ok">
                  <span>MRP discount</span>
                  <span>−{inr(displayMrpDiscount)}</span>
                </div>
              )}

              {displayCouponDiscount > 0 && (
                <div className="flex justify-between text-ok">
                  <span>Coupon discount</span>
                  <span>−{inr(displayCouponDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between text-ink-700">
                <span>Delivery fee</span>
                <span>{displayShipping === 0 ? "Free" : inr(displayShipping)}</span>
              </div>

              {delivery === "express" && (
                <div className="flex justify-between text-ink-700">
                  <span>Express delivery</span>
                  <span>+₹149</span>
                </div>
              )}

              {paymentMethod === "cod" && (
                <div className="flex justify-between text-ink-700">
                  <span>Cash on delivery fee</span>
                  <span>+₹49</span>
                </div>
              )}

              <div className="border-t border-border pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-semibold text-ink-900">Total</span>
                  <span className="text-2xl font-bold tracking-tight text-ink-900">
                    {inr(displayTotal)}
                  </span>
                </div>
                {displaySavings > 0 && (
                  <p className="mt-1 text-right text-xs font-medium text-ok">
                    You save {inr(displaySavings)} on this order
                  </p>
                )}
              </div>
            </div>

            {/* Action CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={submitting || loadingQuote}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-brand-600 font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Processing...
                  </span>
                ) : paymentMethod === "cod" ? (
                  `Place order · ${inr(displayTotal)}`
                ) : (
                  `Pay ${inr(displayTotal)}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Simulator Modal (spec §7 & prototype fallback) */}
      {simulator && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sim-title"
        >
          <div className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl bg-surface p-5 sm:p-6 shadow-pop">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600">
                Payment simulator
              </span>
              <button
                type="button"
                onClick={() => setSimulator(null)}
                className="rounded-full p-1 text-ink-400 hover:bg-surface-muted hover:text-ink-700"
                aria-label="Close"
              >
                <XIcon size={18} />
              </button>
            </div>

            <div className="mt-4">
              <h3 id="sim-title" className="text-xl font-bold text-ink-900">
                Complete your payment
              </h3>
              <p className="mt-1 text-xs text-ink-500">
                ShopMate · Order of {displayCount} item{displayCount === 1 ? "" : "s"} ·{" "}
                {simulator.method}
              </p>
            </div>

            <div className="my-6 rounded-xl bg-surface-muted/70 py-4 text-center">
              <span className="text-3xl font-extrabold tracking-tight text-ink-900">
                {inr(simulator.amount)}
              </span>
            </div>

            <div className="flex items-start gap-2.5 rounded-lg bg-brand-50/50 p-3 text-xs text-ink-700">
              <span className="text-brand-600">
                <InfoIcon size={16} />
              </span>
              <p>
                On the live site, Razorpay&apos;s secure checkout window opens here and you pay with{" "}
                {simulator.method}. Pick an outcome to preview each screen.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleSimulateSuccess}
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
              >
                Simulate successful payment
              </button>
              <button
                type="button"
                onClick={handleSimulateFailure}
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center rounded-lg border border-bad/30 text-sm font-semibold text-bad transition-colors hover:bg-bad/5 disabled:opacity-50"
              >
                Simulate failed payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
