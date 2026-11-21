import { afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
  revalidateTag: () => {},
}));

import { NextRequest } from "next/server";
import { POST as LoginPOST } from "../app/api/admin/auth/login/route";
import { POST as LogoutPOST } from "../app/api/admin/auth/logout/route";
import { GET as MeGET } from "../app/api/admin/auth/me/route";
import { GET as StatsGET } from "../app/api/admin/stats/route";
import {
  GET as ProductsGET,
  POST as ProductsPOST,
} from "../app/api/admin/products/route";
import {
  GET as ProductByIdGET,
  PATCH as ProductByIdPATCH,
  DELETE as ProductByIdDELETE,
} from "../app/api/admin/products/[id]/route";
import {
  GET as InventoryGET,
  PATCH as InventoryPATCH,
} from "../app/api/admin/inventory/route";
import { GET as OrdersGET } from "../app/api/admin/orders/route";
import { GET as OrderByIdGET } from "../app/api/admin/orders/[id]/route";
import { PATCH as OrderStatusPATCH } from "../app/api/admin/orders/[id]/status/route";
import { POST as OrderRefundPOST } from "../app/api/admin/orders/[id]/refund/route";
import {
  GET as CouponsGET,
  POST as CouponsPOST,
  PATCH as CouponsPATCH,
  DELETE as CouponsDELETE,
} from "../app/api/admin/coupons/route";
import { db } from "../lib/db";
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE,
  ADMIN_SECRET_PASSCODE,
} from "../lib/admin-session";

describe("Admin Console & APIs (Phase 11)", () => {
  let adminCookie: string;
  let testCategoryId: string;
  let createdProductId: string;
  let createdVariantId: string;
  let testOrderId: string;
  let testUser: { id: string; phone: string; name: string };
  let restockVariantId: string;
  let initialStockBeforeOrder: number;

  it("authenticates admin via login, me, and logout routes", async () => {
    // 1. Rejected with invalid passcode
    const invalidLoginReq = new NextRequest(
      "http://localhost:3000/api/admin/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: "wrongpass" }),
      }
    );
    const invalidRes = await LoginPOST(invalidLoginReq);
    expect(invalidRes.status).toBe(401);

    // 2. Successful login with ADMIN_SECRET_PASSCODE
    const validLoginReq = new NextRequest(
      "http://localhost:3000/api/admin/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: ADMIN_SECRET_PASSCODE }),
      }
    );
    const validRes = await LoginPOST(validLoginReq);
    expect(validRes.status).toBe(200);
    const validBody = await validRes.json();
    expect(validBody.success).toBe(true);

    // Create session token for subsequent tests
    const token = await signAdminSession("admin");
    adminCookie = `${ADMIN_SESSION_COOKIE}=${token}`;

    // 3. GET /api/admin/auth/me returns authenticated status
    const meReq = new NextRequest("http://localhost:3000/api/admin/auth/me", {
      headers: { cookie: adminCookie },
    });
    const meRes = await MeGET(meReq);
    expect(meRes.status).toBe(200);
    const meBody = await meRes.json();
    expect(meBody.authenticated).toBe(true);
    expect(meBody.username).toBe("admin");

    // 4. POST /api/admin/auth/logout clears cookie
    const logoutRes = await LogoutPOST();
    expect(logoutRes.status).toBe(200);
  });

  it("fetches dashboard stats", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/stats", {
      headers: { cookie: adminCookie },
    });
    const res = await StatsGET(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty("revenuePaise");
    expect(body).toHaveProperty("totalOrders");
    expect(body).toHaveProperty("products");
    expect(body).toHaveProperty("lowStockVariants");
    expect(body).toHaveProperty("recentOrders");
    expect(Array.isArray(body.recentOrders)).toBe(true);
    expect(body).toHaveProperty("statusCounts");
  });

  it("handles product CRUD operations with cache revalidation", async () => {
    // 1. Fetch category
    const cat = await db.category.findFirst();
    expect(cat).toBeTruthy();
    testCategoryId = cat!.id;

    // 2. Create product
    const testSku = `SKU-ADM-${Date.now().toString().slice(-4)}`;
    const createReq = new NextRequest(
      "http://localhost:3000/api/admin/products",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          name: "Admin Test Product",
          slug: `admin-test-product-${Date.now()}`,
          description: "A test product created by the admin test suite.",
          categoryId: testCategoryId,
          images: ["/images/products/backpack.jpg"],
          pricePaise: 159900,
          mrpPaise: 249900,
          isActive: false,
          isBestSeller: false,
          optionName: "Color",
          variants: [
            {
              value: "Space Grey",
              sku: testSku,
              stock: 45,
            },
          ],
        }),
      }
    );

    const createRes = await ProductsPOST(createReq);
    expect([200, 201]).toContain(createRes.status);
    const createBody = await createRes.json();
    expect(createBody.success).toBe(true);
    expect(createBody.product.name).toBe("Admin Test Product");
    expect(createBody.product.variants.length).toBe(1);

    createdProductId = createBody.product.id;
    createdVariantId = createBody.product.variants[0].id;

    // 3. GET /api/admin/products/[id]
    const getByIdReq = new NextRequest(
      `http://localhost:3000/api/admin/products/${createdProductId}`,
      {
        headers: { cookie: adminCookie },
      }
    );
    const getByIdRes = await ProductByIdGET(getByIdReq, {
      params: Promise.resolve({ id: createdProductId }),
    });
    expect(getByIdRes.status).toBe(200);
    const getByIdBody = await getByIdRes.json();
    expect(getByIdBody.product.id).toBe(createdProductId);

    // 4. PATCH /api/admin/products/[id]
    const patchReq = new NextRequest(
      `http://localhost:3000/api/admin/products/${createdProductId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          name: "Admin Test Product Updated",
          pricePaise: 179900,
        }),
      }
    );
    const patchRes = await ProductByIdPATCH(patchReq, {
      params: Promise.resolve({ id: createdProductId }),
    });
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.product.name).toBe("Admin Test Product Updated");
    expect(patchBody.product.pricePaise).toBe(179900);

    // 5. DELETE /api/admin/products/[id]
    const deleteReq = new NextRequest(
      `http://localhost:3000/api/admin/products/${createdProductId}`,
      {
        method: "DELETE",
        headers: { cookie: adminCookie },
      }
    );
    const deleteRes = await ProductByIdDELETE(deleteReq, {
      params: Promise.resolve({ id: createdProductId }),
    });
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.deleted).toBe(true);
  });

  it("manages inventory stock levels directly and via delta increments", async () => {
    // Pick an existing variant for inventory testing
    const variant = await db.variant.findFirst({
      where: { product: { slug: "travel-backpack" } },
    });
    expect(variant).toBeTruthy();
    const vId = variant!.id;
    const originalStock = variant!.stock;

    // 1. Direct update to 40
    const directReq = new NextRequest(
      "http://localhost:3000/api/admin/inventory",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          variantId: vId,
          stock: 40,
        }),
      }
    );
    const directRes = await InventoryPATCH(directReq);
    expect(directRes.status).toBe(200);
    const directBody = await directRes.json();
    expect(directBody.variant.stock).toBe(40);

    // 2. Delta update +5
    const deltaReq = new NextRequest(
      "http://localhost:3000/api/admin/inventory",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          variantId: vId,
          delta: 5,
        }),
      }
    );
    const deltaRes = await InventoryPATCH(deltaReq);
    expect(deltaRes.status).toBe(200);
    const deltaBody = await deltaRes.json();
    expect(deltaBody.variant.stock).toBe(45);

    // 3. Restore original stock
    await db.variant.update({
      where: { id: vId },
      data: { stock: originalStock },
    });

    // 4. GET /api/admin/inventory
    const invListReq = new NextRequest(
      "http://localhost:3000/api/admin/inventory",
      {
        headers: { cookie: adminCookie },
      }
    );
    const invListRes = await InventoryGET(invListReq);
    expect(invListRes.status).toBe(200);
    const invListBody = await invListRes.json();
    expect(Array.isArray(invListBody.variants)).toBe(true);
  });

  it("progresses order status through confirmed -> packed -> shipped with AWB -> delivered", async () => {
    // 1. Setup a test user and an order
    const phone = "+919876543299";
    const user = await db.user.upsert({
      where: { phone },
      update: { name: "Admin Test Buyer" },
      create: { phone, name: "Admin Test Buyer" },
    });
    testUser = { id: user.id, phone: user.phone, name: user.name };

    const variant = await db.variant.findFirst({
      include: { product: true },
    });
    expect(variant).toBeTruthy();

    testOrderId = `SM-ADM-${Date.now().toString().slice(-5)}`;
    const order = await db.order.create({
      data: {
        id: testOrderId,
        userId: testUser.id,
        status: "CONFIRMED",
        delivery: "standard",
        paymentMethod: "upi",
        subtotalPaise: 199900,
        discountPaise: 0,
        shippingPaise: 0,
        feesPaise: 0,
        totalPaise: 199900,
        razorpayPaymentId: `pay_test_${Date.now()}`,
        addressSnapshot: {
          name: "Admin Test Buyer",
          line1: "123 Test Road",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
        items: {
          create: [
            {
              variantId: variant!.id,
              name: variant!.product.name,
              option: variant!.value,
              image: "/images/products/backpack.jpg",
              unitPaise: 199900,
              qty: 1,
            },
          ],
        },
        events: {
          create: [
            {
              status: "CONFIRMED",
              note: "Order confirmed automatically upon payment",
            },
          ],
        },
      },
    });

    // 2. Admin advances to PACKED
    const packedReq = new NextRequest(
      `http://localhost:3000/api/admin/orders/${testOrderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          status: "PACKED",
          note: "Packed in Bengaluru warehouse",
        }),
      }
    );
    const packedRes = await OrderStatusPATCH(packedReq, {
      params: Promise.resolve({ id: testOrderId }),
    });
    expect(packedRes.status).toBe(200);
    const packedBody = await packedRes.json();
    expect(packedBody.order.status).toBe("PACKED");

    // 3. Admin advances to SHIPPED with AWB
    const shippedReq = new NextRequest(
      `http://localhost:3000/api/admin/orders/${testOrderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          status: "SHIPPED",
          awb: "BD-TEST-998877",
          note: "Dispatched with BlueDart",
        }),
      }
    );
    const shippedRes = await OrderStatusPATCH(shippedReq, {
      params: Promise.resolve({ id: testOrderId }),
    });
    expect(shippedRes.status).toBe(200);
    const shippedBody = await shippedRes.json();
    expect(shippedBody.order.status).toBe("SHIPPED");
    expect(shippedBody.order.awb).toBe("BD-TEST-998877");

    // 4. Admin advances to DELIVERED
    const deliveredReq = new NextRequest(
      `http://localhost:3000/api/admin/orders/${testOrderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          status: "DELIVERED",
          note: "Delivered to recipient",
        }),
      }
    );
    const deliveredRes = await OrderStatusPATCH(deliveredReq, {
      params: Promise.resolve({ id: testOrderId }),
    });
    expect(deliveredRes.status).toBe(200);
    const deliveredBody = await deliveredRes.json();
    expect(deliveredBody.order.status).toBe("DELIVERED");
  });

  it("restocks inventory when order is cancelled by admin", async () => {
    // 1. Pick variant and record stock
    const variant = await db.variant.findFirst({
      where: { product: { slug: "travel-backpack" } },
      include: { product: true },
    });
    expect(variant).toBeTruthy();
    restockVariantId = variant!.id;
    initialStockBeforeOrder = variant!.stock;

    // 2. Create order with 2 items
    const cancelOrderId = `SM-CNCL-${Date.now().toString().slice(-5)}`;
    await db.order.create({
      data: {
        id: cancelOrderId,
        userId: testUser.id,
        status: "CONFIRMED",
        delivery: "standard",
        paymentMethod: "cod",
        subtotalPaise: 200000,
        discountPaise: 0,
        shippingPaise: 0,
        feesPaise: 0,
        totalPaise: 200000,
        addressSnapshot: {
          name: "Cancel Test User",
          line1: "456 Test Street",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560001",
        },
        items: {
          create: [
            {
              variantId: restockVariantId,
              name: variant!.product.name,
              option: variant!.value,
              image: "/images/products/backpack.jpg",
              unitPaise: 100000,
              qty: 2,
            },
          ],
        },
      },
    });

    // 3. Cancel order via Admin PATCH
    const cancelReq = new NextRequest(
      `http://localhost:3000/api/admin/orders/${cancelOrderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          status: "CANCELLED",
          note: "Cancelled by admin due to stock discrepancy",
        }),
      }
    );
    const cancelRes = await OrderStatusPATCH(cancelReq, {
      params: Promise.resolve({ id: cancelOrderId }),
    });
    expect(cancelRes.status).toBe(200);

    // 4. Verify stock incremented by 2
    const updatedVariant = await db.variant.findUnique({
      where: { id: restockVariantId },
    });
    expect(updatedVariant!.stock).toBe(initialStockBeforeOrder + 2);

    // Restore stock to clean up
    await db.variant.update({
      where: { id: restockVariantId },
      data: { stock: initialStockBeforeOrder },
    });
  });

  it("processes refunds via admin refund endpoint", async () => {
    // 1. Create a return requested order
    const refundOrderId = `SM-REF-${Date.now().toString().slice(-5)}`;
    const variant = await db.variant.findFirst({
      include: { product: true },
    });

    await db.order.create({
      data: {
        id: refundOrderId,
        userId: testUser.id,
        status: "RETURN_REQUESTED",
        delivery: "standard",
        paymentMethod: "cod",
        subtotalPaise: 149900,
        discountPaise: 0,
        shippingPaise: 0,
        feesPaise: 0,
        totalPaise: 149900,
        addressSnapshot: {
          name: "Refund Buyer",
          line1: "789 Refund St",
          city: "Mumbai",
          state: "Maharashtra",
          pincode: "400001",
        },
        items: {
          create: [
            {
              variantId: variant!.id,
              name: variant!.product.name,
              option: variant!.value,
              image: "/images/products/backpack.jpg",
              unitPaise: 149900,
              qty: 1,
            },
          ],
        },
        events: {
          create: [
            {
              status: "RETURN_REQUESTED",
              note: "Customer requested return: Size does not fit",
            },
          ],
        },
      },
    });

    // 2. Call admin refund POST
    const refundReq = new NextRequest(
      `http://localhost:3000/api/admin/orders/${refundOrderId}/refund`,
      {
        method: "POST",
        headers: { cookie: adminCookie },
      }
    );
    const refundRes = await OrderRefundPOST(refundReq, {
      params: Promise.resolve({ id: refundOrderId }),
    });
    expect(refundRes.status).toBe(200);
    const refundBody = await refundRes.json();
    expect(refundBody.success).toBe(true);
    expect(refundBody.order.status).toBe("REFUNDED");
  });

  it("performs coupon CRUD operations (create, read, toggle status, delete)", async () => {
    const couponCode = `TESTADM${Date.now().toString().slice(-4)}`;

    // 1. Create coupon
    const createReq = new NextRequest(
      "http://localhost:3000/api/admin/coupons",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          code: couponCode,
          type: "percent",
          value: 15,
          minOrderPaise: 50000,
          maxDiscountPaise: 20000,
          isActive: true,
          perUserLimit: 2,
        }),
      }
    );
    const createRes = await CouponsPOST(createReq);
    expect(createRes.status).toBe(200);
    const createBody = await createRes.json();
    expect(createBody.success).toBe(true);
    expect(createBody.coupon.code).toBe(couponCode);
    expect(createBody.coupon.value).toBe(15);

    // 2. GET all coupons
    const listReq = new NextRequest("http://localhost:3000/api/admin/coupons", {
      headers: { cookie: adminCookie },
    });
    const listRes = await CouponsGET(listReq);
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    const found = listBody.coupons.find((c: any) => c.code === couponCode);
    expect(found).toBeTruthy();

    // 3. PATCH coupon (toggle inactive)
    const patchReq = new NextRequest(
      "http://localhost:3000/api/admin/coupons",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: adminCookie,
        },
        body: JSON.stringify({
          code: couponCode,
          isActive: false,
        }),
      }
    );
    const patchRes = await CouponsPATCH(patchReq);
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.coupon.isActive).toBe(false);

    // 4. DELETE coupon
    const deleteReq = new NextRequest(
      `http://localhost:3000/api/admin/coupons?code=${couponCode}`,
      {
        method: "DELETE",
        headers: { cookie: adminCookie },
      }
    );
    const deleteRes = await CouponsDELETE(deleteReq);
    expect(deleteRes.status).toBe(200);
    const deleteBody = await deleteRes.json();
    expect(deleteBody.success).toBe(true);

    // Verify coupon is removed
    const verifyCoupon = await db.coupon.findUnique({
      where: { code: couponCode },
    });
    expect(verifyCoupon).toBeNull();
  });

  afterAll(async () => {
    // Clean up test orders and user created in admin test
    if (testUser?.id) {
      await db.order.deleteMany({ where: { userId: testUser.id } });
      await db.user.deleteMany({ where: { id: testUser.id } });
    }
    // Clean up test product if still present
    await db.product.deleteMany({
      where: { slug: { startsWith: "admin-test-product-" } },
    });
  });
});
