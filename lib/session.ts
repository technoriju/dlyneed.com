import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { db } from "@/lib/db";

export const SESSION_COOKIE_NAME = "shopmate_session";

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
        // cookies() outside Next request scope
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
      },
    });
  } catch {
    return null;
  }
}
