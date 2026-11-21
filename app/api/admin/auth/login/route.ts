import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SECRET_PASSCODE,
  setAdminCookie,
  signAdminSession,
} from "@/lib/admin-session";

const loginSchema = z.object({
  passcode: z.string().min(1, "Passcode is required"),
  username: z.string().optional().default("admin"),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = loginSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Passcode is required" }, { status: 400 });
    }

    const { passcode, username } = parsed.data;

    if (passcode !== ADMIN_SECRET_PASSCODE) {
      return NextResponse.json({ error: "Invalid admin passcode" }, { status: 401 });
    }

    const token = await signAdminSession(username);
    await setAdminCookie(token);

    const res = NextResponse.json({ success: true, username });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
