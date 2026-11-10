import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { requireApoteker } from "@/lib/apoteker-access";
import { dateText, money } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Riwayat Transaksi | Apotek Sri Utama" };
type Props = { searchParams: Promise<{ q?: string; dari?: string; sampai?: string; success?: string }> };

export default function RiwayatTransaksiPage(props: Props) {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat riwayat transaksi…</main>}><RiwayatTransaksiContent {...props}/></Suspense>;
}

async function RiwayatTransaksiContent({ searchParams }: Props) {
  const { apoteker } = await requireApoteker();
  const params = await searchParams;
  const fromDate = params.dari && /^\d{4}-\d{2}-\d{2}$/.test(params.dari) ? new Date(`${params.dari}T00:00:00`) : undefined;
  const toDate = params.sampai && /^\d{4}-\d{2}-\d{2}$/.test(params.sampai) ? new Date(`${params.sampai}T23:59:59.999`) : undefined;
  const transactions = await prisma.transaksi.findMany({
    where: {
      nama_pelanggan: params.q ? { contains: params.q.trim(), mode: "insensitive" } : undefined,
      tanggal: fromDate || toDate ? { gte: fromDate, lte: toDate } : undefined,
    },
    orderBy: [{ tanggal: "desc" }, { id_transaksi: "desc" }],
    include: { detail_transaksi: true },
  });
  return <ApotekerShell active="/apoteker/riwayat-transaksi" name={apoteker.nama_pengguna} role={apoteker.role}>
    <PageHeading eyebrow="ARSIP PENJUALAN" title="Riwayat Transaksi" description="Cari transaksi dan buka bukti penjualan."/>
    {params.success && <p className="pharmacist-notice success" role="status">{params.success}</p>}
    <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>{transactions.length} TRANSAKSI</p><h2>Daftar Penjualan</h2></div></div>
      <form action="/apoteker/riwayat-transaksi" className="pharmacist-filter"><input name="q" placeholder="Nama pelanggan" defaultValue={params.q}/><label>Dari<input type="date" name="dari" defaultValue={params.dari}/></label><label>Sampai<input type="date" name="sampai" defaultValue={params.sampai}/></label><button className="pharmacist-button primary">Filter</button><Link className="pharmacist-button secondary" href="/apoteker/riwayat-transaksi">Reset</Link></form>
      <div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>No. transaksi</th><th>Tanggal</th><th>Pelanggan</th><th>Item</th><th>Total</th><th>Pembayaran</th><th>Status</th><th></th></tr></thead><tbody>{transactions.map((row) => <tr key={row.id_transaksi}><td>#{String(row.id_transaksi).padStart(3, "0")}</td><td>{dateText(row.tanggal)}</td><td>{row.nama_pelanggan ?? "Pelanggan umum"}</td><td>{row.catatan_obat ?? `${row.detail_transaksi.length} item`}</td><td><b>{money(row.total.toString())}</b></td><td>{row.metode_pembayaran ?? "—"}</td><td>{row.status ?? "—"}</td><td><Link className="table-action" href={`/apoteker/riwayat-transaksi/${row.id_transaksi}`}>Bukti</Link></td></tr>)}{!transactions.length && <tr><td colSpan={8} className="table-empty">Belum ada transaksi yang cocok.</td></tr>}</tbody></table></div>
    </section>
  </ApotekerShell>;
}
