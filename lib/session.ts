import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { db } from "@/lib/db";

export const SESSION_COOKIE_NAME = "shopmate_session";
export const PENDING_COOKIE_NAME = "shopmate_pending_auth";

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || "shopmate-super-secret-dev-session-key-must-be-at-least-32-chars-long"
);

export interface SessionPayload {
  userId: string;
  phone: string;
  name?: string;
}

/**
 * Creates a signed JWT for the user session (httpOnly cookie in spec §10).
 */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

/**
 * Verifies a session JWT and returns the decoded payload, or null if invalid/expired.
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (!payload.userId || typeof payload.userId !== "string") return null;
    return {
      userId: payload.userId as string,
      phone: (payload.phone as string) || "",
      name: (payload.name as string) || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Signed token for new users who completed OTP and are on the profile step.
 */
export async function signPendingAuth(phone: string): Promise<string> {
  return new SignJWT({ phone, isPending: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(secretKey);
}

export async function verifyPendingAuth(token: string): Promise<{ phone: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (!payload.phone || typeof payload.phone !== "string" || !payload.isPending) return null;
    return { phone: payload.phone as string };
  } catch {
    return null;
  }
}

/**
 * Sets the httpOnly session cookie.
 */
export async function setSessionCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  } catch {
    // cookies() mutation outside Next request scope (e.g. test environment)
  }
}

/**
 * Clears the session cookie on logout.
 */
export async function clearSessionCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(PENDING_COOKIE_NAME);
  } catch {
    // Outside Next request scope
  }
}

export async function setPendingCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(PENDING_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });
  } catch {
    // Outside Next request scope
  }
}

export async function clearPendingCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(PENDING_COOKIE_NAME);
  } catch {
    // Outside Next request scope
  }
}

/**
 * Reads the session cookie and returns the authenticated user from the database, or null.
 * Accepts an optional NextRequest for route handlers and test environments.
 */
export async function getSessionUser(req?: NextRequest) {
  try {
    let token = req?.cookies?.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      } catch {
        // Outside Next.js request scope
      }
    }
    if (!token) return null;

    const payload = await verifySession(token);
    if (!payload) return null;

    return await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
  } catch {
    return null;
  }
}

/**
 * Reads pending auth cookie for new user profile creation.
 */
export async function getPendingPhone(req?: NextRequest): Promise<string | null> {
  try {
    let token = req?.cookies?.get(PENDING_COOKIE_NAME)?.value;
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(PENDING_COOKIE_NAME)?.value;
      } catch {
        // Outside Next.js request scope
      }
    }
    if (!token) return null;

    const res = await verifyPendingAuth(token);
    return res ? res.phone : null;
  } catch {
    return null;
  }
}
