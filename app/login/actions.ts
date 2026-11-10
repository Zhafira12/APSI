"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, deleteSession, type UserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = { error: string } | undefined;

type AccountRow = { id_pengguna: number; password_hash: string; status: string };

export async function login(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return { error: "Username atau password salah." };
  }

  const identifier = username.trim();
  const isEmail = identifier.includes("@");

  let owner: AccountRow | null = null;
  let admin: AccountRow | null = null;
  let apoteker: AccountRow | null = null;
  let asisten: AccountRow | null = null;
  let pelanggan: AccountRow | null = null;

  try {
    const select = { id_pengguna: true, password_hash: true, status: true } as const;
    [owner, admin, apoteker, asisten, pelanggan] = await Promise.all([
      prisma.owner.findFirst({
        where: isEmail ? { email: { equals: identifier, mode: "insensitive" } } : { username: { equals: identifier, mode: "insensitive" } },
        select,
      }),
      prisma.admin.findFirst({
        where: isEmail ? { email: { equals: identifier, mode: "insensitive" } } : { username: { equals: identifier, mode: "insensitive" } },
        select,
      }),
      prisma.apoteker.findFirst({
        where: isEmail ? { email: { equals: identifier, mode: "insensitive" } } : { username: { equals: identifier, mode: "insensitive" } },
        select,
      }),
      prisma.asisten_apoteker.findFirst({
        where: isEmail ? { email: { equals: identifier, mode: "insensitive" } } : { username: { equals: identifier, mode: "insensitive" } },
        select,
      }),
      prisma.pelanggan.findFirst({
        where: isEmail ? { email: { equals: identifier, mode: "insensitive" } } : { username: { equals: identifier, mode: "insensitive" } },
        select,
      }),
    ]);
  } catch {
    return { error: "Login sementara tidak dapat terhubung ke database." };
  }

  const candidates: { role: UserRole; user: AccountRow }[] = [
    ...(owner ? [{ role: "owner" as const, user: owner }] : []),
    ...(admin ? [{ role: "admin" as const, user: admin }] : []),
    ...(apoteker ? [{ role: "apoteker" as const, user: apoteker }] : []),
    ...(asisten ? [{ role: "asisten_apoteker" as const, user: asisten }] : []),
    ...(pelanggan ? [{ role: "pelanggan" as const, user: pelanggan }] : []),
  ];

  if (candidates.length === 0) {
    return { error: "Username atau password salah." };
  }

  for (const candidate of candidates) {
    const isBcryptHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(candidate.user.password_hash);
    const passwordMatches = isBcryptHash && (await compare(password, candidate.user.password_hash));
    if (candidate.user.status === "Aktif" && passwordMatches) {
      await createSession(candidate.user.id_pengguna, candidate.role);
      redirect(candidate.role === "pelanggan" ? "/pelanggan" : "/");
    }
  }

  return { error: "Username atau password salah." };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
