import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import { reviewPrescription } from "@/app/apoteker/actions";
import { requireApoteker } from "@/lib/apoteker-access";
import { dateText } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Validasi Resep | Apotek Sri Utama" };
type Props = { searchParams: Promise<{ status?: string }> };
type ValidationStatus = "Menunggu" | "Disetujui" | "Ditolak";
const prescriptionMedicine = (name: string | null | undefined) => /resep|antibiotik|keras/i.test(name ?? "");
const filePattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|pdf))/i;

function normalizedStatus(status: string | null): ValidationStatus {
  if (status === "Ditolak") return "Ditolak";
  if (status === "Disetujui" || status === "Valid") return "Disetujui";
  return "Menunggu";
}

export default function ResepPage(props: Props) {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat resep…</main>}><ResepContent {...props}/></Suspense>;
}

async function ResepContent({ searchParams }: Props) {
  const { apoteker } = await requireApoteker();
  const params = await searchParams;
  const selected = ["Menunggu", "Disetujui", "Ditolak"].includes(params.status ?? "") ? params.status as ValidationStatus : "Semua";
  const requests = await prisma.permintaan_obat.findMany({
    include: {
      pelanggan: { select: { id_pengguna: true, nama_pengguna: true } },
      resep_obat: { include: { detail_resep_obat: { select: { id_obat: true } } } },
      detail_permintaan_obat: { include: { obat: { select: { id_obat: true, nama_obat: true, golongan_obat: { select: { nama_golongan: true } } } } } },
    },
    orderBy: [{ tanggal_permintaan: "desc" }, { id_permintaan: "desc" }],
  });
  const customerIds = [...new Set(requests.map((request) => request.pelanggan_id_pengguna).filter((id): id is number => id !== null))];
  const candidateRecipes = customerIds.length ? await prisma.resep_obat.findMany({
    where: { pelanggan_id_pengguna: { in: customerIds } },
    include: { detail_resep_obat: { select: { id_obat: true } } },
    orderBy: [{ tanggal_resep: "desc" }, { id_resep: "desc" }],
  }) : [];

  const matchedRows = requests.flatMap((request) => {
    const prescriptionDetails = request.detail_permintaan_obat.filter((detail) => prescriptionMedicine(detail.obat.golongan_obat?.nama_golongan));
    if (!request.pelanggan_id_pengguna) return [];
    const linkedId = request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1];
    const filename = request.keterangan?.match(filePattern)?.[1];
    const matchesRequest = (recipe: typeof candidateRecipes[number]) => {
      if (recipe.pelanggan_id_pengguna !== request.pelanggan_id_pengguna) return false;
      // New customer submissions have an explicit FK to their request. Trust that
      // link even when the medicine category is named unexpectedly.
      if (request.resep_obat?.id_resep === recipe.id_resep) return true;
      if (!prescriptionDetails.length || !prescriptionDetails.some((detail) => recipe.detail_resep_obat.some((line) => line.id_obat === detail.id_obat))) return false;
      if (linkedId) return recipe.id_resep === Number(linkedId);
      return filename ? Boolean(recipe.catatan?.includes(filename)) : true;
    };
    const directRecipe = request.resep_obat && matchesRequest(request.resep_obat) ? request.resep_obat : null;
    const matches = directRecipe ? [directRecipe] : candidateRecipes.filter(matchesRequest);
    const recipe = matches.sort((a, b) => Math.abs((a.tanggal_resep?.getTime() ?? 0) - (request.tanggal_permintaan?.getTime() ?? 0)) - Math.abs((b.tanggal_resep?.getTime() ?? 0) - (request.tanggal_permintaan?.getTime() ?? 0)))[0];
    return recipe ? [{ request, recipe, status: normalizedStatus(recipe.status_validasi), filename: filename ?? recipe.catatan?.match(filePattern)?.[1] ?? null }] : [];
  });

  // Legacy requests may point to one recipe by customer and medicine only. Collapse
  // those duplicates into one row and prefer the request that contains its upload.
  const uniqueByRecipe = new Map<number, (typeof matchedRows)[number]>();
  for (const row of matchedRows) {
    const current = uniqueByRecipe.get(row.recipe.id_resep);
    if (!current || (!current.filename && row.filename)) uniqueByRecipe.set(row.recipe.id_resep, row);
  }
  const rows = [...uniqueByRecipe.values()];
  const filteredRows = selected === "Semua" ? rows : rows.filter((row) => row.status === selected);
  const counts = {
    Menunggu: rows.filter((row) => row.status === "Menunggu").length,
    Disetujui: rows.filter((row) => row.status === "Disetujui").length,
    Ditolak: rows.filter((row) => row.status === "Ditolak").length,
    Semua: rows.length,
  };
  const tabs: ValidationStatus[] = ["Menunggu", "Disetujui", "Ditolak"];

  return <ApotekerShell active="/apoteker/resep" name={apoteker.nama_pengguna}>
    <PageHeading eyebrow="LAYANAN APOTEK" title="Validasi Resep" description="Validasi obat yang tersedia di apotek."/>
    <section className="pharmacist-panel">
      <div className="recipe-status-tabs" aria-label="Filter status resep">
        {tabs.map((status) => <Link key={status} className={`recipe-status-tab${selected === status ? " active" : ""}`} href={`/apoteker/resep?status=${encodeURIComponent(status)}`}><span>{status}</span><b>{counts[status]}</b></Link>)}
        <Link className={`recipe-status-tab${selected === "Semua" ? " active" : ""}`} href="/apoteker/resep"><span>Semua</span><b>{counts.Semua}</b></Link>
      </div>
      <div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>No.</th><th>ID Permintaan</th><th>ID Resep</th><th>Nama Pelanggan</th><th>Nama Pasien</th><th>Tanggal Diajukan</th><th>Obat / Jumlah</th><th>Lampiran</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
        {filteredRows.map(({ request, recipe, status, filename }, index) => <tr key={recipe.id_resep}>
          <td>{String(index + 1).padStart(3, "0")}</td><td>#{request.id_permintaan}</td><td>#{recipe.id_resep}</td>
          <td>{request.pelanggan?.nama_pengguna ?? "—"}</td><td><b>{recipe.nama_pasien ?? request.pelanggan?.nama_pengguna ?? "—"}</b></td>
          <td>{dateText(request.tanggal_permintaan)}</td><td>{request.detail_permintaan_obat.map((detail) => `${detail.obat.nama_obat} × ${detail.jumlah ?? "—"}`).join(", ")}</td>
          <td>{filename ? `1 File (${filename.split(".").pop()?.toUpperCase()})` : "Tidak tersedia"}</td><td><span className={`status-pill ${status.toLowerCase()}`}>{status}</span></td>
          <td><div className="recipe-row-actions"><Link className="table-action" href={`/apoteker/resep/${recipe.id_resep}`}>Detail</Link>{status === "Menunggu" && <>
            <form action={reviewPrescription}><input type="hidden" name="id_resep" value={recipe.id_resep}/><input type="hidden" name="keputusan" value="Disetujui"/><button className="pharmacist-button primary" type="submit">Setujui</button></form>
            <form action={reviewPrescription} className="recipe-inline-reject"><input type="hidden" name="id_resep" value={recipe.id_resep}/><input type="hidden" name="keputusan" value="Ditolak"/><label className="sr-only" htmlFor={`reject-reason-${recipe.id_resep}`}>Alasan penolakan untuk resep {recipe.id_resep}</label><input id={`reject-reason-${recipe.id_resep}`} name="alasan" required maxLength={150} placeholder="Alasan penolakan"/><button className="pharmacist-button danger" type="submit">Tolak</button></form>
          </>}</div></td>
        </tr>)}
        {!filteredRows.length && <tr><td colSpan={10} className="table-empty">Belum ada permintaan resep untuk filter ini.</td></tr>}
      </tbody></table></div>
    </section>
  </ApotekerShell>;
}
