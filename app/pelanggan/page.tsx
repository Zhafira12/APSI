import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/login/actions";
import { continueApprovedRequest, submitMedicineRequest } from "./actions";
import { medicineImage } from "@/lib/medicine-images";
import { currentStock } from "@/lib/apoteker-data";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Beranda Pelanggan | Apotek Sri Utama", description: "Cari dan ajukan permintaan obat di Apotek Sri Utama." };

type PageProps = { searchParams: Promise<{ q?: string; golongan?: string; obat?: string; tab?: string; error?: string; success?: string; purchase?: string }> };
type CustomerRequest = { id_permintaan: number; tanggal_permintaan: Date | null; status_permintaan: string | null; keterangan: string | null; resep_obat: CustomerPrescription | null; detail_permintaan_obat: { id_obat: number; jumlah: string | null; obat: { nama_obat: string; golongan_obat: { nama_golongan: string } | null; stok_obat: { id_stok: number; jumlah_stok: number; tanggal_update: Date | null; keterangan: string | null }[] } }[] };
type CustomerPrescription = { id_resep: number; status_validasi: string | null; catatan: string | null; detail_resep_obat: { id_obat: number }[] };
const money = (value: number | string) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));
const nav = ["Beranda", "Daftar Obat", "Permintaan Obat", "Riwayat Transaksi", "Profil"] as const;

export default function BerandaPelangganPage({ searchParams }: PageProps) {
  return <Suspense fallback={<main className="customer-app" aria-busy="true">Memuat beranda pelanggan…</main>}><CustomerHome searchParams={searchParams}/></Suspense>;
}

async function CustomerHome({ searchParams }: PageProps) {
  await connection();
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "pelanggan") redirect("/");
  const params = await searchParams;
  const groupId = params.golongan && Number.isInteger(Number(params.golongan)) && Number(params.golongan) > 0 ? Number(params.golongan) : undefined;
  const [account, groups, medicines, requests, prescriptions] = await Promise.all([
    prisma.pelanggan.findUnique({ where: { id_pengguna: session.userId }, select: { nama_pengguna: true, status: true, email: true, no_hp: true, alamat: true, transaksi_id_transaksi: true } }),
    prisma.golongan_obat.findMany({ orderBy: { nama_golongan: "asc" }, select: { id_golongan: true, nama_golongan: true } }),
    prisma.obat.findMany({
      where: { status: "Aktif", nama_obat: params.q ? { contains: params.q.trim(), mode: "insensitive" } : undefined, golongan_obat_id_golongan: groupId },
      include: { golongan_obat: { select: { nama_golongan: true } }, stok_obat: { select: { id_stok: true, jumlah_stok: true, tanggal_update: true, keterangan: true } } }, orderBy: { nama_obat: "asc" },
    }),
    prisma.permintaan_obat.findMany({ where: { pelanggan_id_pengguna: session.userId }, orderBy: { tanggal_permintaan: "desc" }, include: { resep_obat: { select: { id_resep: true, status_validasi: true, catatan: true, detail_resep_obat: { select: { id_obat: true } } } }, detail_permintaan_obat: { include: { obat: { select: { nama_obat: true, golongan_obat: { select: { nama_golongan: true } }, stok_obat: { select: { id_stok: true, jumlah_stok: true, tanggal_update: true, keterangan: true } } } } } } } }),
    prisma.resep_obat.findMany({ where: { pelanggan_id_pengguna: session.userId }, orderBy: [{ tanggal_resep: "desc" }, { id_resep: "desc" }], select: { id_resep: true, status_validasi: true, catatan: true, detail_resep_obat: { select: { id_obat: true } } } }),
  ]);
  if (!account || account.status !== "Aktif") redirect("/login");
  const activeTab = params.tab ?? "Beranda";
  const selected = params.obat ? medicines.find((item) => item.id_obat === Number(params.obat)) : undefined;
  const selectedStock = selected ? currentStock(selected.stok_obat) : 0;
  // The current schema links a customer's transaction through this FK. Keep the
  // history query scoped to that account rather than querying the whole table.
  const transactions = account.transaksi_id_transaksi ? await prisma.transaksi.findMany({ where: { id_transaksi: account.transaksi_id_transaksi }, include: { detail_transaksi: true }, orderBy: { tanggal: "desc" } }) : [];

  return <main className="customer-app">
    <header className="customer-header"><Link className="customer-brand" href="/pelanggan"><span className="customer-brand-mark" aria-hidden="true">✚</span><span><b>APOTEK SRI UTAMA</b><small>Sehat Bersama, Setiap Saat</small></span></Link><div className="customer-header-right"><span className="customer-avatar">{account.nama_pengguna.slice(0,1).toUpperCase()}</span><span className="customer-header-name">{account.nama_pengguna}</span><form action={logout}><button className="customer-logout" type="submit">Keluar</button></form></div></header>
    <div className="customer-layout">
      <aside className="customer-sidebar"><p className="customer-nav-caption">MENU PELANGGAN</p><nav aria-label="Navigasi pelanggan">{nav.map((item, i) => <Link key={item} className={`customer-nav-link${activeTab === item ? " active" : ""}`} href={item === "Beranda" ? "/pelanggan" : `/pelanggan?tab=${encodeURIComponent(item)}`}><span aria-hidden="true">{["⌂", "▦", "＋", "▤", "○"][i]}</span>{item}</Link>)}</nav><div className="customer-side-note"><span>Butuh bantuan?</span><b>Kami siap membantu kebutuhan kesehatan Anda.</b></div></aside>
      <section className="customer-content">
        {params.error && <p className="customer-alert" role="alert">{params.error}</p>}
        {params.success && <RequestSuccessDialog withPrescription={params.success === "prescription"}/>}
        {params.purchase === "success" && <PurchaseSuccessDialog/>}
        {activeTab === "Beranda" || activeTab === "Daftar Obat" ? <>
          <div className="customer-welcome"><div><p className="customer-kicker">APOTEK SRI UTAMA</p><h1>{activeTab === "Beranda" ? <>Selamat datang, {account.nama_pengguna}!</> : "Daftar Obat"}</h1><p>Temukan obat dan kebutuhan kesehatan Anda dengan mudah.</p></div><span className="welcome-art" aria-hidden="true">✚</span></div>
          <section className="catalog-section" id="daftar-obat"><div className="catalog-title"><div><p className="customer-kicker">KATALOG APOTEK</p><h2>{activeTab === "Beranda" ? "Cari obat yang Anda butuhkan" : "Semua Obat"}</h2></div><span className="catalog-count">{medicines.length} produk</span></div>
            <form className="medicine-search" action="/pelanggan#daftar-obat"><span aria-hidden="true">⌕</span><input type="search" name="q" defaultValue={params.q} placeholder="Cari nama obat..." aria-label="Cari nama obat"/>{params.golongan && <input type="hidden" name="golongan" value={params.golongan}/>}<button type="submit">Cari Obat</button></form>
            <div className="category-list"><Link className={!params.golongan ? "category-chip selected" : "category-chip"} href={params.q ? `/pelanggan?q=${encodeURIComponent(params.q)}#daftar-obat` : "/pelanggan#daftar-obat"}>Semua kategori</Link>{groups.map((group) => <Link className={params.golongan === String(group.id_golongan) ? "category-chip selected" : "category-chip"} href={`/pelanggan?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), golongan: String(group.id_golongan) })}#daftar-obat`} key={group.id_golongan}>{group.nama_golongan}</Link>)}</div>
            {medicines.length ? <div className="medicine-grid">{medicines.map((item) => { const stock = currentStock(item.stok_obat); const needsPrescription = /resep|antibiotik|keras/i.test(item.golongan_obat?.nama_golongan ?? ""); const image = medicineImage(item.id_obat); return <article className="medicine-card" key={item.id_obat}><Link className="medicine-visual" href={`/pelanggan?obat=${item.id_obat}`} aria-label={`Lihat ${item.nama_obat}`}>{image ? <Image src={image} width={240} height={180} alt={item.nama_obat}/> : <span className="medicine-cross" aria-hidden="true">✚</span>}{needsPrescription && <span className="prescription-label">Perlu resep</span>}</Link><div className="medicine-info"><span className="medicine-category">{item.golongan_obat?.nama_golongan ?? "Kategori lain"}</span><h3><Link href={`/pelanggan?obat=${item.id_obat}`}>{item.nama_obat}</Link></h3><p className="medicine-unit">Satuan: {item.satuan ?? "—"}</p><div className="medicine-meta"><b>{money(item.harga_jual.toString())}</b><span className={stock > 0 ? "stock-in" : "stock-out"}>{stock > 0 ? `Stok ${stock}` : "Stok habis"}</span></div><Link className="medicine-action" href={`/pelanggan?obat=${item.id_obat}`}>Lihat detail <span aria-hidden="true">→</span></Link></div></article>; })}</div> : <div className="catalog-empty">Obat tidak ditemukan. Coba kata kunci atau kategori lain.</div>}
          </section>
        </> : activeTab === "Permintaan Obat" ? <section className="catalog-section"><p className="customer-kicker">AKUN ANDA</p><h1 className="customer-page-title">Permintaan Obat</h1><RequestList requests={requests} prescriptions={prescriptions}/></section> : activeTab === "Riwayat Transaksi" ? <section className="catalog-section"><p className="customer-kicker">AKUN ANDA</p><h1 className="customer-page-title">Riwayat Transaksi</h1>{transactions.length ? transactions.map((tx) => <article className="history-row" key={tx.id_transaksi}><b>Transaksi #{tx.id_transaksi}</b><span>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(tx.tanggal)}</span><span>{money(tx.total.toString())}</span><span>{tx.status ?? "Diproses"}</span></article>) : <p className="catalog-empty">Belum ada transaksi pada akun Anda.</p>}</section> : <section className="catalog-section"><p className="customer-kicker">AKUN ANDA</p><h1 className="customer-page-title">Profil</h1><div className="profile-card"><b>{account.nama_pengguna}</b><span>{account.email}</span><span>{account.no_hp ?? "Nomor telepon belum tersedia"}</span><span>{account.alamat ?? "Alamat belum tersedia"}</span></div></section>}
        <footer className="customer-footer">© Apotek Sri Utama · Sehat Bersama, Setiap Saat</footer>
      </section>
    </div>
    {selected && <div className="detail-backdrop"><section className="medicine-detail" aria-labelledby="medicine-detail-title"><Link className="detail-close" href="/pelanggan#daftar-obat" aria-label="Tutup detail">×</Link><div className="detail-visual">{medicineImage(selected.id_obat) ? <Image src={medicineImage(selected.id_obat)!} width={480} height={480} alt={selected.nama_obat}/> : <span aria-hidden="true">✚</span>}</div><div className="detail-body"><span className="medicine-category">{selected.golongan_obat?.nama_golongan ?? "Kategori lain"}</span><h2 id="medicine-detail-title">{selected.nama_obat}</h2><p>Satuan: {selected.satuan ?? "—"}</p><p className="detail-price">{money(selected.harga_jual.toString())}</p><p>Stok tersedia: {selectedStock} {selected.satuan ?? "unit"}</p><form className="request-form" action={submitMedicineRequest} encType="multipart/form-data"><input type="hidden" name="id_obat" value={selected.id_obat}/><label>Jumlah<input name="jumlah" type="number" min="1" max={Math.max(1, selectedStock)} defaultValue="1" required disabled={selectedStock < 1}/></label><label>Metode pembayaran<select name="metode_pembayaran" defaultValue="QRIS"><option value="QRIS">QRIS</option><option value="Tunai">Tunai</option></select></label><label className="recipe-upload">Nama dokter<input type="text" name="nama_dokter" maxLength={100} required={/resep|antibiotik|keras/i.test(selected.golongan_obat?.nama_golongan ?? "")}/><small>{/resep|antibiotik|keras/i.test(selected.golongan_obat?.nama_golongan ?? "") ? "Isi sesuai informasi pada resep" : "Isi jika mengunggah resep"}</small></label><label>Tanggal resep<input type="date" name="tanggal_resep" max={new Date().toISOString().slice(0, 10)} required={/resep|antibiotik|keras/i.test(selected.golongan_obat?.nama_golongan ?? "")}/></label><label className="recipe-upload">Unggah resep dokter<input type="file" name="resep" accept="image/jpeg,image/png,application/pdf" required={/resep|antibiotik|keras/i.test(selected.golongan_obat?.nama_golongan ?? "")}/><small>{/resep|antibiotik|keras/i.test(selected.golongan_obat?.nama_golongan ?? "") ? "JPG, PNG, atau PDF · maks. 5 MB" : "Opsional · JPG, PNG, atau PDF · maks. 5 MB"}</small></label><label>Catatan (opsional)<textarea name="catatan" maxLength={225}/></label><button className="medicine-action request-submit" type="submit" disabled={selectedStock < 1}>{selectedStock < 1 ? "Stok habis" : "Ajukan permintaan"}</button></form></div></section></div>}
  </main>;
}

function RequestSuccessDialog({ withPrescription }: { withPrescription: boolean }) {
  return <div className="request-success-backdrop">
    <section className="request-success-dialog" role="dialog" aria-modal="true" aria-labelledby="request-success-title">
      <span className="request-success-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="m13 25 7 7 16-17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
      <p className="request-success-eyebrow">APOTEK SRI UTAMA</p>
      <h2 id="request-success-title">Permintaan berhasil diterima</h2>
      <p className="request-success-copy">{withPrescription ? "Permintaan obat dan lampiran resep sudah tersimpan. Apoteker akan memeriksa resep Anda." : "Permintaan obat Anda sudah tersimpan dan dapat dipantau pada menu Permintaan Obat."}</p>
      {withPrescription && <span className="request-success-status">Status resep: Menunggu validasi Apoteker</span>}
      <Link className="request-success-button" href="/pelanggan?tab=Permintaan%20Obat">Lihat permintaan saya</Link>
      <Link className="request-success-close" href="/pelanggan" aria-label="Tutup konfirmasi">Kembali ke beranda</Link>
    </section>
  </div>;
}

function PurchaseSuccessDialog() {
  return <div className="request-success-backdrop"><section className="request-success-dialog" role="dialog" aria-modal="true" aria-labelledby="purchase-success-title">
    <span className="request-success-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="m13 25 7 7 16-17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
    <p className="request-success-eyebrow">PEMBELIAN APOTEK</p><h2 id="purchase-success-title">Transaksi berhasil</h2>
    <p className="request-success-copy">Pembelian tersimpan. Stok obat telah diperbarui dan transaksi tercatat pada akun Anda.</p>
    <Link className="request-success-button" href="/pelanggan?tab=Riwayat%20Transaksi">Lihat riwayat transaksi</Link>
    <Link className="request-success-close" href="/pelanggan?tab=Permintaan%20Obat">Kembali ke permintaan</Link>
  </section></div>;
}

function RequestList({ requests, prescriptions }: { requests: CustomerRequest[]; prescriptions: CustomerPrescription[] }) {
  if (!requests.length) return <p className="catalog-empty">Belum ada permintaan obat.</p>;
  return <div className="request-list">{requests.map((request) => {
    const linkedRecipeId = Number(request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1]);
    const linkedFilename = request.keterangan?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|pdf))/i)?.[1];
    const related = prescriptions.filter((recipe) => linkedRecipeId
      ? recipe.id_resep === linkedRecipeId
      : Boolean(linkedFilename && recipe.catatan?.includes(linkedFilename)));
    const latest = request.resep_obat ?? related[0];
    const rejection = latest?.catatan?.match(/Alasan:\s*(.*)$/i)?.[1];
    const prescriptionDetails = request.detail_permintaan_obat.filter((detail) => /resep|antibiotik|keras/i.test(detail.obat.golongan_obat?.nama_golongan ?? ""));
    const needsPrescription = prescriptionDetails.length > 0 || Boolean(latest);
    const approved = !needsPrescription || Boolean(latest
      && ["disetujui", "valid"].includes((latest.status_validasi ?? "").toLowerCase())
      && prescriptionDetails.every((detail) => latest.detail_resep_obat.some((line) => line.id_obat === detail.id_obat)));
    const stockAvailable = request.detail_permintaan_obat.every((detail) => currentStock(detail.obat.stok_obat) >= Number(detail.jumlah ?? 0));
    const pending = !request.status_permintaan || ["menunggu", "baru"].includes(request.status_permintaan.toLowerCase());
    const canContinue = pending && approved && stockAvailable;
    return <article className="history-row" key={request.id_permintaan}>
      <b>{request.detail_permintaan_obat.map((detail) => `${detail.obat.nama_obat} × ${detail.jumlah ?? "—"}`).join(", ") || "Permintaan obat"}</b>
      <span>{request.tanggal_permintaan ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(request.tanggal_permintaan) : "—"}</span>
      <span>{request.status_permintaan ?? "Menunggu"}</span>
      {needsPrescription && <div className="customer-prescription-status">
        <b>{latest ? `Validasi resep #${latest.id_resep}: ${latest.status_validasi ?? "Menunggu"}` : "Validasi resep: Menunggu"}</b>
        {approved && <span>Resep telah disetujui Apoteker untuk obat pada permintaan ini.</span>}
        {latest?.status_validasi?.toLowerCase() === "ditolak" && <span>Resep ditolak. Transaksi tidak dapat dilanjutkan. Alasan: {rejection || "Silakan hubungi apotek untuk informasi lebih lanjut."}</span>}
        {(!latest?.status_validasi || ["menunggu", "pending", "baru"].includes(latest.status_validasi.toLowerCase())) && <span>Menunggu pemeriksaan Apoteker.</span>}
      </div>}
      {pending && <form className="customer-continue-form" action={continueApprovedRequest}><input type="hidden" name="id_permintaan" value={request.id_permintaan}/><button className="medicine-action" type="submit" disabled={!canContinue}>{!approved ? "Menunggu persetujuan resep" : !stockAvailable ? "Stok tidak mencukupi" : "Lanjutkan transaksi"}</button></form>}
      {request.status_permintaan?.toLowerCase() === "diproses" && <span className="customer-request-note">Permintaan sedang diproses apotek.</span>}
    </article>;
  })}</div>;
}
