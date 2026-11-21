import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
}));

import { NextRequest } from "next/server";
import { POST as SendOtpPOST } from "../app/api/auth/otp/send/route";
import { POST as VerifyOtpPOST } from "../app/api/auth/otp/verify/route";
import { POST as ProfilePOST } from "../app/api/auth/profile/route";
import { POST as LogoutPOST } from "../app/api/auth/logout/route";
import { GET as MeGET } from "../app/api/auth/me/route";
import { db } from "../lib/db";
import {
  checkRateLimit,
  hashOtp,
  normalizeIndianPhone,
  sendOtp,
  verifyOtp,
} from "../lib/auth-service";
import { SESSION_COOKIE_NAME, PENDING_COOKIE_NAME, signPendingAuth } from "../lib/session";

describe("Phone-OTP Authentication (Step 7)", () => {
  describe("Phone Normalization & Hashing (Spec §10)", () => {
    it("normalizes standard 10-digit Indian mobile numbers starting with 6–9", () => {
      expect(normalizeIndianPhone("9876543210")).toBe("+919876543210");
      expect(normalizeIndianPhone("+91 98765 43210")).toBe("+919876543210");
      expect(normalizeIndianPhone("919876543210")).toBe("+919876543210");
      expect(normalizeIndianPhone("6123456789")).toBe("+916123456789");
    });

    it("rejects invalid phone numbers", () => {
      expect(normalizeIndianPhone("5123456789")).toBeNull(); // Starts with 5
      expect(normalizeIndianPhone("12345")).toBeNull(); // Too short
      expect(normalizeIndianPhone("abcdefghij")).toBeNull();
      expect(normalizeIndianPhone("")).toBeNull();
    });

    it("hashes OTP deterministically with SHA-256", () => {
      const hash1 = hashOtp("123456", "+919876543210");
      const hash2 = hashOtp("123456", "+919876543210");
      const hashDiff = hashOtp("654321", "+919876543210");

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hashDiff);
      expect(hash1.length).toBe(64); // SHA-256 hex length
    });
  });

  describe("Rate Limiting (Spec §6 & §10)", () => {
    it("enforces 3 requests per 10 minutes per key", () => {
      const testKey = `test_rate_${Date.now()}`;
      expect(checkRateLimit(testKey)).toBe(true);
      expect(checkRateLimit(testKey)).toBe(true);
      expect(checkRateLimit(testKey)).toBe(true);
      // 4th request in the same window must be blocked
      expect(checkRateLimit(testKey)).toBe(false);
    });
  });

  describe("OTP Generation & Verification Flow", () => {
    const testPhone = "+918888877777";

    it("generates 6-digit OTP and verifies successfully", async () => {
      // 1. Send OTP
      const sendRes = await sendOtp(testPhone);
      expect(sendRes.success).toBe(true);
      expect(sendRes.devOtp).toBeDefined();
      expect(sendRes.devOtp?.length).toBe(6);

      // Verify OTP record exists in DB
      const record = await db.otpVerification.findUnique({ where: { phone: testPhone } });
      expect(record).toBeDefined();
      expect(record?.attempts).toBe(0);

      // 2. Incorrect code attempt
      const failRes = await verifyOtp(testPhone, "000000");
      expect(failRes.success).toBe(false);
      expect(failRes.error).toContain("attempt");

      // Verify attempts incremented in DB
      const updatedRecord = await db.otpVerification.findUnique({ where: { phone: testPhone } });
      expect(updatedRecord?.attempts).toBe(1);

      // 3. Correct code verification
      const verifyRes = await verifyOtp(testPhone, sendRes.devOtp!);
      expect(verifyRes.success).toBe(true);
      expect(verifyRes.isNew).toBe(true);

      // OTP record should now be consumed/deleted
      const consumed = await db.otpVerification.findUnique({ where: { phone: testPhone } });
      expect(consumed).toBeNull();
    });
  });

  describe("Auth API Routes End-to-End", () => {
    const apiPhone = "9777766666";
    const normalizedPhone = "+919777766666";

    it("handles full signup flow: send OTP -> verify -> create profile -> logout", async () => {
      // Clean up any pre-existing test data
      await db.user.deleteMany({ where: { phone: normalizedPhone } });
      await db.otpVerification.deleteMany({ where: { phone: normalizedPhone } });

      // 1. POST /api/auth/otp/send
      const sendReq = new NextRequest("http://localhost:3000/api/auth/otp/send", {
        method: "POST",
        body: JSON.stringify({ phone: apiPhone }),
      });
      const sendRes = await SendOtpPOST(sendReq);
      expect(sendRes.status).toBe(200);
      const sendData = await sendRes.json();
      expect(sendData.success).toBe(true);
      expect(sendData.devOtp).toBeDefined();

      const otpCode = sendData.devOtp;

      // 2. POST /api/auth/otp/verify
      const verifyReq = new NextRequest("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone: apiPhone, code: otpCode }),
      });
      const verifyRes = await VerifyOtpPOST(verifyReq);
      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      expect(verifyData.success).toBe(true);
      expect(verifyData.isNew).toBe(true);

      // 3. POST /api/auth/profile
      const pendingToken = await signPendingAuth(normalizedPhone);
      const profileReq = new NextRequest("http://localhost:3000/api/auth/profile", {
        method: "POST",
        headers: {
          Cookie: `${PENDING_COOKIE_NAME}=${pendingToken}`,
        },
        body: JSON.stringify({ name: "Aarav Sharma", email: "aarav@example.com" }),
      });
      const profileRes = await ProfilePOST(profileReq);
      expect(profileRes.status).toBe(200);
      const profileData = await profileRes.json();
      expect(profileData.success).toBe(true);
      expect(profileData.user.name).toBe("Aarav Sharma");
      expect(profileData.user.phone).toBe(normalizedPhone);

      // 4. Verify user is in DB
      const dbUser = await db.user.findUnique({ where: { phone: normalizedPhone } });
      expect(dbUser).toBeDefined();
      expect(dbUser?.name).toBe("Aarav Sharma");

      // 5. Subsequent OTP verify for existing user returns isNew: false
      const sendRes2 = await sendOtp(normalizedPhone);
      const verifyExistingReq = new NextRequest("http://localhost:3000/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone: normalizedPhone, code: sendRes2.devOtp }),
      });
      const verifyExistingRes = await VerifyOtpPOST(verifyExistingReq);
      expect(verifyExistingRes.status).toBe(200);
      const verifyExistingData = await verifyExistingRes.json();
      expect(verifyExistingData.isNew).toBe(false);
      expect(verifyExistingData.user.id).toBe(dbUser?.id);

      // 6. POST /api/auth/logout
      const logoutRes = await LogoutPOST();
      expect(logoutRes.status).toBe(200);

      // Clean up
      await db.user.deleteMany({ where: { phone: normalizedPhone } });
    });

    it("rejects invalid inputs on profile creation", async () => {
      const pendingToken = await signPendingAuth("+919111122222");
      const badReq = new NextRequest("http://localhost:3000/api/auth/profile", {
        method: "POST",
        headers: {
          Cookie: `${PENDING_COOKIE_NAME}=${pendingToken}`,
        },
        body: JSON.stringify({ name: "A", email: "not-an-email" }),
      });
      const res = await ProfilePOST(badReq);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });
});
