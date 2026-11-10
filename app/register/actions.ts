"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type RegisterState = { error: string } | undefined;

export async function registerCustomer(_previousState: RegisterState, formData: FormData): Promise<RegisterState> {
  const name = String(formData.get("nama_pengguna") ?? "").trim();
  const rawUsername = String(formData.get("username") ?? "").trim();
  const username = rawUsername.toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("no_hp") ?? "").replace(/[\s()-]/g, "");
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("konfirmasi_password") ?? "");

  if (!name || name.length > 100) return { error: "Nama lengkap wajib diisi (maksimal 100 karakter)." };
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,49}$/.test(rawUsername)) return { error: "Username harus 3–50 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 50) return { error: "Masukkan alamat email yang valid (maksimal 50 karakter)." };
  if (!/^(?:\+62|62|0)8[1-9]\d{6,11}$/.test(phone) || phone.length > 20) return { error: "Masukkan nomor telepon Indonesia yang valid, misalnya 081234567890." };
  if (password.length < 10 || Buffer.byteLength(password, "utf8") > 72) return { error: "Password harus minimal 10 karakter dan maksimal 72 byte." };
  if (password !== confirmation) return { error: "Password dan konfirmasi password tidak sama." };

  const passwordHash = await hash(password, 12);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE "pelanggan" IN EXCLUSIVE MODE`;
      const [customerUsername, customerEmail, pharmacistUsername, lastCustomer] = await Promise.all([
        tx.pelanggan.findFirst({ where: { username: { equals: username, mode: "insensitive" } }, select: { id_pengguna: true } }),
        tx.pelanggan.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id_pengguna: true } }),
        tx.apoteker.findFirst({ where: { username: { equals: username, mode: "insensitive" } }, select: { id_pengguna: true } }),
        tx.pelanggan.aggregate({ _max: { id_pengguna: true } }),
      ]);
      if (customerUsername || pharmacistUsername) throw new Error("USERNAME_TAKEN");
      if (customerEmail) throw new Error("EMAIL_TAKEN");
      const id = (lastCustomer._max.id_pengguna ?? 0) + 1;
      if (!Number.isSafeInteger(id) || id < 1 || id > 2_147_483_647) throw new Error("ID_EXHAUSTED");
      await tx.pelanggan.create({ data: {
        id_pengguna: id,
        nama_pengguna: name,
        username,
        email,
        no_hp: phone,
        password_hash: passwordHash,
        status: "Aktif",
      } });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USERNAME_TAKEN") return { error: "Username sudah digunakan. Silakan pilih username lain." };
    if (error instanceof Error && error.message === "EMAIL_TAKEN") return { error: "Email sudah terdaftar. Gunakan email lain." };
    if (error instanceof Error && error.message === "ID_EXHAUSTED") return { error: "Akun belum dapat dibuat. Silakan hubungi administrator." };
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return { error: "Username atau email sudah digunakan. Silakan periksa kembali." };
    console.error("Gagal mendaftarkan akun pelanggan.", error);
    return { error: "Pendaftaran belum dapat diproses. Silakan coba lagi." };
  }

  redirect("/login?registered=1");
}
