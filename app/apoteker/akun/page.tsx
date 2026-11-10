import type { Metadata } from "next";
import { Suspense } from "react";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { requireApoteker } from "@/lib/apoteker-access";

export const metadata: Metadata = { title: "Akun Pengguna | Apotek Sri Utama" };

export default function AkunPage() {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat akun…</main>}><AkunContent/></Suspense>;
}

async function AkunContent() {
  const { apoteker } = await requireApoteker();
  return <ApotekerShell active="/apoteker/akun" name={apoteker.nama_pengguna} role={apoteker.role}>
    <PageHeading eyebrow="PENGATURAN AKUN" title={`Akun ${apoteker.roleLabel}`} description="Informasi akun yang sedang digunakan."/>
    <section className="pharmacist-panel account-details"><div className="pharmacist-panel-heading"><div><p>PROFIL ({apoteker.roleLabel.toUpperCase()})</p><h2>{apoteker.nama_pengguna}</h2></div><span className="status-pill valid">{apoteker.status}</span></div><dl><div><dt>Peran (Role)</dt><dd>{apoteker.roleLabel}</dd></div><div><dt>Username</dt><dd>{apoteker.username}</dd></div><div><dt>Email</dt><dd>{apoteker.email}</dd></div><div><dt>Nomor telepon</dt><dd>{apoteker.no_hp ?? "Belum tersedia"}</dd></div><div><dt>Alamat</dt><dd>{apoteker.alamat ?? "Belum tersedia"}</dd></div></dl><p className="pharmacist-footnote">Informasi dibaca dari tabel {apoteker.roleLabel} pada database.</p></section>
  </ApotekerShell>;
}
