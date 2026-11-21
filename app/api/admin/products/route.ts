import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

const createProductSchema = z.object({
  name: z.string().trim().min(2, "Product name must be at least 2 characters"),
  slug: z.string().trim().min(2).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().trim().min(5, "Description must be at least 5 characters"),
  categoryId: z.string().min(1, "Category is required"),
  images: z.array(z.string()).min(1, "At least one image is required"),
  pricePaise: z.number().int().positive("Price must be positive"),
  mrpPaise: z.number().int().positive("MRP must be positive"),
  optionName: z.string().optional().nullable(),
  isBestSeller: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  highlights: z.array(z.string()).optional().default([]),
  specs: z.array(z.tuple([z.string(), z.string()])).optional().default([]),
  variants: z.array(
    z.object({
      value: z.string().min(1),
      sku: z.string().min(1),
      stock: z.number().int().min(0),
    })
  ).min(1, "At least one variant/SKU is required"),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.toLowerCase();
    const category = searchParams.get("category");
    const status = searchParams.get("status"); // "active" | "inactive" | null

    const where: any = {};
    if (category) {
      where.category = { slug: category };
    }
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    let products = await db.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (q) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.category.name.toLowerCase().includes(q)
      );
    }

    const enriched = products.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      return {
        ...p,
        totalStock,
      };
    });

    return NextResponse.json({ products: enriched });
  } catch (err) {
    console.error("GET /api/admin/products error:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = createProductSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid product data" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check slug uniqueness
    const existing = await db.product.findUnique({
      where: { slug: data.slug },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Product with slug "${data.slug}" already exists.` },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        images: data.images,
        pricePaise: data.pricePaise,
        mrpPaise: data.mrpPaise,
        optionName: data.optionName || null,
        isBestSeller: data.isBestSeller,
        isActive: data.isActive,
        highlights: data.highlights,
        specs: data.specs,
        variants: {
          create: data.variants.map((v) => ({
            value: v.value,
            sku: v.sku,
            stock: v.stock,
          })),
        },
      },
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
    console.error("POST /api/admin/products error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
