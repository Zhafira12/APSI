import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMedicineInventory } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role === "pelanggan") {
    return NextResponse.json({ error: "Akses ditolak. Hanya Owner, Admin, dan Apoteker yang dapat mengakses laporan." }, { status: 403 });
  }

  const [inventory, transactions, requests, recipes, savedReports] = await Promise.all([
    getMedicineInventory(),
    prisma.transaksi.findMany({
      orderBy: [{ tanggal: "desc" }, { id_transaksi: "desc" }],
      take: 100,
      select: { id_transaksi: true, tanggal: true, total: true, status: true, metode_pembayaran: true },
    }),
    prisma.permintaan_obat.count(),
    prisma.resep_obat.count(),
    prisma.laporan.findMany({ orderBy: [{ tanggal_laporan: "desc" }, { id_laporan: "desc" }], take: 20 }),
  ]);

  const totalPenjualan = transactions.reduce((sum, tx) => sum + Number(tx.total), 0);
  const stokMinimum = inventory.filter((item) => item.stok <= item.stok_minimum);

  return NextResponse.json({
    ringkasan: {
      total_penjualan: totalPenjualan,
      jumlah_transaksi: transactions.length,
      total_permintaan: requests,
      total_resep: recipes,
      jumlah_obat_stok_minimum: stokMinimum.length,
    },
    obat_stok_minimum: stokMinimum,
    laporan_tersimpan: savedReports,
  });
}
