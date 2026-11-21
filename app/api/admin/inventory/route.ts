import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

const patchInventorySchema = z.object({
  variantId: z.string().min(1),
  stock: z.number().int().min(0).optional(),
  delta: z.number().int().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lowStockOnly = searchParams.get("lowStock") === "true";
    const q = searchParams.get("q")?.toLowerCase();

    const variants = await db.variant.findMany({
      where: {
        ...(lowStockOnly ? { stock: { lte: 5 } } : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            isActive: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: [{ stock: "asc" }, { sku: "asc" }],
    });

    let filtered = variants;
    if (q) {
      filtered = variants.filter(
        (v) =>
          v.sku.toLowerCase().includes(q) ||
          v.value.toLowerCase().includes(q) ||
          v.product.name.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ variants: filtered });
  } catch (err) {
    console.error("GET /api/admin/inventory error:", err);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = patchInventorySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid stock update" },
        { status: 400 }
      );
    }

    const { variantId, stock, delta } = parsed.data;

    let updated;
    if (typeof stock === "number") {
      updated = await db.variant.update({
        where: { id: variantId },
        data: { stock },
        include: { product: true },
      });
    } else if (typeof delta === "number") {
      const current = await db.variant.findUnique({ where: { id: variantId } });
      if (!current) {
        return NextResponse.json({ error: "Variant not found" }, { status: 404 });
      }
      const newStock = Math.max(0, current.stock + delta);
      updated = await db.variant.update({
        where: { id: variantId },
        data: { stock: newStock },
        include: { product: true },
      });
    } else {
      return NextResponse.json({ error: "Provide either stock or delta" }, { status: 400 });
    }

    return NextResponse.json({ success: true, variant: updated });
  } catch (err) {
    console.error("PATCH /api/admin/inventory error:", err);
    return NextResponse.json({ error: "Failed to update stock" }, { status: 500 });
  }
}
