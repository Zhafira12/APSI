import "server-only";

import { redirect } from "next/navigation";
import { getSession, type StaffRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type StaffAccount = {
  id_pengguna: number;
  nama_pengguna: string;
  username: string;
  email: string;
  no_hp: string | null;
  alamat: string | null;
  status: string;
  role: StaffRole;
  roleLabel: string;
};

const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  admin: "Admin",
  apoteker: "Apoteker",
  asisten_apoteker: "Asisten Apoteker",
};

export async function requireStaff(allowedRoles?: StaffRole[]) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "pelanggan") redirect("/pelanggan");

  const role = session.role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    redirect("/");
  }

  const select = {
    id_pengguna: true,
    nama_pengguna: true,
    username: true,
    email: true,
    no_hp: true,
    alamat: true,
    status: true,
  } as const;

  const record =
    role === "owner"
      ? await prisma.owner.findUnique({ where: { id_pengguna: session.userId }, select })
      : role === "admin"
        ? await prisma.admin.findUnique({ where: { id_pengguna: session.userId }, select })
        : role === "asisten_apoteker"
          ? await prisma.asisten_apoteker.findUnique({ where: { id_pengguna: session.userId }, select })
          : await prisma.apoteker.findUnique({ where: { id_pengguna: session.userId }, select });

  if (!record || record.status !== "Aktif") redirect("/login");

  const apoteker: StaffAccount = {
    ...record,
    role,
    roleLabel: ROLE_LABELS[role],
  };

  return { session, apoteker };
}

export async function requireApoteker(allowedRoles?: StaffRole[]) {
  return requireStaff(allowedRoles);
}
