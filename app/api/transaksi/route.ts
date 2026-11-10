import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Autentikasi diperlukan." }, { status: 401 });
  }

  if (session.role === "pelanggan") {
    const account = await prisma.pelanggan.findUnique({
      where: { id_pengguna: session.userId },
      select: { nama_pengguna: true, transaksi_id_transaksi: true },
    });
    if (!account) return NextResponse.json({ error: "Akun tidak ditemukan." }, { status: 404 });

    const transactions = await prisma.transaksi.findMany({
      where: {
        OR: [
          ...(account.transaksi_id_transaksi ? [{ id_transaksi: account.transaksi_id_transaksi }] : []),
          { nama_pelanggan: { equals: account.nama_pengguna, mode: "insensitive" } },
        ],
      },
      include: { detail_transaksi: true },
      orderBy: [{ tanggal: "desc" }, { id_transaksi: "desc" }],
    });
    return NextResponse.json({ data: transactions });
  }

  const transactions = await prisma.transaksi.findMany({
    take: 100,
    orderBy: [{ tanggal: "desc" }, { id_transaksi: "desc" }],
    include: { detail_transaksi: true },
  });

  return NextResponse.json({ data: transactions });
}
