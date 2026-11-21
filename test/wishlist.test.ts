import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

import { NextRequest } from "next/server";
import { GET, POST, DELETE } from "../app/api/wishlist/route";
import { db } from "../lib/db";
import { signSession, SESSION_COOKIE_NAME } from "../lib/session";

describe("Wishlist API Route (Step 6)", () => {
  it("hydrates guest wishlist product cards from ids query", async () => {
    const product = await db.product.findFirst({
      where: { slug: "wireless-headphones" },
    });
    expect(product).toBeDefined();

    const req = new NextRequest(
      `http://localhost:3000/api/wishlist?ids=${product!.id}`
    );
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.items.length).toBe(1);
    expect(data.items[0].slug).toBe("wireless-headphones");
    expect(data.productIds).toContain(product!.id);
  });

  it("handles logged in user wishlist operations (add, merge, delete)", async () => {
    const testPhone = "+919999977777";
    const user = await db.user.upsert({
      where: { phone: testPhone },
      update: {},
      create: { phone: testPhone, name: "Wishlist Test User" },
    });

    const token = await signSession({ userId: user.id, phone: user.phone });

    const p1 = await db.product.findFirst({ where: { slug: "travel-backpack" } });
    const p2 = await db.product.findFirst({ where: { slug: "running-shoes" } });
    expect(p1).toBeDefined();
    expect(p2).toBeDefined();

    // 1. Add item to user wishlist
    const addReq = new NextRequest("http://localhost:3000/api/wishlist", {
      method: "POST",
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      body: JSON.stringify({ productId: p1!.id }),
    });
    const addRes = await POST(addReq);
    expect(addRes.status).toBe(200);

    // 2. Merge additional guest product
    const mergeReq = new NextRequest("http://localhost:3000/api/wishlist", {
      method: "POST",
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      body: JSON.stringify({ action: "merge", productIds: [p2!.id] }),
    });
    const mergeRes = await POST(mergeReq);
    expect(mergeRes.status).toBe(200);
    const mergeData = await mergeRes.json();
    expect(mergeData.productIds).toContain(p1!.id);
    expect(mergeData.productIds).toContain(p2!.id);

    // 3. GET wishlist
    const getReq = new NextRequest("http://localhost:3000/api/wishlist", {
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const getRes = await GET(getReq);
    const getData = await getRes.json();
    expect(getData.items.length).toBe(2);

    // 4. DELETE item from wishlist
    const delReq = new NextRequest(`http://localhost:3000/api/wishlist?productId=${p1!.id}`, {
      method: "DELETE",
      headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const delRes = await DELETE(delReq);
    expect(delRes.status).toBe(200);
    const delData = await delRes.json();
    expect(delData.productIds).not.toContain(p1!.id);
    expect(delData.productIds).toContain(p2!.id);

    // Clean up
    await db.user.delete({ where: { id: user.id } });
  });
});
