import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth-service";

const sendOtpSchema = z.object({
  phone: z.string().min(10).max(15),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = sendOtpSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Enter a 10-digit mobile number starting with 6–9." },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;

    const result = await sendOtp(parsed.data.phone, ip);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${result.phone}`,
      phone: result.phone,
      devOtp: result.devOtp,
    });
  } catch (err) {
    console.error("POST /api/auth/otp/send error:", err);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
