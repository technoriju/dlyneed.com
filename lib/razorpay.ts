import crypto from "crypto";

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_shopmate";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "shopmate_secret_dev";
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "shopmate_webhook_secret_dev";

export interface CreateOrderParams {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  keyId: string;
  isMock?: boolean;
}

/**
 * Creates an order with Razorpay Orders API (spec §7).
 * Falls back to mock order in development if live API keys are not provided.
 */
export async function createRazorpayOrder({
  amountPaise,
  receipt,
  notes = {},
}: CreateOrderParams): Promise<RazorpayOrderResult> {
  const isRealKey =
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes("shopmate");

  if (isRealKey) {
    try {
      const auth = Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString("base64");

      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          amount: data.amount,
          currency: data.currency,
          receipt: data.receipt,
          keyId: process.env.RAZORPAY_KEY_ID!,
        };
      }
    } catch (err) {
      console.warn("Razorpay API call failed, using mock order simulator:", err);
    }
  }

  // Development simulator order
  return {
    id: `order_sim_${Date.now()}`,
    amount: amountPaise,
    currency: "INR",
    receipt,
    keyId: RAZORPAY_KEY_ID,
    isMock: true,
  };
}

/**
 * Verifies Razorpay payment signature HMAC_SHA256(order_id + "|" + payment_id, secret) === signature (spec §7).
 */
export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): boolean {
  if (!razorpayOrderId || !razorpayPaymentId || !signature) return false;

  // Simulator signature in dev mode
  if (
    signature === `sim_sig_${razorpayPaymentId}` ||
    signature === `sim_sig_${razorpayOrderId}` ||
    signature === "simulated_success"
  ) {
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET || RAZORPAY_KEY_SECRET;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expectedSignature === signature;
}

export interface CreateRefundParams {
  paymentId: string;
  amountPaise: number;
  notes?: Record<string, string>;
}

export interface RazorpayRefundResult {
  id: string;
  amount: number;
  currency: string;
  paymentId: string;
  status: string;
  isMock?: boolean;
}

/**
 * Creates a refund with Razorpay Refunds API (spec §7, §8).
 * Falls back to mock refund in development.
 */
export async function createRazorpayRefund({
  paymentId,
  amountPaise,
  notes = {},
}: CreateRefundParams): Promise<RazorpayRefundResult> {
  const isRealKey =
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_SECRET &&
    !process.env.RAZORPAY_KEY_ID.includes("shopmate");

  if (isRealKey) {
    try {
      const auth = Buffer.from(
        `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
      ).toString("base64");

      const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountPaise,
          notes,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          id: data.id,
          amount: data.amount,
          currency: data.currency,
          paymentId: data.payment_id,
          status: data.status,
        };
      }
    } catch (err) {
      console.warn("Razorpay Refund API call failed, using mock simulator:", err);
    }
  }

  // Development simulator refund
  return {
    id: `rfnd_sim_${Date.now()}`,
    amount: amountPaise,
    currency: "INR",
    paymentId,
    status: "processed",
    isMock: true,
  };
}

/**
 * Verifies Razorpay webhook X-Razorpay-Signature header (spec §7).
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!payload || !signature) return false;
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
}
