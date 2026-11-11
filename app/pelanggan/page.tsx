import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/login/actions";
import { continueApprovedRequest } from "./actions";
import MedicineCatalog from "./medicine-catalog";
import { currentStock } from "@/lib/apoteker-data";
import { SIDEBAR_MENU_BY_ROLE } from "@/lib/navigation";
import { SidebarIcon } from "@/app/apoteker-shell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Beranda Pelanggan | Apotek Sri Utama", description: "Cari dan ajukan permintaan obat di Apotek Sri Utama." };

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ q?: string; golongan?: string; obat?: string; tab?: string; error?: string; success?: string; purchase?: string }> };
type CustomerRequest = { id_permintaan: number; tanggal_permintaan: Date | null; status_permintaan: string | null; keterangan: string | null; resep_obat: CustomerPrescription | null; detail_permintaan_obat: { id_obat: number; jumlah: string | null; obat: { nama_obat: string; golongan_obat: { nama_golongan: string } | null; stok_obat: { id_stok: number; jumlah_stok: number; tanggal_update: Date | null; keterangan: string | null }[] } }[] };
type CustomerPrescription = { id_resep: number; status_validasi: string | null; catatan: string | null; detail_resep_obat: { id_obat: number }[] };
const money = (value: number | string) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));

function normalizeCustomerTab(rawTab?: string) {
  if (!rawTab || rawTab === "Beranda") return "Beranda";
  if (rawTab === "Cari Obat" || rawTab === "Daftar Obat") return "Cari Obat";
  if (rawTab === "Resep Saya" || rawTab === "Permintaan Obat") return "Resep Saya";
  if (rawTab === "Riwayat Transaksi") return "Riwayat Transaksi";
  return "Beranda";
}
export default async function BerandaPelangganPage({ searchParams }: PageProps) {
  return <CustomerHome searchParams={searchParams}/>;
}

async function CustomerHome({ searchParams }: PageProps) {
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
  const activeTab = normalizeCustomerTab(params.tab);
  const menuItems = SIDEBAR_MENU_BY_ROLE.pelanggan;
  // Query customer's transactions both via direct FK and customer name so all past transactions appear
  const transactions = await prisma.transaksi.findMany({
    where: {
      OR: [
        ...(account.transaksi_id_transaksi ? [{ id_transaksi: account.transaksi_id_transaksi }] : []),
        { nama_pelanggan: { equals: account.nama_pengguna, mode: "insensitive" } },
      ],
    },
    include: { detail_transaksi: true },
    orderBy: [{ tanggal: "desc" }, { id_transaksi: "desc" }],
  });

  return <main className="customer-app">
    <header className="customer-header"><Link className="customer-brand" href="/pelanggan"><span className="customer-brand-mark" aria-hidden="true">✚</span><span><b>APOTEK SRI UTAMA</b><small>Sehat Bersama, Setiap Saat</small></span></Link><div className="customer-header-right"><span className="customer-avatar">{account.nama_pengguna.slice(0,1).toUpperCase()}</span><span className="customer-header-name">{account.nama_pengguna}</span></div></header>
    <div className="customer-layout">
      <aside className="customer-sidebar"><p className="customer-nav-caption">MENU PELANGGAN</p><nav aria-label="Navigasi pelanggan">{menuItems.map((item) => <Link key={item.href} className={`customer-nav-link${activeTab === item.tab ? " active" : ""}`} aria-current={activeTab === item.tab ? "page" : undefined} href={item.href}><SidebarIcon name={item.icon}/><span>{item.label}</span></Link>)}</nav><form action={logout} className="customer-side-logout"><button type="submit"><SidebarIcon name="logout"/><span>Keluar</span></button></form></aside>
      <section className="customer-content">
        {params.error && <p className="customer-alert" role="alert">{params.error}</p>}
        {params.success && <RequestSuccessDialog withPrescription={params.success === "prescription"}/>}
        {params.purchase === "success" && <PurchaseSuccessDialog/>}
        {activeTab === "Beranda" || activeTab === "Cari Obat" ? <>
          <div className="customer-welcome"><div><p className="customer-kicker">APOTEK SRI UTAMA</p><h1>{activeTab === "Beranda" ? <>Selamat datang, {account.nama_pengguna}!</> : "Cari Obat"}</h1><p>Temukan obat dan kebutuhan kesehatan Anda dengan mudah.</p></div><span className="welcome-art" aria-hidden="true">✚</span></div>
          <MedicineCatalog
            medicines={medicines.map((m) => ({
              id_obat: m.id_obat,
              nama_obat: m.nama_obat,
              harga_jual: m.harga_jual.toString(),
              satuan: m.satuan,
              golongan_obat_id_golongan: m.golongan_obat_id_golongan,
              golongan_obat: m.golongan_obat,
              stok_obat: m.stok_obat.map((s) => ({
                id_stok: s.id_stok,
                jumlah_stok: s.jumlah_stok,
                tanggal_update: s.tanggal_update ? s.tanggal_update.toISOString() : null,
                keterangan: s.keterangan,
              })),
            }))}
            groups={groups}
            initialSelectedId={params.obat ? Number(params.obat) : undefined}
            initialError={params.error}
            activeTab={activeTab}
            selectedGolongan={params.golongan}
            searchQuery={params.q}
          />
        </> : activeTab === "Resep Saya" ? <section className="catalog-section"><p className="customer-kicker">AKUN ANDA</p><h1 className="customer-page-title">Resep Saya</h1><RequestList requests={requests} prescriptions={prescriptions}/></section> : <section className="catalog-section"><p className="customer-kicker">AKUN ANDA</p><h1 className="customer-page-title">Riwayat Transaksi</h1>{transactions.length ? transactions.map((tx) => <article className="history-row" key={tx.id_transaksi}><b>Transaksi #{tx.id_transaksi}</b><span>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(tx.tanggal)}</span><span>{money(tx.total.toString())}</span><span>{tx.status ?? "Diproses"}</span></article>) : <p className="catalog-empty">Belum ada transaksi pada akun Anda.</p>}</section>}
        <footer className="customer-footer">© Apotek Sri Utama · Sehat Bersama, Setiap Saat</footer>
      </section>
    </div>
  </main>;
}

function RequestSuccessDialog({ withPrescription }: { withPrescription: boolean }) {
  return <div className="request-success-backdrop">
    <section className="request-success-dialog" role="dialog" aria-modal="true" aria-labelledby="request-success-title">
      <span className="request-success-icon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="m13 25 7 7 16-17" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
      <p className="request-success-eyebrow">APOTEK SRI UTAMA</p>
      <h2 id="request-success-title">Permintaan berhasil diterima</h2>
      <p className="request-success-copy">{withPrescription ? "Permintaan obat dan lampiran resep sudah tersimpan. Apoteker akan memeriksa resep Anda." : "Permintaan obat Anda sudah tersimpan dan dapat dipantau pada menu Resep Saya."}</p>
      {withPrescription && <span className="request-success-status">Status resep: Menunggu validasi Apoteker</span>}
      <Link className="request-success-button" href="/pelanggan?tab=Resep%20Saya">Lihat resep saya</Link>
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
    <Link className="request-success-close" href="/pelanggan?tab=Resep%20Saya">Kembali ke resep saya</Link>
  </section></div>;
}

function RequestList({ requests, prescriptions }: { requests: CustomerRequest[]; prescriptions: CustomerPrescription[] }) {
  if (!requests.length) return <div className="catalog-empty">
    <p>Belum ada pengajuan resep atau permintaan obat.</p>
    <Link className="medicine-action" style={{ display: "inline-block", width: "auto", padding: "8px 20px", marginTop: "14px", textDecoration: "none" }} href="/pelanggan?tab=Cari%20Obat#daftar-obat">
      Cari Obat & Ajukan Resep →
    </Link>
  </div>;
  return <div className="request-list">{requests.map((request) => {
    const linkedRecipeId = Number(request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1]);
    const linkedFilename = request.keterangan?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|pdf))/i)?.[1];
    const related = prescriptions.filter((recipe) => linkedRecipeId
      ? recipe.id_resep === linkedRecipeId
      : Boolean(linkedFilename && recipe.catatan?.includes(linkedFilename)));
    const latest = request.resep_obat ?? related[0];
    const rejection = latest?.catatan?.match(/Alasan:\s*(.*)$/i)?.[1];
    const prescriptionDetails = request.detail_permintaan_obat.filter((detail) => /amoxicillin|amoxycillin/i.test(detail.obat.nama_obat));
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
