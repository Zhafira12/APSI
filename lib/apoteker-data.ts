import "server-only";
import { prisma } from "@/lib/prisma";

export type StockRow = { id_stok: number; jumlah_stok: number; tanggal_update: Date | null; keterangan: string | null };

export function currentStock(rows: StockRow[]) {
  return [...rows].sort((a, b) => (b.tanggal_update?.getTime() ?? -1) - (a.tanggal_update?.getTime() ?? -1) || b.id_stok - a.id_stok)[0]?.jumlah_stok ?? 0;
}

export async function getMedicineInventory() {
  const medicines = await prisma.obat.findMany({
    include: { golongan_obat: { select: { nama_golongan: true } }, stok_obat: { select: { id_stok: true, jumlah_stok: true, tanggal_update: true, keterangan: true } } },
    orderBy: { nama_obat: "asc" },
  });
  return medicines.map(({ stok_obat, ...medicine }) => ({ ...medicine, stok: currentStock(stok_obat) }));
}

export function money(value: number | string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
}

export function dateText(value: Date | string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(new Date(value));
}
