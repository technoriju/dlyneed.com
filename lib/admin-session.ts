import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";

export const ADMIN_COOKIE_NAME = "shopmate_admin_session";
export const ADMIN_SESSION_COOKIE = ADMIN_COOKIE_NAME;

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || "shopmate-super-secret-dev-session-key-must-be-at-least-32-chars-long"
);

export const ADMIN_SECRET_PASSCODE =
  process.env.ADMIN_SECRET || "admin123";

export interface AdminPayload {
  isAdmin: boolean;
  username: string;
}

/**
 * Creates a signed JWT for the admin session.
 */
export async function signAdminSession(username = "admin"): Promise<string> {
  return new SignJWT({ isAdmin: true, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

/**
 * Verifies an admin session JWT.
 */
export async function verifyAdminSession(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (!payload.isAdmin) return null;
    return {
      isAdmin: true,
      username: (payload.username as string) || "admin",
    };
  } catch {
    return null;
  }
}

/**
 * Checks if the request is from an authenticated admin.
 */
export async function getAdminSession(req?: NextRequest): Promise<AdminPayload | null> {
  try {
    let token = req?.cookies?.get(ADMIN_COOKIE_NAME)?.value;
    if (!token && req) {
      const cookieHeader = req.headers.get("cookie");
      if (cookieHeader) {
        const match = cookieHeader.match(
          new RegExp(`(?:^|; )${ADMIN_COOKIE_NAME}=([^;]*)`)
        );
        if (match) token = decodeURIComponent(match[1]);
      }
    }
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
      } catch {
        // Outside Next.js request scope
      }
    }
    if (!token) return null;

    return await verifyAdminSession(token);
  } catch {
    return null;
  }
}

/**
 * Sets the httpOnly admin session cookie.
 */
export async function setAdminCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } catch {
    // Outside Next request scope
  }
}

/**
 * Clears the admin session cookie on logout.
 */
export async function clearAdminCookie() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE_NAME);
  } catch {
    // Outside Next request scope
  }
}
