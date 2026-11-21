import crypto from "crypto";
import { db } from "@/lib/db";
import { sendOtpSms } from "@/lib/sms";

// Rate limiting state: phone or IP -> timestamps array (sliding window)
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 per 10 min (spec §6)
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes (spec §10)
const MAX_OTP_ATTEMPTS = 5; // max 5 attempts (spec §10)

/**
 * Normalizes Indian phone numbers to E.164 format (+91XXXXXXXXXX).
 * Returns null if invalid.
 */
export function normalizeIndianPhone(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/[\s\-()]/g, "");

  // Starts with +91 and 10 digits
  if (/^\+91[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  // Starts with 91 and 10 digits
  if (/^91[6-9]\d{9}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  // 10 digits starting with 6-9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }

  return null;
}

/**
 * Creates SHA-256 hash of the 6-digit OTP and phone for secure DB storage.
 */
export function hashOtp(code: string, phone: string): string {
  const secret = process.env.SESSION_SECRET || "shopmate-otp-salt";
  return crypto
    .createHash("sha256")
    .update(`${code}:${phone}:${secret}`)
    .digest("hex");
}

/**
 * Checks and updates rate limit for a key (phone or IP).
 * Returns true if allowed, false if limit exceeded.
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(key) || [];

  // Remove timestamps outside the sliding window
  const activeTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitMap.set(key, activeTimestamps);
    return false;
  }

  activeTimestamps.push(now);
  rateLimitMap.set(key, activeTimestamps);
  return true;
}

/**
 * Generates a 6-digit numeric OTP and stores its hash in the database.
 */
export async function sendOtp(phoneInput: string, ip?: string): Promise<{
  success: boolean;
  phone?: string;
  error?: string;
  devOtp?: string;
}> {
  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) {
    return { success: false, error: "Enter a 10-digit mobile number starting with 6–9." };
  }

  // Check rate limit per phone
  if (!checkRateLimit(`phone:${phone}`)) {
    return {
      success: false,
      error: "Too many OTP requests for this phone number. Please wait 10 minutes before trying again.",
    };
  }

  // Check rate limit per IP if available
  if (ip && !checkRateLimit(`ip:${ip}`)) {
    return {
      success: false,
      error: "Too many requests from your network. Please wait 10 minutes.",
    };
  }

  // Generate 6-digit cryptographically secure code
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = hashOtp(code, phone);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  // Store in database
  await db.otpVerification.upsert({
    where: { phone },
    update: {
      codeHash,
      attempts: 0,
      expiresAt,
      createdAt: new Date(),
    },
    create: {
      phone,
      codeHash,
      attempts: 0,
      expiresAt,
    },
  });

  // Send SMS (mock in development)
  const smsResult = await sendOtpSms({ phone, code });

  return {
    success: true,
    phone,
    devOtp: smsResult.mockCode,
  };
}

/**
 * Verifies the 6-digit OTP code against the hashed record in the database.
 */
export async function verifyOtp(phoneInput: string, codeInput: string): Promise<{
  success: boolean;
  error?: string;
  isNew?: boolean;
  user?: { id: string; name: string; phone: string; email: string | null };
}> {
  const phone = normalizeIndianPhone(phoneInput);
  if (!phone) {
    return { success: false, error: "Invalid mobile number." };
  }

  const cleanCode = codeInput.trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return { success: false, error: "Enter all 6 digits of the code." };
  }

  const record = await db.otpVerification.findUnique({
    where: { phone },
  });

  if (!record) {
    return { success: false, error: "No verification code was sent. Please request a new code." };
  }

  // Check expiry
  if (new Date() > record.expiresAt) {
    await db.otpVerification.delete({ where: { phone } }).catch(() => {});
    return { success: false, error: "The verification code has expired. Please request a new one." };
  }

  // Check max attempts
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    await db.otpVerification.delete({ where: { phone } }).catch(() => {});
    return { success: false, error: "Too many failed attempts. Please request a new code." };
  }

  const expectedHash = hashOtp(cleanCode, phone);

  if (record.codeHash !== expectedHash) {
    const updatedAttempts = record.attempts + 1;
    await db.otpVerification.update({
      where: { phone },
      data: { attempts: updatedAttempts },
    });

    const remaining = MAX_OTP_ATTEMPTS - updatedAttempts;
    if (remaining <= 0) {
      await db.otpVerification.delete({ where: { phone } }).catch(() => {});
      return { success: false, error: "Too many failed attempts. Please request a new code." };
    }

    return {
      success: false,
      error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Code is verified: remove the OTP record
  await db.otpVerification.delete({ where: { phone } }).catch(() => {});

  // Check if user already exists
  const user = await db.user.findUnique({
    where: { phone },
    select: { id: true, name: true, phone: true, email: true },
  });

  if (user) {
    return {
      success: true,
      isNew: false,
      user,
    };
  }

  return {
    success: true,
    isNew: true,
  };
}
