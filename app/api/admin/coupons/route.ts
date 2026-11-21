import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Coupon code must be at least 3 characters")
    .toUpperCase(),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().positive("Value must be positive"),
  maxDiscountPaise: z.number().int().positive().optional().nullable(),
  minOrderPaise: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
  expiresAt: z.string().optional().nullable(),
  perUserLimit: z.number().int().positive().optional().default(1),
});

const patchCouponSchema = z.object({
  code: z.string().toUpperCase(),
  type: z.enum(["percent", "flat"]).optional(),
  value: z.number().int().positive().optional(),
  maxDiscountPaise: z.number().int().positive().optional().nullable(),
  minOrderPaise: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().optional().nullable(),
  perUserLimit: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await db.coupon.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ coupons });
  } catch (err) {
    console.error("GET /api/admin/coupons error:", err);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = createCouponSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid coupon data" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await db.coupon.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Coupon code "${data.code}" already exists` },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        code: data.code,
        type: data.type,
        value: data.value,
        maxDiscountPaise: data.maxDiscountPaise || null,
        minOrderPaise: data.minOrderPaise,
        isActive: data.isActive,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        perUserLimit: data.perUserLimit,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err) {
    console.error("POST /api/admin/coupons error:", err);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = patchCouponSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid update data" },
        { status: 400 }
      );
    }

    const { code, expiresAt, ...rest } = parsed.data;

    const coupon = await db.coupon.update({
      where: { code },
      data: {
        ...rest,
        ...(expiresAt !== undefined
          ? { expiresAt: expiresAt ? new Date(expiresAt) : null }
          : {}),
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err) {
    console.error("PATCH /api/admin/coupons error:", err);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.toUpperCase();
    if (!code) {
      return NextResponse.json({ error: "Coupon code required" }, { status: 400 });
    }

    await db.coupon.delete({ where: { code } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/coupons error:", err);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
