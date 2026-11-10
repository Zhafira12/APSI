import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMedicineInventory } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Autentikasi diperlukan." }, { status: 401 });
  }

  const inventory = await getMedicineInventory();

  if (session.role === "pelanggan") {
    return NextResponse.json({
      data: inventory.map((item) => ({
        id_obat: item.id_obat,
        nama_obat: item.nama_obat,
        status_ketersediaan: item.stok > 0 ? "Tersedia" : "Habis",
      })),
    });
  }

  const history = await prisma.stok_obat.findMany({
    take: 40,
    orderBy: [{ tanggal_update: "desc" }, { id_stok: "desc" }],
    include: { obat: { select: { nama_obat: true, satuan: true } } },
  });

  return NextResponse.json({
    data: inventory.map((item) => ({
      id_obat: item.id_obat,
      nama_obat: item.nama_obat,
      stok: item.stok,
      stok_minimum: item.stok_minimum,
      satuan: item.satuan,
      status: item.stok <= item.stok_minimum ? "Stok minimum" : "Tersedia",
    })),
    riwayat: history,
  });
}
