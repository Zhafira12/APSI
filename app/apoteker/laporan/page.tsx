import type { Metadata } from "next";
import { Suspense } from "react";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { requireApoteker } from "@/lib/apoteker-access";
import { getMedicineInventory, money } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Laporan Apotek | Apotek Sri Utama" };

export default function LaporanPage() {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat laporan…</main>}><LaporanContent/></Suspense>;
}

async function LaporanContent() {
  const { apoteker } = await requireApoteker();
  const [inventory, transactions, requests, recipes] = await Promise.all([
    getMedicineInventory(),
    prisma.transaksi.findMany({ orderBy: [{ tanggal: "desc" }, { id_transaksi: "desc" }], take: 100, select: { id_transaksi: true, tanggal: true, total: true, status: true, metode_pembayaran: true } }),
    prisma.permintaan_obat.count(),
    prisma.resep_obat.count(),
  ]);
  const totalSales = transactions.reduce((sum, transaction) => sum + Number(transaction.total), 0);
  const lowStock = inventory.filter((medicine) => medicine.stok <= medicine.stok_minimum);
  const stockTotal = inventory.reduce((sum, medicine) => sum + medicine.stok, 0);
  const pending = await prisma.permintaan_obat.count({ where: { status_permintaan: { in: ["Menunggu", "Baru"] } } });
  return <ApotekerShell active="/apoteker/laporan" name={apoteker.nama_pengguna}>
    <PageHeading eyebrow="LAPORAN OPERASIONAL" title="Laporan Apotek" description="Ringkasan langsung dari tabel transaksi, permintaan, resep, dan stok."/>
    <p className="pharmacist-notice">Laporan ini dihitung langsung dari data saat dibuka. Schema saat ini tidak menghubungkan laporan tersimpan dengan Apoteker, jadi halaman ini bersifat baca saja.</p>
    <div className="pharmacist-metrics"><article className="pharmacist-metric"><span>Penjualan 100 transaksi terakhir</span><b>{money(totalSales)}</b></article><article className="pharmacist-metric"><span>Jumlah transaksi terbaca</span><b>{transactions.length}</b></article><article className="pharmacist-metric"><span>Total permintaan</span><b>{requests}</b></article><article className="pharmacist-metric"><span>Resep tersimpan</span><b>{recipes}</b></article><article className="pharmacist-metric"><span>Total saldo stok</span><b>{stockTotal}</b></article><article className="pharmacist-metric"><span>Permintaan menunggu</span><b className={pending ? "red" : "green"}>{pending}</b></article></div>
    <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>INVENTARIS</p><h2>Obat dengan Stok Minimum</h2></div></div><div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>Obat</th><th>Golongan</th><th>Saldo</th><th>Minimum</th><th>Harga jual</th></tr></thead><tbody>{lowStock.map((item) => <tr key={item.id_obat}><td>{item.nama_obat}</td><td>{item.golongan_obat?.nama_golongan ?? "—"}</td><td className="text-danger">{item.stok}</td><td>{item.stok_minimum}</td><td>{money(item.harga_jual.toString())}</td></tr>)}{!lowStock.length && <tr><td colSpan={5} className="table-empty">Tidak ada stok yang berada pada atau di bawah minimum.</td></tr>}</tbody></table></div></section>
    <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>PENJUALAN</p><h2>Transaksi Terbaru</h2></div></div><div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>No.</th><th>Tanggal</th><th>Total</th><th>Metode</th><th>Status</th></tr></thead><tbody>{transactions.slice(0, 10).map((item) => <tr key={item.id_transaksi}><td>#{item.id_transaksi}</td><td>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(item.tanggal)}</td><td>{money(item.total.toString())}</td><td>{item.metode_pembayaran ?? "—"}</td><td>{item.status ?? "—"}</td></tr>)}{!transactions.length && <tr><td colSpan={5} className="table-empty">Belum ada transaksi.</td></tr>}</tbody></table></div></section>
  </ApotekerShell>;
}
