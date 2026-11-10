import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export type UserRole = "owner" | "admin" | "apoteker" | "asisten_apoteker" | "pelanggan";
export type StaffRole = Exclude<UserRole, "pelanggan">;
export type Session = { userId: number; role: UserRole; expiresAt: number };

const VALID_ROLES = new Set<UserRole>(["owner", "admin", "apoteker", "asisten_apoteker", "pelanggan"]);
const COOKIE_NAME = "apotek_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 16) return secret;
  if (process.env.DATABASE_URL) {
    return createHmac("sha256", "apotek-sri-utama-kdf-v1")
      .update(process.env.DATABASE_URL)
      .digest("hex");
  }
  throw new Error("AUTH_SECRET (minimal 16 karakter) wajib dikonfigurasi pada environment.");
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
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
    if (
      !Number.isInteger(session.userId) ||
      typeof session.userId !== "number" ||
      !session.role ||
      !VALID_ROLES.has(session.role) ||
      typeof session.expiresAt !== "number" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return session as Session;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}
