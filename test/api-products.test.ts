import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

import { NextRequest } from "next/server";
import { GET } from "../app/api/products/route";

describe("GET /api/products API Route", () => {
  it("returns all products when no query parameters are given", async () => {
    const req = new NextRequest("http://localhost:3000/api/products");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(10);
    expect(data.products.length).toBe(10);
  });

  it("filters products by category in API", async () => {
    const req = new NextRequest("http://localhost:3000/api/products?category=beauty");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(2);
  });

  it("filters deals (sale=true) in API", async () => {
    const req = new NextRequest("http://localhost:3000/api/products?sale=true");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total).toBe(3);
  });
});
