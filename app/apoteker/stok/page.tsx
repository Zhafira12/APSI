import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { Suspense } from "react";
import Link from "next/link";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { requireApoteker } from "@/lib/apoteker-access";
import { dateText, getMedicineInventory } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";
import { receiveStock } from "@/app/apoteker/actions";

export const metadata: Metadata = { title: "Stok Obat | Apotek Sri Utama" };
type Props = { searchParams: Promise<{ success?: string; error?: string }> };

export default function StokPage(props: Props) {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat stok obat…</main>}><StokContent {...props}/></Suspense>;
}

async function StokContent({ searchParams }: Props) {
  const { apoteker } = await requireApoteker();
  const canUpdateStock = apoteker.role !== "owner";
  const params = await searchParams;
  const [medicines, history] = await Promise.all([
    getMedicineInventory(),
    prisma.stok_obat.findMany({ take: 40, orderBy: [{ tanggal_update: "desc" }, { id_stok: "desc" }], include: { obat: { select: { nama_obat: true, satuan: true } } } }),
  ]);
  return <ApotekerShell active="/apoteker/stok" name={apoteker.nama_pengguna} role={apoteker.role}>
    <PageHeading eyebrow="PERSEDIAAN APOTEK" title="Stok Obat" description={canUpdateStock ? "Catat penerimaan stok dan tinjau saldo serta riwayat pembaruannya." : "Tinjau jumlah stok real-time dan log riwayat perubahan stok."}/>
    {params.success && <p className="pharmacist-notice success" role="status">{params.success}</p>}{params.error && <p className="pharmacist-notice error" role="alert">{params.error}</p>}
    <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>RINGKASAN</p><h2>Persediaan Terkini</h2></div><Link className="pharmacist-button secondary" href="/apoteker/obat">{canUpdateStock ? "Kelola Data Obat" : "Lihat Katalog Obat"}</Link></div>
      <div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>Obat</th><th>Stok saat ini</th><th>Stok minimum</th><th>Status</th>{canUpdateStock && <th>Penerimaan stok</th>}</tr></thead><tbody>{medicines.map((item) => <tr key={item.id_obat}><td><b>{item.nama_obat}</b><small className="table-subtext">{item.golongan_obat?.nama_golongan ?? "Tanpa golongan"}</small></td><td><b className={item.stok <= item.stok_minimum ? "text-danger" : "text-green"}>{item.stok} {item.satuan ?? "unit"}</b></td><td>{item.stok_minimum}</td><td><span className={`status-pill ${item.stok <= item.stok_minimum ? "ditolak" : "valid"}`}>{item.stok <= item.stok_minimum ? "Stok minimum" : "Tersedia"}</span></td>{canUpdateStock && <td><form action={receiveStock} className="stock-receive-form"><input type="hidden" name="id_obat" value={item.id_obat}/><input type="hidden" name="token" value={randomUUID()}/><input name="jumlah" type="number" min="1" step="1" required aria-label={`Jumlah stok masuk ${item.nama_obat}`} placeholder="Jumlah"/><input name="keterangan" maxLength={160} aria-label={`Keterangan penerimaan ${item.nama_obat}`} placeholder="Keterangan"/><button className="pharmacist-button primary" type="submit">Tambah</button></form></td>}</tr>)}</tbody></table></div>
    </section>
    <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>LOG STOK</p><h2>Riwayat Perubahan Stok</h2></div></div>
      <div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>Tanggal</th><th>Obat</th><th>Saldo tercatat</th><th>Keterangan</th></tr></thead><tbody>{history.map((row) => <tr key={row.id_stok}><td>{dateText(row.tanggal_update)}</td><td>{row.obat.nama_obat}</td><td>{row.jumlah_stok} {row.obat.satuan ?? "unit"}</td><td>{row.keterangan?.replace(/^\[ref:[0-9a-f-]+\]\s*/i, "") ?? "—"}</td></tr>)}{!history.length && <tr><td colSpan={4} className="table-empty">Belum ada catatan perubahan stok.</td></tr>}</tbody></table></div>
      <p className="pharmacist-footnote">Saldo terkini menggunakan catatan stok terakhir per obat. Perubahan penerimaan dan penjualan menambahkan catatan saldo baru.</p>
    </section>
  </ApotekerShell>;
}
