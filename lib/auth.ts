import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type UserRole = "apoteker" | "pelanggan";
type Session = { userId: number; role: UserRole; expiresAt: number };

const COOKIE_NAME = "apotek_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function sign(value: string) {
  const secret = process.env.AUTH_SECRET ?? process.env.DATABASE_URL;
  if (!secret) throw new Error("AUTH_SECRET or DATABASE_URL is required for login sessions.");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export async function createSession(userId: number, role: UserRole) {
  const session: Session = { userId, role, expiresAt: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const value = `${payload}.${sign(`apotek-sri-utama:${payload}`)}`;
  (await cookies()).set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  const expected = sign(`apotek-sri-utama:${payload}`);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Session>;
    if (!Number.isInteger(session.userId) || typeof session.userId !== "number" ||
      (session.role !== "apoteker" && session.role !== "pelanggan") ||
      typeof session.expiresAt !== "number" || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session as Session;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}
