import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

const addressSchema = z.object({
  name: z.string().trim().min(2, "Enter full name"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit mobile number starting with 6–9"),
  line1: z.string().trim().min(5, "Enter house no., building, street"),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, "Enter city"),
  state: z.string().trim().min(2, "Select state"),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
  type: z.enum(["Home", "Work", "Other"]).default("Home"),
  isDefault: z.boolean().optional().default(false),
});

const patchAddressSchema = addressSchema.partial().extend({
  id: z.string().min(1),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });

    return NextResponse.json({ addresses });
  } catch (err) {
    console.error("GET /api/addresses error:", err);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = addressSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid address data" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const existingCount = await db.address.count({ where: { userId: user.id } });
    const isFirst = existingCount === 0;
    const shouldBeDefault = isFirst || data.isDefault;

    if (shouldBeDefault) {
      await db.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: {
        userId: user.id,
        name: data.name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2 || null,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        type: data.type,
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (err) {
    console.error("POST /api/addresses error:", err);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = patchAddressSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid update data" },
        { status: 400 }
      );
    }

    const { id, isDefault, ...rest } = parsed.data;

    // Verify ownership
    const existing = await db.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    if (isDefault) {
      await db.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const updated = await db.address.update({
      where: { id },
      data: {
        ...rest,
        ...(isDefault !== undefined ? { isDefault } : {}),
      },
    });

    return NextResponse.json({ success: true, address: updated });
  } catch (err) {
    console.error("PATCH /api/addresses error:", err);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Address ID required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.address.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    await db.address.delete({ where: { id } });

    // If deleted address was default, promote another address to default
    if (existing.isDefault) {
      const another = await db.address.findFirst({
        where: { userId: user.id },
        orderBy: { id: "asc" },
      });
      if (another) {
        await db.address.update({
          where: { id: another.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/addresses error:", err);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
