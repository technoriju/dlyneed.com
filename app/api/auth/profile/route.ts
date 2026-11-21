import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  clearPendingCookie,
  getPendingPhone,
  getSessionUser,
  PENDING_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  setSessionCookie,
  signSession,
} from "@/lib/session";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Full name must be at least 2 characters."),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = profileSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid profile data" },
        { status: 400 }
      );
    }

    const { name, email } = parsed.data;
    const cleanEmail = email && email.length > 0 ? email : null;

    // Check if user is completing signup with pending cookie
    const pendingPhone = await getPendingPhone(req);
    if (pendingPhone) {
      // Check if user was somehow already created
      let user = await db.user.findUnique({
        where: { phone: pendingPhone },
      });

      if (user) {
        user = await db.user.update({
          where: { id: user.id },
          data: { name, email: cleanEmail },
        });
      } else {
        user = await db.user.create({
          data: {
            phone: pendingPhone,
            name,
            email: cleanEmail,
          },
        });
      }

      await clearPendingCookie();
      const sessionToken = await signSession({
        userId: user.id,
        phone: user.phone,
        name: user.name,
      });
      await setSessionCookie(sessionToken);

      const res = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email,
        },
      });

      res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      res.cookies.delete(PENDING_COOKIE_NAME);

      return res;
    }

    // Check if existing logged-in user is updating profile
    const existingUser = await getSessionUser(req);
    if (existingUser) {
      const updated = await db.user.update({
        where: { id: existingUser.id },
        data: { name, email: cleanEmail },
      });
      return NextResponse.json({
        success: true,
        user: {
          id: updated.id,
          name: updated.name,
          phone: updated.phone,
          email: updated.email,
        },
      });
    }

    return NextResponse.json(
      { error: "Authentication session expired. Please sign in again." },
      { status: 401 }
    );
  } catch (err) {
    console.error("POST /api/auth/profile error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
