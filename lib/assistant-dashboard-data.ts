import "server-only";
import { prisma } from "@/lib/prisma";

export type ApotekerDashboardData = {
  metrics: { totalResep: number; menunggu: number; disetujui: number; ditolak: number };
  activities: { id: number; date: Date; patient: string; status: string }[];
};

export async function getApotekerDashboardData(): Promise<ApotekerDashboardData> {
  const [totalResep, menunggu, disetujui, ditolak, recipes] = await Promise.all([
    prisma.resep_obat.count(),
    prisma.resep_obat.count({ where: { OR: [{ status_validasi: null }, { status_validasi: { in: ["Menunggu", "Pending", "Baru"] } }] } }),
    prisma.resep_obat.count({ where: { status_validasi: { in: ["Disetujui", "Valid"] } } }),
    prisma.resep_obat.count({ where: { status_validasi: "Ditolak" } }),
    prisma.resep_obat.findMany({ take: 8, orderBy: [{ tanggal_resep: "desc" }, { id_resep: "desc" }], include: { pelanggan: { select: { nama_pengguna: true } } } }),
  ]);

  return {
    metrics: {
      totalResep, menunggu, disetujui, ditolak,
    },
    activities: recipes.map((row) => ({ id: row.id_resep, date: row.tanggal_resep ?? new Date(0), patient: row.nama_pasien ?? row.pelanggan?.nama_pengguna ?? "Pasien", status: row.status_validasi ?? "Menunggu" })),
  };
}
