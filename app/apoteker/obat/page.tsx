import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { requireApoteker } from "@/lib/apoteker-access";
import { getMedicineInventory, money } from "@/lib/apoteker-data";
import { medicineImage } from "@/lib/medicine-images";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { saveMedicine } from "@/app/apoteker/actions";

export const metadata: Metadata = { title: "Data Obat | Apotek Sri Utama" };
type Props = { searchParams: Promise<{ q?: string; golongan?: string; edit?: string; success?: string; error?: string }> };

export default function DataObatPage(props: Props) {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat data obat…</main>}><DataObatContent {...props}/></Suspense>;
}

async function DataObatContent({ searchParams }: Props) {
  const { apoteker } = await requireApoteker();
  const canEdit = apoteker.role !== "owner";
  const params = await searchParams;
  const [inventory, groups] = await Promise.all([
    getMedicineInventory(),
    (await import("@/lib/prisma")).prisma.golongan_obat.findMany({ orderBy: { nama_golongan: "asc" } }),
  ]);
  const query = params.q?.trim().toLocaleLowerCase("id-ID") ?? "";
  const groupId = Number(params.golongan);
  const rows = inventory.filter((item) => (!query || item.nama_obat.toLocaleLowerCase("id-ID").includes(query)) && (!Number.isInteger(groupId) || groupId < 1 || item.golongan_obat_id_golongan === groupId));
  const editing = canEdit ? inventory.find((item) => item.id_obat === Number(params.edit)) : undefined;

  return <ApotekerShell active="/apoteker/obat" name={apoteker.nama_pengguna} role={apoteker.role}>
    <PageHeading eyebrow="INVENTARIS APOTEK" title="Data Obat" description={canEdit ? "Kelola katalog obat, harga, golongan, dan status." : "Tinjau daftar katalog obat, golongan, harga, dan stok."}/>
    {params.success && <p className="pharmacist-notice success" role="status">{params.success}</p>}{params.error && <p className="pharmacist-notice error" role="alert">{params.error}</p>}
    {canEdit && <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>{editing ? "PERBARUI KATALOG" : "KATALOG BARU"}</p><h2>{editing ? `Edit ${editing.nama_obat}` : "Tambah Obat"}</h2></div></div>
      <form className="pharmacist-form-grid" action={saveMedicine}>
        {editing && <input type="hidden" name="id_obat" value={editing.id_obat}/>}
        <label>Nama obat<input name="nama_obat" required maxLength={100} defaultValue={editing?.nama_obat}/></label>
        <label>Golongan obat<select name="golongan_obat_id_golongan" defaultValue={editing?.golongan_obat_id_golongan ?? ""}><option value="">Pilih golongan</option>{groups.map((group) => <option value={group.id_golongan} key={group.id_golongan}>{group.nama_golongan}</option>)}</select></label>
        <label>Harga beli<input name="harga_beli" type="number" min="0" step="0.01" required defaultValue={editing?.harga_beli.toString() ?? "0"}/></label>
        <label>Harga jual<input name="harga_jual" type="number" min="0" step="0.01" required defaultValue={editing?.harga_jual.toString() ?? "0"}/></label>
        <label>Satuan<input name="satuan" maxLength={20} placeholder="tablet, kapsul, botol" defaultValue={editing?.satuan ?? ""}/></label>
        <label>Stok minimum<input name="stok_minimum" type="number" min="0" step="1" required defaultValue={editing?.stok_minimum ?? 0}/></label>
        {editing && <label>Status<select name="status" defaultValue={editing.status ?? "Aktif"}><option>Aktif</option><option>Nonaktif</option></select></label>}
        <div className="pharmacist-form-actions"><button className="pharmacist-button primary" type="submit">{editing ? "Simpan Perubahan" : "Tambah Obat"}</button>{editing && <Link className="pharmacist-button secondary" href="/apoteker/obat">Batal</Link>}</div>
      </form>
    </section>}
    <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>{inventory.length} ITEM</p><h2>Daftar Obat</h2></div></div>
      <form className="pharmacist-filter" action="/apoteker/obat"><input name="q" type="search" placeholder="Cari nama obat" defaultValue={params.q}/><select name="golongan" defaultValue={params.golongan ?? ""}><option value="">Semua golongan</option>{groups.map((group) => <option value={group.id_golongan} key={group.id_golongan}>{group.nama_golongan}</option>)}</select><button className="pharmacist-button primary" type="submit">Cari</button><Link className="pharmacist-button secondary" href="/apoteker/obat">Reset</Link></form>
      <div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>Foto</th><th>Nama obat</th><th>Golongan</th><th>Harga beli</th><th>Harga jual</th><th>Stok / min.</th><th>Satuan</th><th>Status</th>{canEdit && <th>Aksi</th>}</tr></thead><tbody>
        {rows.map((item) => { const image = medicineImage(item.id_obat); return <tr key={item.id_obat}><td>{image ? <Image className="pharmacist-product-image" src={image} width={52} height={48} alt={item.nama_obat}/> : <span className="pharmacist-image-fallback" aria-hidden="true">✚</span>}</td><td><b>{item.nama_obat}</b></td><td>{item.golongan_obat?.nama_golongan ?? "—"}</td><td>{money(item.harga_beli.toString())}</td><td>{money(item.harga_jual.toString())}</td><td>{item.stok} / {item.stok_minimum}</td><td>{item.satuan ?? "—"}</td><td><span className={`status-pill ${(item.status ?? "Aktif").toLowerCase()}`}>{item.status ?? "Aktif"}</span></td>{canEdit && <td><Link className="table-action" href={`/apoteker/obat?edit=${item.id_obat}`}>Edit</Link></td>}</tr>; })}
        {!rows.length && <tr><td colSpan={canEdit ? 9 : 8} className="table-empty">Tidak ada obat yang cocok dengan pencarian.</td></tr>}
      </tbody></table></div>
    </section>
  </ApotekerShell>;
}
