import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth-service";
import {
  PENDING_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  setPendingCookie,
  setSessionCookie,
  signPendingAuth,
  signSession,
} from "@/lib/session";

const verifyOtpSchema = z.object({
  phone: z.string().min(10).max(15),
  code: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = verifyOtpSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter all 6 digits of the verification code." },
        { status: 400 }
      );
    }

    const { phone, code } = parsed.data;
    const result = await verifyOtp(phone, code);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Existing user: sign session and set cookie
    if (!result.isNew && result.user) {
      const sessionToken = await signSession({
        userId: result.user.id,
        phone: result.user.phone,
        name: result.user.name,
      });
      await setSessionCookie(sessionToken);

      const res = NextResponse.json({
        success: true,
        isNew: false,
        user: result.user,
      });

      res.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      return res;
    }

    // New user: sign pending auth token and set cookie
    const pendingToken = await signPendingAuth(phone);
    await setPendingCookie(pendingToken);

    const res = NextResponse.json({
      success: true,
      isNew: true,
      phone,
    });

    res.cookies.set(PENDING_COOKIE_NAME, pendingToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    return res;
  } catch (err) {
    console.error("POST /api/auth/otp/verify error:", err);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
