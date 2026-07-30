// Local-first auth: scrypt password hashing + HMAC-signed session cookie.
// The session token format (userId.expiry.signature) is stateless, so a
// future move to OAuth/NextAuth only replaces this module.

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./db";

// A weak secret means anyone can forge a session cookie for any user id,
// including an admin — so in production a real one is mandatory. Locally we
// still fall back, to keep `npm run dev` zero-config.
function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.length < 32 || secret === "change-me-to-any-random-string") {
      throw new Error(
        "SESSION_SECRET must be set to a random string of at least 32 characters in production. " +
          "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }
    return secret;
  }
  return secret ?? "dev-secret";
}

export const SESSION_COOKIE = "ece_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/** Cookie options shared by every path that issues a session. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_MS / 1000,
} as const;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function createSessionToken(userId: string): string {
  const expiry = Date.now() + SESSION_TTL_MS;
  const payload = `${userId}.${expiry}`;
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiry, sig] = parts;
  const payload = `${userId}.${expiry}`;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Date.now() > Number(expiry)) return null;
  return userId;
}

export async function getSessionUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = verifySessionToken(token);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new AuthError("Admin access required", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}
