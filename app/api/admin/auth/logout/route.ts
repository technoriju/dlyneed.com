import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, clearAdminCookie } from "@/lib/admin-session";

export async function POST() {
  await clearAdminCookie();
  const res = NextResponse.json({ success: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
