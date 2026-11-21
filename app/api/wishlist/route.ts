import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserWishlist, mergeGuestWishlist } from "@/lib/cart-server";
import { type CardProduct } from "@/lib/catalog-types";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

const addItemSchema = z.object({
  action: z.literal("add").optional(),
  productId: z.string().min(1),
});

const mergeSchema = z.object({
  action: z.literal("merge"),
  productIds: z.array(z.string().min(1)),
});

const postSchema = z.union([mergeSchema, addItemSchema]);

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (user) {
      const items = await getUserWishlist(user.id);
      return NextResponse.json({
        items,
        productIds: items.map((p) => p.id || ""),
      });
    }

    // Guest: ?ids=id1,id2
    const { searchParams } = new URL(req.url);
    const rawIds = searchParams.get("ids");
    let ids: string[] = [];
    if (rawIds) {
      ids = rawIds.split(",").map((s) => s.trim()).filter(Boolean);
    }

    if (ids.length === 0) {
      return NextResponse.json({ items: [], productIds: [] });
    }

    const products = await db.product.findMany({
      where: {
        id: { in: ids },
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        images: true,
        pricePaise: true,
        mrpPaise: true,
        ratingAvg: true,
        ratingCount: true,
        variants: {
          take: 1,
          select: { id: true },
        },
      },
    });

    const items: CardProduct[] = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      image: ((p.images as string[]) || [])[0] || "",
      pricePaise: p.pricePaise,
      mrpPaise: p.mrpPaise,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      defaultVariantId: p.variants[0]?.id,
    }));

    return NextResponse.json({
      items,
      productIds: items.map((p) => p.id || ""),
    });
  } catch (err) {
    console.error("GET /api/wishlist error:", err);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const data = parsed.data;
    const user = await getSessionUser(req);

    if (data.action === "merge") {
      if (!user) {
        return NextResponse.json({ error: "Authentication required to merge wishlist" }, { status: 401 });
      }
      await mergeGuestWishlist(user.id, data.productIds);
      const items = await getUserWishlist(user.id);
      return NextResponse.json({ success: true, items, productIds: items.map((p) => p.id || "") });
    }

    const { productId } = data;
    const product = await db.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (user) {
      await db.wishlistItem.upsert({
        where: {
          userId_productId: {
            userId: user.id,
            productId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          productId,
        },
      });
      const items = await getUserWishlist(user.id);
      return NextResponse.json({ success: true, wishlisted: true, items, productIds: items.map((p) => p.id || "") });
    }

    return NextResponse.json({ success: true, wishlisted: true, productId });
  } catch (err) {
    console.error("POST /api/wishlist error:", err);
    return NextResponse.json({ error: "Failed to update wishlist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paramId = searchParams.get("productId");

    let bodyId: string | undefined;
    try {
      const body = await req.json();
      bodyId = body?.productId;
    } catch {
      // Optional body
    }

    const productId = paramId || bodyId;
    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const user = await getSessionUser(req);
    if (user) {
      await db.wishlistItem.deleteMany({
        where: { userId: user.id, productId },
      });
      const items = await getUserWishlist(user.id);
      return NextResponse.json({ success: true, wishlisted: false, items, productIds: items.map((p) => p.id || "") });
    }

    return NextResponse.json({ success: true, wishlisted: false, productId });
  } catch (err) {
    console.error("DELETE /api/wishlist error:", err);
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}
