import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  PENDING_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/session";

export async function POST() {
  await clearSessionCookie();
  const res = NextResponse.json({ success: true, message: "Logged out successfully" });
  res.cookies.delete(SESSION_COOKIE_NAME);
  res.cookies.delete(PENDING_COOKIE_NAME);
  return res;
}
