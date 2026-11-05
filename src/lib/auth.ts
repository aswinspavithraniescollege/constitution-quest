import { cookies, headers } from "next/headers";
import { db } from "./db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const SESSION_COOKIE = "cq_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "constitution-quest-secret-2026";

// Simple session token: userId.hmac
function signToken(userId: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
  return `${userId}.${hmac}`;
}

function verifyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [userId, hmac] = parts;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(userId).digest("hex");
  // Use timingSafeEqual to prevent timing attacks
  if (hmac.length === expected.length && crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
    return userId;
  }
  return null;
}

// Detect if the request is coming over HTTPS.
// Preview/production environments use HTTPS, localhost uses HTTP.
// We check multiple headers to be safe.
async function isHttps(): Promise<boolean> {
  const headerStore = await headers();
  // Check x-forwarded-proto (set by Caddy, Nginx, etc.)
  const forwardedProto = headerStore.get("x-forwarded-proto");
  if (forwardedProto && forwardedProto.includes("https")) return true;
  // Check if the host is NOT localhost (preview/production = HTTPS)
  const host = headerStore.get("host") || "";
  if (!host.startsWith("localhost") && !host.startsWith("127.0.0.1")) return true;
  return false;
}

export async function createSession(userId: string) {
  const token = signToken(userId);
  const cookieStore = await cookies();
  const https = await isHttps();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: https ? "none" : "lax",
    secure: https,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const https = await isHttps();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: https ? "none" : "lax",
    secure: https,
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verifyToken(token);
  if (!userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      college: true,
      department: true,
      mentor: true,
    },
  });
  if (!user || !user.active) return null;
  return user;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
