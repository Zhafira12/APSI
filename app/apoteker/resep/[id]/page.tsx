import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { requireApoteker } from "@/lib/apoteker-access";
import { dateText } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";
import { extractRecipeFilename, hasRecipeAttachment } from "@/lib/recipe-storage";
import { PrescriptionViewer, RecipeDecisionForm, RecipeDecisionResult } from "@/app/apoteker/resep/recipe-interactions";

export const metadata: Metadata = { title: "Detail Resep | Apotek Sri Utama" };
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string; error?: string }> };

const DEFAULT_FALLBACK_FILENAME = "00000000-0000-4000-8000-000000000001.jpg";

export default function ResepDetailPage(props: Props) {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat detail resep…</main>}><ResepDetailContent {...props}/></Suspense>;
}

async function ResepDetailContent({ params, searchParams }: Props) {
  const { apoteker } = await requireApoteker(["apoteker"]);
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const idResep = Number(id);
  if (!Number.isInteger(idResep) || idResep < 1) notFound();
  const recipe = await prisma.resep_obat.findUnique({
    where: { id_resep: idResep },
    include: {
      pelanggan: { select: { nama_pengguna: true, no_hp: true } },
      permintaan_obat: { select: { id_permintaan: true, tanggal_permintaan: true, keterangan: true } },
      detail_resep_obat: { include: { obat: { include: { golongan_obat: true } } } },
    },
  });
  if (!recipe) notFound();

  let attachment =
    extractRecipeFilename(recipe.catatan) ??
    extractRecipeFilename(recipe.file_resep) ??
    extractRecipeFilename(recipe.permintaan_obat?.keterangan);

  if (!attachment && recipe.pelanggan_id_pengguna && recipe.detail_resep_obat.length) {
    const requests = await prisma.permintaan_obat.findMany({
      where: {
        pelanggan_id_pengguna: recipe.pelanggan_id_pengguna,
        detail_permintaan_obat: { some: { id_obat: { in: recipe.detail_resep_obat.map((detail) => detail.id_obat) } } },
      },
      select: { tanggal_permintaan: true, keterangan: true },
      orderBy: [{ tanggal_permintaan: "desc" }],
    });
    for (const request of requests) {
      const linkedId = request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1];
      const filename = extractRecipeFilename(request.keterangan);
      if ((linkedId && Number(linkedId) !== recipe.id_resep) || !filename) continue;
      if (await hasRecipeAttachment(filename, recipe.file_resep)) {
        attachment = filename;
        break;
      }
    }
  }

  // Fallback for seed recipes that don't have a UUID filename yet
  if (!attachment && (recipe.nama_dokter || recipe.detail_resep_obat.length)) {
    attachment = `00000000-0000-4000-8000-${String(recipe.id_resep).padStart(12, "0")}.jpg`;
  }

  const reviewed = ["valid", "disetujui", "ditolak"].includes((recipe.status_validasi ?? "").toLowerCase());
  const activeAttachment = attachment ?? DEFAULT_FALLBACK_FILENAME;

  return <ApotekerShell active="/apoteker/resep" name={apoteker.nama_pengguna} role={apoteker.role}>
    <PageHeading eyebrow="VALIDASI RESEP APOTEKER" title="Detail Resep" description={`Permintaan #${recipe.permintaan_obat?.id_permintaan ?? "—"} / Resep #${String(recipe.id_resep).padStart(3, "0")}`}/>
    {query.success && <p className="pharmacist-notice success" role="status">{query.success}</p>}{query.error && <p className="pharmacist-notice error" role="alert">{query.error}</p>}
    <Link className="pharmacist-button secondary back-link" href="/apoteker/resep">← Kembali ke daftar</Link>
    <div className="recipe-detail-grid">
      <section className="pharmacist-panel prescription-preview"><div className="pharmacist-panel-heading"><div><p>LAMPIRAN RESEP DARI PELANGGAN</p><h2>Dokumen Resep</h2></div></div>
        <PrescriptionViewer src={recipe.file_resep?.startsWith("data:") ? recipe.file_resep : `/api/apoteker/resep/${activeAttachment}`} filename={activeAttachment} patient={recipe.nama_pasien ?? recipe.pelanggan?.nama_pengguna ?? "Pelanggan"}/>
      </section>
      <section className="pharmacist-panel recipe-info"><div className="pharmacist-panel-heading"><div><p>INFORMASI PELANGGAN</p><h2>Data Resep</h2></div><span className={`status-pill ${(recipe.status_validasi ?? "Menunggu").toLowerCase()}`}>{recipe.status_validasi ?? "Menunggu"}</span></div>
        <dl className="recipe-facts"><div><dt>ID permintaan</dt><dd>{recipe.permintaan_obat ? `#${recipe.permintaan_obat.id_permintaan}` : "Data lama (belum tertaut)"}</dd></div><div><dt>Tanggal diajukan</dt><dd>{dateText(recipe.permintaan_obat?.tanggal_permintaan ?? null)}</dd></div><div><dt>ID resep</dt><dd>#{recipe.id_resep}</dd></div><div><dt>Pelanggan</dt><dd>{recipe.pelanggan?.nama_pengguna ?? "—"}</dd></div><div><dt>Pasien</dt><dd>{recipe.nama_pasien ?? recipe.pelanggan?.nama_pengguna ?? "—"}</dd></div><div><dt>Tanggal resep</dt><dd>{dateText(recipe.tanggal_resep)}</dd></div><div><dt>Dokter</dt><dd>{recipe.nama_dokter ?? "—"}</dd></div><div><dt>Kontak pelanggan</dt><dd>{recipe.pelanggan?.no_hp ?? "—"}</dd></div></dl>
        <div className="recipe-note"><small>KELENGKAPAN RESEP</small>{recipe.detail_resep_obat.length ? recipe.detail_resep_obat.map((detail) => <p key={detail.id_detail_resep}><b>{detail.obat.nama_obat}</b><br/>Golongan: {detail.obat.golongan_obat?.nama_golongan ?? "—"}<br/>Jumlah: {detail.jumlah ?? "—"}<br/>Aturan pakai: {detail.aturan_pakai ?? "—"}</p>) : <p>{recipe.daftar_obat ?? "Data obat belum dicantumkan."}</p>}</div>
        {recipe.catatan && <div className="recipe-note"><small>CATATAN</small><p>{recipe.catatan.replace(/(?:Lampiran:\s*)?private\/resep\/[0-9a-f-]+\.(?:jpg|jpeg|png|pdf)/i, "Lampiran resep tersimpan")}</p></div>}
        {!reviewed ? <RecipeDecisionForm id={recipe.id_resep}/> : <p className="pharmacist-footnote">Resep ini telah divalidasi dan tidak dapat diproses ulang.</p>}
      </section>
    </div>
    {query.success && <RecipeDecisionResult message={query.success} decision={recipe.status_validasi?.toLowerCase() === "ditolak" ? "Ditolak" : "Disetujui"} id={recipe.id_resep}/>}
  </ApotekerShell>;
}
