import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

import { NextRequest } from "next/server";
import { GET, POST as CartPOST, PATCH, DELETE as CartDELETE } from "../app/api/cart/route";
import { POST as CouponPOST, DELETE as CouponDELETE } from "../app/api/cart/coupon/route";
import { db } from "../lib/db";
import {
  calculateCartTotals,
  calculateCouponDiscount,
  FREE_SHIPPING_THRESHOLD_PAISE,
  STANDARD_SHIPPING_FEE_PAISE,
} from "../lib/pricing";
import { signSession, SESSION_COOKIE_NAME } from "../lib/session";

describe("Cart & Wishlist (Step 6)", () => {
  describe("Pricing & Business Rules (Spec §5)", () => {
    it("calculates empty cart correctly", () => {
      const totals = calculateCartTotals([], null);
      expect(totals.itemCount).toBe(0);
      expect(totals.totalQty).toBe(0);
      expect(totals.subtotalPaise).toBe(0);
      expect(totals.mrpTotalPaise).toBe(0);
      expect(totals.shippingPaise).toBe(0);
      expect(totals.totalPaise).toBe(0);
      expect(totals.freeShippingMissingPaise).toBe(FREE_SHIPPING_THRESHOLD_PAISE);
      expect(totals.freeShippingProgressPct).toBe(0);
    });

    it("charges standard delivery fee (₹79) when order is below ₹999", () => {
      // 1 item of ₹599 (599_00 paise), MRP ₹999 (999_00 paise)
      const items = [{ pricePaise: 599_00, mrpPaise: 999_00, qty: 1 }];
      const totals = calculateCartTotals(items, null);

      expect(totals.subtotalPaise).toBe(599_00);
      expect(totals.mrpDiscountPaise).toBe(400_00);
      expect(totals.shippingPaise).toBe(STANDARD_SHIPPING_FEE_PAISE); // 79_00
      expect(totals.totalPaise).toBe(599_00 + 79_00);
      expect(totals.freeShippingMissingPaise).toBe(400_00); // 999 - 599 = 400
      expect(totals.freeShippingProgressPct).toBe(Math.round((599_00 / 999_00) * 100));
    });

    it("gives free delivery when order is ₹999 or more", () => {
      // 1 item of ₹1,999 (1999_00 paise)
      const items = [{ pricePaise: 1999_00, mrpPaise: 2999_00, qty: 1 }];
      const totals = calculateCartTotals(items, null);

      expect(totals.subtotalPaise).toBe(1999_00);
      expect(totals.shippingPaise).toBe(0);
      expect(totals.totalPaise).toBe(1999_00);
      expect(totals.freeShippingMissingPaise).toBe(0);
      expect(totals.freeShippingProgressPct).toBe(100);
    });

    it("applies WELCOME10 coupon (10% off up to ₹500)", () => {
      const welcomeCoupon = {
        code: "WELCOME10",
        type: "percent",
        value: 10,
        maxDiscountPaise: 500_00,
        minOrderPaise: 0,
        isActive: true,
        expiresAt: null,
      };

      // Case A: ₹2,999 subtotal -> 10% is ₹299.90 (299_90 paise)
      const resA = calculateCouponDiscount(welcomeCoupon, 2999_00);
      expect(resA.isValid).toBe(true);
      expect(resA.meetsMinOrder).toBe(true);
      expect(resA.discountPaise).toBe(299_90);

      // Case B: ₹8,999 subtotal -> 10% is ₹899.90, capped at ₹500 (500_00 paise)
      const resB = calculateCouponDiscount(welcomeCoupon, 8999_00);
      expect(resB.isValid).toBe(true);
      expect(resB.meetsMinOrder).toBe(true);
      expect(resB.discountPaise).toBe(500_00);
    });

    it("applies SAVE200 coupon (₹200 off orders over ₹1,999)", () => {
      const saveCoupon = {
        code: "SAVE200",
        type: "flat",
        value: 200_00,
        maxDiscountPaise: null,
        minOrderPaise: 1999_00,
        isActive: true,
        expiresAt: null,
      };

      // Below ₹1,999: subtotal ₹1,500
      const resBelow = calculateCouponDiscount(saveCoupon, 1500_00);
      expect(resBelow.isValid).toBe(true);
      expect(resBelow.meetsMinOrder).toBe(false);
      expect(resBelow.discountPaise).toBe(0);
      expect(resBelow.message).toContain("1999");

      // At ₹1,999
      const resAt = calculateCouponDiscount(saveCoupon, 1999_00);
      expect(resAt.isValid).toBe(true);
      expect(resAt.meetsMinOrder).toBe(true);
      expect(resAt.discountPaise).toBe(200_00);
    });

    it("recalculates free delivery threshold based on subtotal AFTER coupon", () => {
      // Subtotal ₹1,050. Coupon discount ₹105. After coupon = ₹945 (< ₹999).
      // Delivery fee of ₹79 must apply because (subtotal - coupon) < 999.
      const welcomeCoupon = {
        code: "WELCOME10",
        type: "percent",
        value: 10,
        maxDiscountPaise: 500_00,
        minOrderPaise: 0,
        isActive: true,
        expiresAt: null,
      };
      const items = [{ pricePaise: 1050_00, mrpPaise: 1500_00, qty: 1 }];
      const totals = calculateCartTotals(items, welcomeCoupon);

      expect(totals.subtotalPaise).toBe(1050_00);
      expect(totals.couponDiscountPaise).toBe(105_00);
      expect(totals.shippingPaise).toBe(STANDARD_SHIPPING_FEE_PAISE); // ₹79
      expect(totals.totalPaise).toBe(1050_00 - 105_00 + 79_00);
    });
  });

  describe("Coupon API Route (POST /api/cart/coupon)", () => {
    it("validates existing active coupons against DB", async () => {
      const req = new NextRequest("http://localhost:3000/api/cart/coupon", {
        method: "POST",
        body: JSON.stringify({ code: "WELCOME10", subtotalPaise: 2999_00 }),
      });
      const res = await CouponPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valid).toBe(true);
      expect(data.coupon.code).toBe("WELCOME10");
      expect(data.discountPaise).toBe(299_90);
    });

    it("returns 400 for non-existent coupon codes", async () => {
      const req = new NextRequest("http://localhost:3000/api/cart/coupon", {
        method: "POST",
        body: JSON.stringify({ code: "INVALID999" }),
      });
      const res = await CouponPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it("removes coupon via DELETE", async () => {
      const res = await CouponDELETE();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe("Cart API Route & Guest Storage (GET & POST /api/cart)", () => {
    it("hydrates and prices guest cart lines with server verification", async () => {
      // Find a valid variant from DB
      const variant = await db.variant.findFirst({
        where: { product: { slug: "wireless-headphones" } },
      });
      expect(variant).toBeDefined();

      const itemsParam = encodeURIComponent(
        JSON.stringify([{ variantId: variant!.id, qty: 2 }])
      );
      const req = new NextRequest(
        `http://localhost:3000/api/cart?items=${itemsParam}&coupon=SAVE200`
      );
      const res = await GET(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.items.length).toBe(1);
      expect(data.items[0].name).toBe("Wireless Headphones");
      expect(data.items[0].qty).toBe(2);
      expect(data.summary.subtotalPaise).toBe(2999_00 * 2);
      expect(data.summary.couponDiscountPaise).toBe(200_00);
      expect(data.summary.shippingPaise).toBe(0); // >= 999
    });

    it("supports logged in user cart operations and merging", async () => {
      // Create a test user
      const testPhone = "+919999988888";
      const user = await db.user.upsert({
        where: { phone: testPhone },
        update: {},
        create: { phone: testPhone, name: "Test User" },
      });

      const token = await signSession({ userId: user.id, phone: user.phone });

      const variant = await db.variant.findFirst({
        where: { product: { slug: "travel-backpack" } },
      });
      expect(variant).toBeDefined();

      // Add item to cart for logged in user
      const addReq = new NextRequest("http://localhost:3000/api/cart", {
        method: "POST",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({ variantId: variant!.id, qty: 1 }),
      });
      const addRes = await CartPOST(addReq);
      expect(addRes.status).toBe(200);

      // Verify item in user's DB cart
      const getReq = new NextRequest("http://localhost:3000/api/cart", {
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });
      const getRes = await GET(getReq);
      const getData = await getRes.json();
      expect(getData.user.id).toBe(user.id);
      expect(getData.items.some((i: { variantId: string }) => i.variantId === variant!.id)).toBe(true);

      // Update quantity
      const patchReq = new NextRequest("http://localhost:3000/api/cart", {
        method: "PATCH",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
        body: JSON.stringify({ variantId: variant!.id, qty: 3 }),
      });
      const patchRes = await PATCH(patchReq);
      expect(patchRes.status).toBe(200);

      // Cleanup cart item
      const delReq = new NextRequest(`http://localhost:3000/api/cart?variantId=${variant!.id}`, {
        method: "DELETE",
        headers: {
          Cookie: `${SESSION_COOKIE_NAME}=${token}`,
        },
      });
      const delRes = await CartDELETE(delReq);
      expect(delRes.status).toBe(200);

      // Clean up test user
      await db.user.delete({ where: { id: user.id } });
    });
  });
});
