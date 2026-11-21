import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const updateProductSchema = z.object({
  name: z.string().trim().min(2).optional(),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().trim().min(5).optional(),
  categoryId: z.string().min(1).optional(),
  images: z.array(z.string()).min(1).optional(),
  pricePaise: z.number().int().positive().optional(),
  mrpPaise: z.number().int().positive().optional(),
  optionName: z.string().optional().nullable(),
  isBestSeller: z.boolean().optional(),
  isActive: z.boolean().optional(),
  highlights: z.array(z.string()).optional(),
  specs: z.array(z.tuple([z.string(), z.string()])).optional(),
});

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (err) {
    console.error("GET /api/admin/products/[id] error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const json = await req.json();
    const parsed = updateProductSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid update payload" },
        { status: 400 }
      );
    }

    const product = await db.product.update({
      where: { id },
      data: parsed.data,
      include: {
        category: true,
        variants: true,
      },
    });

    try {
      revalidateTag("products", "max");
    } catch {
      // Ignored outside cache context
    }

    return NextResponse.json({ success: true, product });
  } catch (err) {
    console.error("PATCH /api/admin/products/[id] error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Toggle active=false or delete if no order dependencies
    const productVariants = await db.variant.findMany({
      where: { productId: id },
      select: { id: true },
    });
    const variantIds = productVariants.map((v) => v.id);

    const orderItemsCount = await db.orderItem.count({
      where: { variantId: { in: variantIds } },
    });

    if (orderItemsCount > 0) {
      // Has order history: soft-deactivate to maintain integrity
      const product = await db.product.update({
        where: { id },
        data: { isActive: false },
      });
      try {
        revalidateTag("products", "max");
      } catch {}
      return NextResponse.json({
        success: true,
        deactivated: true,
        message: "Product deactivated (has order history)",
        product,
      });
    }

    await db.product.delete({ where: { id } });
    try {
      revalidateTag("products", "max");
    } catch {}

    return NextResponse.json({ success: true, deleted: true });
  } catch (err) {
    console.error("DELETE /api/admin/products/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
