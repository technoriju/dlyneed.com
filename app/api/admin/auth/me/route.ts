import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, username: admin.username });
}
