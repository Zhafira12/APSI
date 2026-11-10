import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { requireApoteker } from "@/lib/apoteker-access";
import { dateText, money } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";
import PrintButton from "../print-button";

export const metadata: Metadata = { title: "Bukti Transaksi | Apotek Sri Utama" };
type Props = { params: Promise<{ id: string }> };

export default function TransactionDetailPage(props: Props) {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat bukti transaksi…</main>}><TransactionDetailContent {...props}/></Suspense>;
}

async function TransactionDetailContent({ params }: Props) {
  const { apoteker } = await requireApoteker();
  const { id } = await params;
  const transactionId = Number(id);
  if (!Number.isInteger(transactionId) || transactionId < 1) notFound();
  const transaction = await prisma.transaksi.findUnique({ where: { id_transaksi: transactionId }, include: { detail_transaksi: { orderBy: { id_detail_transaksi: "asc" } }, apoteker: { select: { nama_pengguna: true } } } });
  if (!transaction) notFound();
  const names = (transaction.catatan_obat ?? "").split(";").map((line) => line.trim());
  return <ApotekerShell active="/apoteker/riwayat-transaksi" name={apoteker.nama_pengguna} role={apoteker.role}>
    <PageHeading eyebrow="BUKTI PENJUALAN" title={`Transaksi #${String(transaction.id_transaksi).padStart(3, "0")}`} description="Detail transaksi dari data penjualan tersimpan."/>
    <Link className="pharmacist-button secondary back-link" href="/apoteker/riwayat-transaksi">← Kembali ke riwayat</Link>
    <section className="pharmacist-panel receipt-panel"><div className="receipt-brand"><b>APOTEK SRI UTAMA</b><span>Sehat Bersama, Setiap Saat</span></div><div className="receipt-facts"><div><small>Tanggal</small><b>{dateText(transaction.tanggal)}</b></div><div><small>Pelanggan</small><b>{transaction.nama_pelanggan ?? "Pelanggan umum"}</b></div><div><small>Petugas</small><b>{transaction.nama_pengguna ?? transaction.apoteker?.nama_pengguna ?? "Apoteker"}</b></div><div><small>Metode pembayaran</small><b>{transaction.metode_pembayaran ?? "—"}</b></div></div>
      <div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>Item</th><th>Jumlah</th><th>Harga satuan</th><th>Subtotal</th></tr></thead><tbody>{transaction.detail_transaksi.map((line, index) => <tr key={line.id_detail_transaksi}><td>{names[index] ?? `Item ${index + 1}`}</td><td>{line.jumlah}</td><td>{money(line.harga_satuan.toString())}</td><td>{money(line.subtotal.toString())}</td></tr>)}</tbody><tfoot><tr><th colSpan={3}>Total</th><th>{money(transaction.total.toString())}</th></tr></tfoot></table></div>
      <p className="receipt-status">Status transaksi: <b>{transaction.status ?? "—"}</b></p><PrintButton/>
    </section>
  </ApotekerShell>;
}
