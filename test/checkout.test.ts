import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

import { NextRequest } from "next/server";
import crypto from "crypto";
import { GET as AddressesGET, POST as AddressesPOST, PATCH as AddressesPATCH, DELETE as AddressesDELETE } from "../app/api/addresses/route";
import { POST as QuotePOST } from "../app/api/checkout/quote/route";
import { POST as CreateOrderPOST } from "../app/api/checkout/create-order/route";
import { POST as VerifyPOST } from "../app/api/checkout/verify/route";
import { POST as WebhookPOST } from "../app/api/webhooks/razorpay/route";
import { db } from "../lib/db";
import { signSession, SESSION_COOKIE_NAME } from "../lib/session";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} from "../lib/razorpay";

describe("Checkout, Orders & Razorpay Integration (Step 8)", () => {
  let testUser: { id: string; phone: string; name: string };
  let sessionToken: string;
  let testVariantId: string;
  let chairVariantId: string;

  it("sets up test user and seed products", async () => {
    // Find or create test user
    const phone = "+919876500008";
    const user = await db.user.upsert({
      where: { phone },
      update: { name: "Checkout Tester" },
      create: { phone, name: "Checkout Tester", email: "tester@shopmate.test" },
    });
    testUser = { id: user.id, phone: user.phone, name: user.name };
    sessionToken = await signSession({
      userId: user.id,
      phone: user.phone,
      name: user.name,
    });

    // Clean previous test data
    await db.orderEvent.deleteMany({ where: { order: { userId: user.id } } });
    await db.orderItem.deleteMany({ where: { order: { userId: user.id } } });
    await db.order.deleteMany({ where: { userId: user.id } });
    await db.cartItem.deleteMany({ where: { userId: user.id } });
    await db.address.deleteMany({ where: { userId: user.id } });

    // Pick headphones variant (₹2,999)
    const variant = await db.variant.findFirst({
      where: { product: { slug: "wireless-headphones" } },
    });
    expect(variant).toBeDefined();
    testVariantId = variant!.id;

    // Pick chair variant (₹8,999) for testing the > ₹10,000 COD rule
    const chairVariant = await db.variant.findFirst({
      where: { product: { slug: "tufted-accent-chair" } },
    });
    expect(chairVariant).toBeDefined();
    chairVariantId = chairVariant!.id;
  });

  describe("Razorpay Signature & Simulator Library (lib/razorpay.ts)", () => {
    it("creates a Razorpay order in test/dev mode", async () => {
      const res = await createRazorpayOrder({
        amountPaise: 2999_00,
        receipt: "SM10440",
      });
      expect(res.id).toBeDefined();
      expect(res.amount).toBe(2999_00);
      expect(res.currency).toBe("INR");
      expect(res.receipt).toBe("SM10440");
    });

    it("verifies genuine HMAC SHA-256 signatures", () => {
      const orderId = "order_test_12345";
      const paymentId = "pay_test_67890";
      const validSig = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      expect(verifyPaymentSignature(orderId, paymentId, validSig)).toBe(true);
      expect(verifyPaymentSignature(orderId, paymentId, "invalid_signature")).toBe(false);
    });

    it("accepts dev simulation signatures in dev mode", () => {
      expect(
        verifyPaymentSignature("order_123", "pay_456", "simulated_success")
      ).toBe(true);
      expect(
        verifyPaymentSignature("order_123", "pay_456", "sim_sig_pay_456")
      ).toBe(true);
    });

    it("verifies webhook signatures with HMAC SHA-256", () => {
      const payload = JSON.stringify({ event: "payment.captured", id: "evt_123" });
      const validSig = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest("hex");

      expect(verifyWebhookSignature(payload, validSig)).toBe(true);
      expect(verifyWebhookSignature(payload, "wrong_sig")).toBe(false);
    });
  });

  describe("Address API (/api/addresses)", () => {
    let createdAddressId: string;

    it("rejects unauthenticated requests with 401", async () => {
      const req = new NextRequest("http://localhost:3000/api/addresses");
      const res = await AddressesGET(req);
      expect(res.status).toBe(401);
    });

    it("creates a new address and automatically sets default for first address", async () => {
      const req = new NextRequest("http://localhost:3000/api/addresses", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Checkout Tester",
          phone: "9876500008",
          line1: "Flat 402, Sunshine Heights, MG Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
          type: "Home",
        }),
      });

      const res = await AddressesPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.address.id).toBeDefined();
      expect(data.address.isDefault).toBe(true);
      createdAddressId = data.address.id;
    });

    it("lists addresses ordered by default first", async () => {
      const req = new NextRequest("http://localhost:3000/api/addresses", {
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
        },
      });

      const res = await AddressesGET(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.addresses.length).toBeGreaterThanOrEqual(1);
      expect(data.addresses[0].id).toBe(createdAddressId);
    });

    it("updates address and toggles fields via PATCH", async () => {
      const req = new NextRequest("http://localhost:3000/api/addresses", {
        method: "PATCH",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: createdAddressId,
          line2: "Opposite Metro Pillar 120",
        }),
      });

      const res = await AddressesPATCH(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.address.line2).toBe("Opposite Metro Pillar 120");
    });
  });

  describe("Checkout Quote API (/api/checkout/quote)", () => {
    let addressId: string;

    it("returns quote with standard delivery and fees", async () => {
      const addr = await db.address.findFirst({ where: { userId: testUser.id } });
      addressId = addr!.id;

      // Add 1 headphone variant (₹2,999) to cart -> free delivery (>= ₹999)
      await db.cartItem.deleteMany({ where: { userId: testUser.id } });
      await db.cartItem.create({
        data: { userId: testUser.id, variantId: testVariantId, qty: 1 },
      });

      const req = new NextRequest("http://localhost:3000/api/checkout/quote", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId,
          delivery: "standard",
          paymentMethod: "upi",
        }),
      });

      const res = await QuotePOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.subtotalPaise).toBe(2999_00);
      expect(data.shippingPaise).toBe(0); // Free shipping because >= ₹999
      expect(data.codFeePaise).toBe(0);
      expect(data.totalPaise).toBe(2999_00);
      expect(data.codAvailable).toBe(true);
    });

    it("adds ₹149 for express delivery and ₹49 for COD", async () => {
      const req = new NextRequest("http://localhost:3000/api/checkout/quote", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId,
          delivery: "express",
          paymentMethod: "cod",
        }),
      });

      const res = await QuotePOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.expressFeePaise).toBe(149_00);
      expect(data.codFeePaise).toBe(49_00);
      expect(data.totalPaise).toBe(2999_00 + 149_00 + 49_00);
    });

    it("enforces ₹10,000 max COD threshold (spec §5)", async () => {
      // Put 2 chairs into user's cart: 2 × ₹8,999 = ₹17,998 (> ₹10,000)
      await db.cartItem.deleteMany({ where: { userId: testUser.id } });
      await db.cartItem.create({
        data: { userId: testUser.id, variantId: chairVariantId, qty: 2 },
      });

      const req = new NextRequest("http://localhost:3000/api/checkout/quote", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId,
          delivery: "standard",
          paymentMethod: "cod",
        }),
      });

      const res = await QuotePOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.codAvailable).toBe(false);
      // Auto-reverts paymentMethod from COD to UPI
      expect(data.paymentMethod).toBe("upi");
      expect(data.codFeePaise).toBe(0);
    });
  });

  describe("Order Creation & Verification (/api/checkout/create-order & /verify)", () => {
    let addressId: string;
    let initialStock: number;

    it("creates and directly confirms a COD order (spec §6)", async () => {
      const addr = await db.address.findFirst({ where: { userId: testUser.id } });
      addressId = addr!.id;

      // Set variant stock and put in cart
      const variantBefore = await db.variant.findUnique({ where: { id: testVariantId } });
      initialStock = variantBefore!.stock;

      await db.cartItem.deleteMany({ where: { userId: testUser.id } });
      await db.cartItem.create({
        data: { userId: testUser.id, variantId: testVariantId, qty: 2 },
      });

      const req = new NextRequest("http://localhost:3000/api/checkout/create-order", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId,
          delivery: "standard",
          paymentMethod: "cod",
        }),
      });

      const res = await CreateOrderPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.isCod).toBe(true);
      expect(data.status).toBe("CONFIRMED");
      expect(data.orderId).toMatch(/^SM\d+$/);

      // Verify stock was decremented by 2
      const variantAfter = await db.variant.findUnique({ where: { id: testVariantId } });
      expect(variantAfter!.stock).toBe(initialStock - 2);

      // Verify cart was cleared
      const remainingCart = await db.cartItem.count({ where: { userId: testUser.id } });
      expect(remainingCart).toBe(0);

      // Verify order event was recorded
      const events = await db.orderEvent.findMany({ where: { orderId: data.orderId } });
      expect(events.some((e) => e.status === "CONFIRMED")).toBe(true);
    });

    it("creates a PENDING_PAYMENT order for online payments and completes with /verify", async () => {
      // Put 1 item in cart
      await db.cartItem.deleteMany({ where: { userId: testUser.id } });
      await db.cartItem.create({
        data: { userId: testUser.id, variantId: testVariantId, qty: 1 },
      });

      const createReq = new NextRequest("http://localhost:3000/api/checkout/create-order", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId,
          delivery: "standard",
          paymentMethod: "upi",
        }),
      });

      const createRes = await CreateOrderPOST(createReq);
      expect(createRes.status).toBe(200);
      const createData = await createRes.json();
      expect(createData.success).toBe(true);
      expect(createData.isCod).toBe(false);
      expect(createData.razorpayOrderId).toBeDefined();

      const orderId = createData.orderId;
      const rzpOrderId = createData.razorpayOrderId;
      const rzpPaymentId = `pay_online_${Date.now()}`;

      // Order should initially be PENDING_PAYMENT
      const initialOrder = await db.order.findUnique({ where: { id: orderId } });
      expect(initialOrder!.status).toBe("PENDING_PAYMENT");

      // Verify with simulated signature
      const verifyReq = new NextRequest("http://localhost:3000/api/checkout/verify", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId,
          razorpay_signature: "simulated_success",
        }),
      });

      const verifyRes = await VerifyPOST(verifyReq);
      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      expect(verifyData.success).toBe(true);
      expect(verifyData.redirectUrl).toBe(`/order/${orderId}/confirmed`);

      // Verify order updated to CONFIRMED with payment ID
      const confirmedOrder = await db.order.findUnique({ where: { id: orderId } });
      expect(confirmedOrder!.status).toBe("CONFIRMED");
      expect(confirmedOrder!.razorpayPaymentId).toBe(rzpPaymentId);

      // Verify idempotency
      const idempotentReq = new NextRequest("http://localhost:3000/api/checkout/verify", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: rzpPaymentId,
          razorpay_signature: "simulated_success",
        }),
      });
      const idempotentRes = await VerifyPOST(idempotentReq);
      expect(idempotentRes.status).toBe(200);
      const idempotentData = await idempotentRes.json();
      expect(idempotentData.success).toBe(true);
    });

    it("rejects invalid signature in /verify", async () => {
      // Create another order
      await db.cartItem.deleteMany({ where: { userId: testUser.id } });
      await db.cartItem.create({
        data: { userId: testUser.id, variantId: testVariantId, qty: 1 },
      });

      const createReq = new NextRequest("http://localhost:3000/api/checkout/create-order", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          addressId,
          delivery: "standard",
          paymentMethod: "card",
        }),
      });

      const createRes = await CreateOrderPOST(createReq);
      const createData = await createRes.json();

      const verifyReq = new NextRequest("http://localhost:3000/api/checkout/verify", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: createData.orderId,
          razorpay_order_id: createData.razorpayOrderId,
          razorpay_payment_id: "pay_bad_123",
          razorpay_signature: "fake_tampered_signature",
        }),
      });

      const verifyRes = await VerifyPOST(verifyReq);
      expect(verifyRes.status).toBe(400);
      const data = await verifyRes.json();
      expect(data.error).toContain("Invalid signature");
    });
  });

  describe("Razorpay Webhook (/api/webhooks/razorpay)", () => {
    it("handles payment.captured webhook idempotently", async () => {
      // Create a PENDING_PAYMENT order in DB
      const rzpOrderId = `order_webhook_${Date.now()}`;
      const rzpPaymentId = `pay_webhook_${Date.now()}`;
      const order = await db.order.create({
        data: {
          id: `SM${Date.now().toString().slice(-5)}`,
          userId: testUser.id,
          status: "PENDING_PAYMENT",
          addressSnapshot: { city: "Bengaluru" },
          delivery: "standard",
          paymentMethod: "upi",
          subtotalPaise: 2999_00,
          discountPaise: 0,
          shippingPaise: 0,
          feesPaise: 0,
          totalPaise: 2999_00,
          razorpayOrderId: rzpOrderId,
          items: {
            create: [
              {
                variantId: testVariantId,
                name: "Wireless Headphones",
                image: "/images/headphones.jpg",
                unitPaise: 2999_00,
                qty: 1,
              },
            ],
          },
        },
      });

      const payload = JSON.stringify({
        event: "payment.captured",
        payload: {
          payment: {
            entity: {
              id: rzpPaymentId,
              order_id: rzpOrderId,
              amount: 299900,
              status: "captured",
            },
          },
        },
      });

      const sig = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(payload)
        .digest("hex");

      const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
        method: "POST",
        headers: {
          "x-razorpay-signature": sig,
          "Content-Type": "application/json",
        },
        body: payload,
      });

      const res = await WebhookPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ok");

      // Verify order confirmed in DB
      const updated = await db.order.findUnique({ where: { id: order.id } });
      expect(updated!.status).toBe("CONFIRMED");
      expect(updated!.razorpayPaymentId).toBe(rzpPaymentId);
    });

    it("rejects webhooks with invalid signatures", async () => {
      const payload = JSON.stringify({ event: "payment.captured" });
      const req = new NextRequest("http://localhost:3000/api/webhooks/razorpay", {
        method: "POST",
        headers: {
          "x-razorpay-signature": "tampered_sig",
          "Content-Type": "application/json",
        },
        body: payload,
      });

      const res = await WebhookPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Invalid webhook signature");
    });
  });
});
