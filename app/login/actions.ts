"use server";

import { compare } from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = { error: string } | undefined;

export async function login(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");
  if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password) {
    return { error: "Username atau password salah." };
  }

  let apoteker: { id_pengguna: number; password_hash: string; status: string } | null;
  let pelanggan: { id_pengguna: number; password_hash: string; status: string } | null;
  try {
    [apoteker, pelanggan] = await Promise.all([
      prisma.apoteker.findUnique({ where: { username: username.trim() }, select: { id_pengguna: true, password_hash: true, status: true } }),
      prisma.pelanggan.findUnique({ where: { username: username.trim() }, select: { id_pengguna: true, password_hash: true, status: true } }),
    ]);
  } catch {
    return { error: "Login sementara tidak dapat terhubung ke database." };
  }

  // Username must identify exactly one actor, and only bcrypt hashes are accepted.
  if (Boolean(apoteker) === Boolean(pelanggan)) return { error: "Username atau password salah." };
  const user = apoteker ?? pelanggan!;
  const isBcryptHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(user.password_hash);
  const passwordMatches = isBcryptHash && await compare(password, user.password_hash);
  if (user.status !== "Aktif" || !passwordMatches) return { error: "Username atau password salah." };

  const role = apoteker ? "apoteker" : "pelanggan";
  await createSession(user.id_pengguna, role);
  redirect(role === "apoteker" ? "/" : "/pelanggan");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
