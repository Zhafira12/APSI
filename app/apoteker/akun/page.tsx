import type { Metadata } from "next";
import { Suspense } from "react";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { requireApoteker } from "@/lib/apoteker-access";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Akun Apoteker | Apotek Sri Utama" };

export default function AkunPage() {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat akun…</main>}><AkunContent/></Suspense>;
}

async function AkunContent() {
  const { apoteker } = await requireApoteker();
  const account = await prisma.apoteker.findUnique({ where: { id_pengguna: apoteker.id_pengguna }, select: { nama_pengguna: true, username: true, email: true, no_hp: true, alamat: true, status: true } });
  return <ApotekerShell active="/apoteker/akun" name={apoteker.nama_pengguna}>
    <PageHeading eyebrow="PENGATURAN AKUN" title="Akun Apoteker" description="Informasi akun yang sedang digunakan."/>
    {account && <section className="pharmacist-panel account-details"><div className="pharmacist-panel-heading"><div><p>PROFIL</p><h2>{account.nama_pengguna}</h2></div><span className="status-pill valid">{account.status}</span></div><dl><div><dt>Username</dt><dd>{account.username}</dd></div><div><dt>Email</dt><dd>{account.email}</dd></div><div><dt>Nomor telepon</dt><dd>{account.no_hp ?? "Belum tersedia"}</dd></div><div><dt>Alamat</dt><dd>{account.alamat ?? "Belum tersedia"}</dd></div></dl><p className="pharmacist-footnote">Informasi dibaca dari akun Apoteker pada database.</p></section>}
  </ApotekerShell>;
}
