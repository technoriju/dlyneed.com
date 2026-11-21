import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

import { NextRequest } from "next/server";
import { GET as OrdersGET } from "../app/api/orders/route";
import { GET as OrderByIdGET } from "../app/api/orders/[id]/route";
import { POST as CancelOrderPOST } from "../app/api/orders/[id]/cancel/route";
import { POST as ReturnOrderPOST } from "../app/api/orders/[id]/return/route";
import {
  GET as AddressesGET,
  POST as AddressesPOST,
  PATCH as AddressesPATCH,
  DELETE as AddressesDELETE,
} from "../app/api/addresses/route";
import { POST as ProfilePOST } from "../app/api/auth/profile/route";
import { db } from "../lib/db";
import { signSession, SESSION_COOKIE_NAME } from "../lib/session";

describe("Account Area, Orders & Addresses (Step 9)", () => {
  let testUser: { id: string; phone: string; name: string };
  let otherUser: { id: string; phone: string; name: string };
  let sessionCookie: string;
  let otherSessionCookie: string;
  let testVariantId: string;
  let initialStock: number;

  it("sets up test users and seed products", async () => {
    // 1. Create main test user
    const phone = "+919876500009";
    const user = await db.user.upsert({
      where: { phone },
      update: { name: "Account Tester", email: "account@shopmate.test" },
      create: { phone, name: "Account Tester", email: "account@shopmate.test" },
    });
    testUser = { id: user.id, phone: user.phone, name: user.name };
    const token = await signSession({
      userId: user.id,
      phone: user.phone,
      name: user.name,
    });
    sessionCookie = `${SESSION_COOKIE_NAME}=${token}`;

    // 2. Create another user for ownership checks
    const otherPhone = "+919876500010";
    const other = await db.user.upsert({
      where: { phone: otherPhone },
      update: { name: "Other User" },
      create: { phone: otherPhone, name: "Other User" },
    });
    otherUser = { id: other.id, phone: other.phone, name: other.name };
    const otherToken = await signSession({
      userId: other.id,
      phone: other.phone,
      name: other.name,
    });
    otherSessionCookie = `${SESSION_COOKIE_NAME}=${otherToken}`;

    // Clean previous test data
    await db.orderEvent.deleteMany({
      where: { order: { userId: { in: [user.id, other.id] } } },
    });
    await db.orderItem.deleteMany({
      where: { order: { userId: { in: [user.id, other.id] } } },
    });
    await db.order.deleteMany({ where: { userId: { in: [user.id, other.id] } } });
    await db.address.deleteMany({ where: { userId: { in: [user.id, other.id] } } });

    // Pick backpack variant (independent from checkout.test.ts which tests headphones)
    const variant = await db.variant.findFirst({
      where: { product: { slug: "travel-backpack" } },
    });
    expect(variant).toBeDefined();
    testVariantId = variant!.id;
    initialStock = variant!.stock;
  });

  describe("Orders API (/api/orders and /api/orders/[id])", () => {
    let order1Id: string;
    let order2Id: string;
    let otherOrderId: string;

    it("rejects unauthorized access", async () => {
      const req = new NextRequest("http://localhost:3000/api/orders");
      const res = await OrdersGET(req);
      expect(res.status).toBe(401);
    });

    it("creates sample orders in database for testing", async () => {
      const order1 = await db.order.create({
        data: {
          id: `SM${Date.now()}1`,
          userId: testUser.id,
          status: "CONFIRMED",
          delivery: "standard",
          paymentMethod: "upi",
          subtotalPaise: 2999_00,
          discountPaise: 0,
          shippingPaise: 0,
          feesPaise: 0,
          totalPaise: 2999_00,
          razorpayOrderId: `rzp_order_${Date.now()}1`,
          razorpayPaymentId: `rzp_pay_${Date.now()}1`,
          addressSnapshot: {
            name: "Account Tester",
            phone: "9876500009",
            line1: "123 Main Road",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560001",
          },
          items: {
            create: [
              {
                variantId: testVariantId,
                name: "Wireless Headphones",
                option: "Graphite",
                image: "/images/products/headphones.jpg",
                unitPaise: 2999_00,
                qty: 1,
              },
            ],
          },
          events: {
            create: [
              {
                status: "CONFIRMED",
                note: "Order confirmed",
              },
            ],
          },
        },
      });
      order1Id = order1.id;

      const order2 = await db.order.create({
        data: {
          id: `SM${Date.now()}2`,
          userId: testUser.id,
          status: "DELIVERED",
          delivery: "express",
          paymentMethod: "card",
          subtotalPaise: 2999_00,
          discountPaise: 0,
          shippingPaise: 0,
          feesPaise: 149_00,
          totalPaise: 3148_00,
          razorpayOrderId: `rzp_order_${Date.now()}2`,
          razorpayPaymentId: `rzp_pay_${Date.now()}2`,
          addressSnapshot: {
            name: "Account Tester",
            phone: "9876500009",
            line1: "123 Main Road",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560001",
          },
          items: {
            create: [
              {
                variantId: testVariantId,
                name: "Wireless Headphones",
                option: "Graphite",
                image: "/images/products/headphones.jpg",
                unitPaise: 2999_00,
                qty: 1,
              },
            ],
          },
          events: {
            create: [
              {
                status: "CONFIRMED",
                note: "Order confirmed",
              },
              {
                status: "DELIVERED",
                note: "Delivered to customer",
              },
            ],
          },
        },
      });
      order2Id = order2.id;

      const otherOrder = await db.order.create({
        data: {
          id: `SM${Date.now()}9`,
          userId: otherUser.id,
          status: "CONFIRMED",
          delivery: "standard",
          paymentMethod: "cod",
          subtotalPaise: 2999_00,
          discountPaise: 0,
          shippingPaise: 0,
          feesPaise: 49_00,
          totalPaise: 3048_00,
          addressSnapshot: {
            name: "Other User",
            phone: "9876500010",
            line1: "456 Side Street",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
          },
          items: {
            create: [
              {
                variantId: testVariantId,
                name: "Wireless Headphones",
                option: "Graphite",
                image: "/images/products/headphones.jpg",
                unitPaise: 2999_00,
                qty: 1,
              },
            ],
          },
        },
      });
      otherOrderId = otherOrder.id;
    });

    it("fetches user orders with filtering support", async () => {
      // 1. All orders
      const reqAll = new NextRequest("http://localhost:3000/api/orders", {
        headers: { cookie: sessionCookie },
      });
      const resAll = await OrdersGET(reqAll);
      expect(resAll.status).toBe(200);
      const dataAll = await resAll.json();
      expect(dataAll.orders.length).toBe(2);
      expect(dataAll.orders.map((o: any) => o.id)).toContain(order1Id);
      expect(dataAll.orders.map((o: any) => o.id)).toContain(order2Id);
      expect(dataAll.orders.map((o: any) => o.id)).not.toContain(otherOrderId);

      // 2. Filter = active
      const reqActive = new NextRequest("http://localhost:3000/api/orders?filter=active", {
        headers: { cookie: sessionCookie },
      });
      const resActive = await OrdersGET(reqActive);
      const dataActive = await resActive.json();
      expect(dataActive.orders.length).toBe(1);
      expect(dataActive.orders[0].id).toBe(order1Id);

      // 3. Filter = delivered
      const reqDelivered = new NextRequest("http://localhost:3000/api/orders?filter=delivered", {
        headers: { cookie: sessionCookie },
      });
      const resDelivered = await OrdersGET(reqDelivered);
      const dataDelivered = await resDelivered.json();
      expect(dataDelivered.orders.length).toBe(1);
      expect(dataDelivered.orders[0].id).toBe(order2Id);
    });

    it("fetches single order by id with ownership enforcement", async () => {
      // 1. Own order
      const req = new NextRequest(`http://localhost:3000/api/orders/${order1Id}`, {
        headers: { cookie: sessionCookie },
      });
      const res = await OrderByIdGET(req, { params: Promise.resolve({ id: order1Id }) });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.order.id).toBe(order1Id);
      expect(data.order.items.length).toBe(1);
      expect(data.order.events.length).toBeGreaterThan(0);

      // 2. Someone else's order -> 404
      const otherReq = new NextRequest(`http://localhost:3000/api/orders/${otherOrderId}`, {
        headers: { cookie: sessionCookie },
      });
      const otherRes = await OrderByIdGET(otherReq, { params: Promise.resolve({ id: otherOrderId }) });
      expect(otherRes.status).toBe(404);
    });
  });

  describe("Order Cancellation & Restock (/api/orders/[id]/cancel)", () => {
    let cancelableOrderId: string;

    it("creates a confirmed order to test cancellation", async () => {
      // Temporarily decrement stock to simulate order checkout
      await db.variant.update({
        where: { id: testVariantId },
        data: { stock: { decrement: 1 } },
      });

      const order = await db.order.create({
        data: {
          id: `SM${Date.now()}3`,
          userId: testUser.id,
          status: "CONFIRMED",
          delivery: "standard",
          paymentMethod: "upi",
          subtotalPaise: 2999_00,
          discountPaise: 0,
          shippingPaise: 0,
          feesPaise: 0,
          totalPaise: 2999_00,
          razorpayOrderId: `rzp_order_${Date.now()}3`,
          razorpayPaymentId: `rzp_pay_${Date.now()}3`,
          addressSnapshot: {
            name: "Account Tester",
            phone: "9876500009",
            line1: "123 Main Road",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560001",
          },
          items: {
            create: [
              {
                variantId: testVariantId,
                name: "Wireless Headphones",
                option: "Graphite",
                image: "/images/products/headphones.jpg",
                unitPaise: 2999_00,
                qty: 1,
              },
            ],
          },
          events: {
            create: [{ status: "CONFIRMED", note: "Order placed" }],
          },
        },
      });
      cancelableOrderId = order.id;
    });

    it("cancels confirmed order, triggers refund, and restocks variant", async () => {
      const stockBefore = (await db.variant.findUnique({ where: { id: testVariantId } }))!.stock;

      const req = new NextRequest(`http://localhost:3000/api/orders/${cancelableOrderId}/cancel`, {
        method: "POST",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason: "Ordered by mistake" }),
      });

      const res = await CancelOrderPOST(req, {
        params: Promise.resolve({ id: cancelableOrderId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.order.status).toBe("CANCELLED");

      // Verify stock incremented back
      const stockAfter = (await db.variant.findUnique({ where: { id: testVariantId } }))!.stock;
      expect(stockAfter).toBe(stockBefore + 1);

      // Verify CANCELLED event was recorded
      const dbOrder = await db.order.findUnique({
        where: { id: cancelableOrderId },
        include: { events: true },
      });
      expect(dbOrder!.status).toBe("CANCELLED");
      const cancelEvent = dbOrder!.events.find((e) => e.status === "CANCELLED");
      expect(cancelEvent).toBeDefined();
      expect(cancelEvent!.note).toContain("Ordered by mistake");
    });

    it("rejects cancellation of already cancelled order", async () => {
      const req = new NextRequest(`http://localhost:3000/api/orders/${cancelableOrderId}/cancel`, {
        method: "POST",
        headers: { cookie: sessionCookie },
      });

      const res = await CancelOrderPOST(req, {
        params: Promise.resolve({ id: cancelableOrderId }),
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Only confirmed or packed orders can be cancelled");
    });
  });

  describe("Order Returns (/api/orders/[id]/return)", () => {
    let deliveredOrderId: string;

    it("creates a delivered order to test return flow", async () => {
      const order = await db.order.create({
        data: {
          id: `SM${Date.now()}4`,
          userId: testUser.id,
          status: "DELIVERED",
          delivery: "standard",
          paymentMethod: "upi",
          subtotalPaise: 2999_00,
          discountPaise: 0,
          shippingPaise: 0,
          feesPaise: 0,
          totalPaise: 2999_00,
          addressSnapshot: {
            name: "Account Tester",
            phone: "9876500009",
            line1: "123 Main Road",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560001",
          },
          items: {
            create: [
              {
                variantId: testVariantId,
                name: "Wireless Headphones",
                option: "Graphite",
                image: "/images/products/headphones.jpg",
                unitPaise: 2999_00,
                qty: 1,
              },
            ],
          },
          events: {
            create: [
              { status: "CONFIRMED", note: "Order placed" },
              { status: "DELIVERED", note: "Package delivered", at: new Date() },
            ],
          },
        },
      });
      deliveredOrderId = order.id;
    });

    it("requests return on delivered order within 30 days", async () => {
      const req = new NextRequest(`http://localhost:3000/api/orders/${deliveredOrderId}/return`, {
        method: "POST",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: JSON.stringify({ reason: "Size or fit issue" }),
      });

      const res = await ReturnOrderPOST(req, {
        params: Promise.resolve({ id: deliveredOrderId }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.order.status).toBe("RETURN_REQUESTED");

      const dbOrder = await db.order.findUnique({
        where: { id: deliveredOrderId },
        include: { events: true },
      });
      expect(dbOrder!.status).toBe("RETURN_REQUESTED");
      const returnEvent = dbOrder!.events.find((e) => e.status === "RETURN_REQUESTED");
      expect(returnEvent).toBeDefined();
      expect(returnEvent!.note).toContain("Size or fit issue");
    });
  });

  describe("Address Management (/api/addresses)", () => {
    let createdAddrId: string;

    it("creates, edits, sets default, and deletes an address", async () => {
      // 1. Create address
      const postReq = new NextRequest("http://localhost:3000/api/addresses", {
        method: "POST",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Tester Home",
          phone: "9876543210",
          line1: "Flat 101, Sunshine Heights",
          line2: "Near Metro",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
          type: "Home",
          isDefault: true,
        }),
      });

      const postRes = await AddressesPOST(postReq);
      expect(postRes.status).toBe(200);
      const postData = await postRes.json();
      expect(postData.success).toBe(true);
      expect(postData.address.name).toBe("Tester Home");
      expect(postData.address.isDefault).toBe(true);
      createdAddrId = postData.address.id;

      // 2. Fetch addresses
      const getReq = new NextRequest("http://localhost:3000/api/addresses", {
        headers: { cookie: sessionCookie },
      });
      const getRes = await AddressesGET(getReq);
      const getData = await getRes.json();
      expect(getData.addresses.length).toBe(1);
      expect(getData.addresses[0].id).toBe(createdAddrId);

      // 3. Edit address
      const patchReq = new NextRequest("http://localhost:3000/api/addresses", {
        method: "PATCH",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: createdAddrId,
          name: "Tester Office",
          type: "Work",
        }),
      });
      const patchRes = await AddressesPATCH(patchReq);
      expect(patchRes.status).toBe(200);
      const patchData = await patchRes.json();
      expect(patchData.address.name).toBe("Tester Office");
      expect(patchData.address.type).toBe("Work");

      // 4. Delete address
      const delReq = new NextRequest(`http://localhost:3000/api/addresses?id=${createdAddrId}`, {
        method: "DELETE",
        headers: { cookie: sessionCookie },
      });
      const delRes = await AddressesDELETE(delReq);
      expect(delRes.status).toBe(200);

      const verifyGet = await AddressesGET(getReq);
      const verifyData = await verifyGet.json();
      expect(verifyData.addresses.length).toBe(0);
    });
  });

  describe("Profile Update (/api/auth/profile)", () => {
    it("updates name and email for logged in user", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/profile", {
        method: "POST",
        headers: {
          cookie: sessionCookie,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Account Tester Updated",
          email: "updated@shopmate.test",
        }),
      });

      const res = await ProfilePOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.user.name).toBe("Account Tester Updated");
      expect(data.user.email).toBe("updated@shopmate.test");

      const dbUser = await db.user.findUnique({ where: { id: testUser.id } });
      expect(dbUser!.name).toBe("Account Tester Updated");
      expect(dbUser!.email).toBe("updated@shopmate.test");
    });
  });
});
