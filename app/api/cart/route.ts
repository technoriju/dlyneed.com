import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getCouponByCode,
  getUserCart,
  hydrateCartItems,
  mergeGuestCart,
} from "@/lib/cart-server";
import { db } from "@/lib/db";
import {
  calculateCartTotals,
  MAX_QTY_PER_LINE,
  MIN_QTY_PER_LINE,
} from "@/lib/pricing";
import { getSessionUser } from "@/lib/session";

const addItemSchema = z.object({
  action: z.literal("add").optional(),
  variantId: z.string().min(1),
  qty: z.number().int().min(1).max(MAX_QTY_PER_LINE).optional().default(1),
});

const mergeSchema = z.object({
  action: z.literal("merge"),
  items: z.array(
    z.object({
      variantId: z.string().min(1),
      qty: z.number().int().min(1).max(MAX_QTY_PER_LINE),
    })
  ),
});

const postSchema = z.union([mergeSchema, addItemSchema]);

const patchSchema = z.object({
  variantId: z.string().min(1),
  qty: z.number().int().min(0).max(MAX_QTY_PER_LINE),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    const { searchParams } = new URL(req.url);
    const couponCode = searchParams.get("coupon");

    if (user) {
      const { items, summary, coupon } = await getUserCart(user.id, couponCode);
      return NextResponse.json({
        user: { id: user.id, name: user.name, phone: user.phone },
        items,
        summary,
        couponCode: coupon?.code ?? null,
      });
    }

    // Guest cart: client passes ?items=[{"variantId":"...","qty":1}]
    const rawItems = searchParams.get("items");
    let guestItems: Array<{ variantId: string; qty: number }> = [];
    if (rawItems) {
      try {
        guestItems = JSON.parse(rawItems);
      } catch {
        guestItems = [];
      }
    }

    const items = await hydrateCartItems(guestItems);
    const coupon = couponCode ? await getCouponByCode(couponCode) : null;
    const summary = calculateCartTotals(items, coupon);

    return NextResponse.json({
      user: null,
      items,
      summary,
      couponCode: coupon?.code ?? null,
    });
  } catch (err) {
    console.error("GET /api/cart error:", err);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const data = parsed.data;
    const user = await getSessionUser(req);

    // Merging guest cart into user account
    if (data.action === "merge") {
      if (!user) {
        return NextResponse.json({ error: "Authentication required to merge cart" }, { status: 401 });
      }
      await mergeGuestCart(user.id, data.items);
      const cart = await getUserCart(user.id);
      return NextResponse.json({ success: true, ...cart });
    }

    // Adding item to cart
    const { variantId, qty } = data;
    const variant = await db.variant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });

    if (!variant || !variant.product.isActive) {
      return NextResponse.json({ error: "Product variant not available" }, { status: 404 });
    }

    if (user) {
      const existing = await db.cartItem.findUnique({
        where: {
          userId_variantId: {
            userId: user.id,
            variantId,
          },
        },
      });

      const newQty = existing
        ? Math.min(MAX_QTY_PER_LINE, existing.qty + qty)
        : Math.min(MAX_QTY_PER_LINE, Math.max(MIN_QTY_PER_LINE, qty));

      await db.cartItem.upsert({
        where: {
          userId_variantId: {
            userId: user.id,
            variantId,
          },
        },
        update: { qty: newQty },
        create: {
          userId: user.id,
          variantId,
          qty: newQty,
        },
      });

      const cart = await getUserCart(user.id);
      return NextResponse.json({ success: true, ...cart });
    }

    // Guest response: return hydrated line for client-side storage
    const hydrated = await hydrateCartItems([{ variantId, qty }]);
    return NextResponse.json({
      success: true,
      item: hydrated[0] ?? null,
    });
  } catch (err) {
    console.error("POST /api/cart error:", err);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
    }

    const { variantId, qty } = parsed.data;
    const user = await getSessionUser(req);

    if (user) {
      if (qty <= 0) {
        await db.cartItem.deleteMany({
          where: { userId: user.id, variantId },
        });
      } else {
        await db.cartItem.updateMany({
          where: { userId: user.id, variantId },
          data: { qty: Math.min(MAX_QTY_PER_LINE, qty) },
        });
      }

      const cart = await getUserCart(user.id);
      return NextResponse.json({ success: true, ...cart });
    }

    // Guest PATCH: returns confirmation
    return NextResponse.json({ success: true, variantId, qty });
  } catch (err) {
    console.error("PATCH /api/cart error:", err);
    return NextResponse.json({ error: "Failed to update quantity" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const variantIdParam = searchParams.get("variantId");
    const clearAll = searchParams.get("clearAll") === "true";

    let bodyVariantId: string | undefined;
    try {
      const body = await req.json();
      bodyVariantId = body?.variantId;
    } catch {
      // Body is optional
    }

    const variantId = variantIdParam || bodyVariantId;
    const user = await getSessionUser(req);

    if (user) {
      if (clearAll) {
        await db.cartItem.deleteMany({ where: { userId: user.id } });
      } else if (variantId) {
        await db.cartItem.deleteMany({
          where: { userId: user.id, variantId },
        });
      }
      const cart = await getUserCart(user.id);
      return NextResponse.json({ success: true, ...cart });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/cart error:", err);
    return NextResponse.json({ error: "Failed to delete cart item" }, { status: 500 });
  }
}
