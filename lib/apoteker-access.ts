import "server-only";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireApoteker() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "apoteker") redirect("/pelanggan");

  const apoteker = await prisma.apoteker.findUnique({
    where: { id_pengguna: session.userId },
    select: { id_pengguna: true, nama_pengguna: true, status: true },
  });

  if (!apoteker || apoteker.status !== "Aktif") redirect("/login");
  return { session, apoteker };
}
