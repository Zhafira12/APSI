import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { reviewRequest } from "@/app/apoteker/actions";
import { requireApoteker } from "@/lib/apoteker-access";
import { dateText, money } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Permintaan Obat | Apotek Sri Utama" };
type Props = { searchParams: Promise<{ q?: string; status?: string; success?: string; error?: string }> };

export default function PermintaanPage(props: Props) {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat permintaan obat…</main>}><PermintaanContent {...props}/></Suspense>;
}

async function PermintaanContent({ searchParams }: Props) {
  const { apoteker } = await requireApoteker();
  const params = await searchParams;
  const statuses = ["Menunggu", "Diproses", "Ditolak", "Selesai"];
  const status = statuses.includes(params.status ?? "") ? params.status : undefined;
  const q = params.q?.trim();
  const requests = await prisma.permintaan_obat.findMany({
    where: {
      status_permintaan: status,
      OR: q ? [
        { pelanggan: { nama_pengguna: { contains: q, mode: "insensitive" } } },
        { detail_permintaan_obat: { some: { obat: { nama_obat: { contains: q, mode: "insensitive" } } } } },
      ] : undefined,
    },
    include: {
      pelanggan: { select: { id_pengguna: true, nama_pengguna: true, no_hp: true } },
      detail_permintaan_obat: {
        include: {
          obat: {
            include: {
              golongan_obat: true,
              stok_obat: { select: { id_stok: true, jumlah_stok: true, tanggal_update: true, keterangan: true } },
            },
          },
        },
      },
    },
    orderBy: [{ tanggal_permintaan: "desc" }, { id_permintaan: "desc" }],
  });
  const patients = [...new Set(requests.map((item) => item.pelanggan_id_pengguna).filter((id): id is number => id !== null))];
  const medicines = [...new Set(requests.flatMap((item) => item.detail_permintaan_obat.map((row) => row.id_obat)))];
  const linkedRecipeIds = requests.flatMap((request) => {
    const match = request.keterangan?.match(/Resep ID:\s*(\d+)/i);
    return match ? [Number(match[1])] : [];
  }).filter((id) => Number.isSafeInteger(id) && id > 0);
  const recipes = patients.length && linkedRecipeIds.length ? await prisma.resep_obat.findMany({ where: { id_resep: { in: linkedRecipeIds }, pelanggan_id_pengguna: { in: patients }, status_validasi: { in: ["Disetujui", "Valid"] }, detail_resep_obat: { some: { id_obat: { in: medicines } } } }, include: { detail_resep_obat: { select: { id_obat: true } } } }) : [];
  const validRecipeKeys = new Set(recipes.flatMap((recipe) => recipe.detail_resep_obat.map((detail) => `${recipe.id_resep}:${recipe.pelanggan_id_pengguna}:${detail.id_obat}`)));

  return <ApotekerShell active="/apoteker/permintaan" name={apoteker.nama_pengguna}>
    <PageHeading eyebrow="LAYANAN PELANGGAN" title="Permintaan Obat" description="Tinjau obat, jumlah, ketersediaan stok, dan resep pelanggan."/>
    {params.success && <p className="pharmacist-notice success" role="status">{params.success}</p>}{params.error && <p className="pharmacist-notice error" role="alert">{params.error}</p>}
    <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>{requests.length} PERMINTAAN</p><h2>Daftar Permintaan</h2></div></div>
      <form className="pharmacist-filter" action="/apoteker/permintaan"><input type="search" name="q" placeholder="Cari pelanggan atau obat" defaultValue={q}/><select name="status" defaultValue={status ?? ""}><option value="">Semua status</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button className="pharmacist-button primary">Cari</button><Link className="pharmacist-button secondary" href="/apoteker/permintaan">Reset</Link></form>
      <div className="pharmacist-request-list">{requests.map((request) => {
        const pending = !request.status_permintaan || ["menunggu", "baru"].includes(request.status_permintaan.toLowerCase());
        return <article className="pharmacist-request-card" key={request.id_permintaan}>
          <header><div><small>PERMINTAAN #{String(request.id_permintaan).padStart(3, "0")}</small><h3>{request.pelanggan?.nama_pengguna ?? "Pelanggan"}</h3><span>{request.pelanggan?.no_hp ?? "Kontak tidak tersedia"} · {dateText(request.tanggal_permintaan)}</span></div><span className={`status-pill ${(request.status_permintaan ?? "Menunggu").toLowerCase()}`}>{request.status_permintaan ?? "Menunggu"}</span></header>
          <div className="pharmacist-request-lines">{request.detail_permintaan_obat.map((detail) => {
            const quantity = Number(detail.jumlah ?? 0);
            const stock = detail.obat.stok_obat.sort((a, b) => (b.tanggal_update?.getTime() ?? -1) - (a.tanggal_update?.getTime() ?? -1) || b.id_stok - a.id_stok)[0]?.jumlah_stok ?? 0;
            const needsRecipe = /resep|antibiotik|keras/i.test(detail.obat.golongan_obat?.nama_golongan ?? "");
            const linkedRecipeId = Number(request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1]);
            const hasRecipe = request.pelanggan_id_pengguna !== null && Number.isSafeInteger(linkedRecipeId) && validRecipeKeys.has(`${linkedRecipeId}:${request.pelanggan_id_pengguna}:${detail.id_obat}`);
            return <div className="pharmacist-request-line" key={detail.id_detail_permintaan_obat}><b>{detail.obat.nama_obat}</b><span>{quantity} {detail.obat.satuan ?? "unit"}</span><span>{money(detail.obat.harga_jual.toString())} / satuan</span><span className={stock >= quantity ? "text-green" : "text-danger"}>Stok {stock >= quantity ? "tersedia" : "tidak cukup"} ({stock})</span><span className={needsRecipe ? (hasRecipe ? "text-green" : "text-danger") : "text-muted"}>{needsRecipe ? (hasRecipe ? "Resep valid" : "Resep belum valid") : "Tidak perlu resep"}</span></div>;
          })}</div>
          {request.keterangan && <p className="pharmacist-request-note"><b>Catatan:</b> {request.keterangan}</p>}
          {pending && <form action={reviewRequest} className="request-review-form"><input type="hidden" name="id_permintaan" value={request.id_permintaan}/><label>Alasan penolakan (wajib jika ditolak)<input name="alasan" maxLength={160} placeholder="Alasan penolakan"/></label><button className="pharmacist-button primary" name="keputusan" value="Diproses">Terima Permintaan</button><button className="pharmacist-button danger" name="keputusan" value="Ditolak">Tolak</button></form>}
        </article>;
      })}{!requests.length && <p className="pharmacist-empty">Belum ada permintaan yang cocok.</p>}</div>
    </section>
  </ApotekerShell>;
}
