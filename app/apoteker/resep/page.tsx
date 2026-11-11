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
  const { apoteker } = await requireApoteker(["apoteker"]);
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
    if (!request.pelanggan_id_pengguna) return [];
    const linkedId = request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1];
    const filename = request.keterangan?.match(filePattern)?.[1];
    const matchesRequest = (recipe: typeof candidateRecipes[number]) => {
      if (recipe.pelanggan_id_pengguna !== request.pelanggan_id_pengguna) return false;
      if (recipe.permintaan_obat_id_permintaan !== null) {
        return recipe.permintaan_obat_id_permintaan === request.id_permintaan;
      }
      if (linkedId) return recipe.id_resep === Number(linkedId);
      return Boolean(filename && recipe.catatan?.includes(filename));
    };
    const directRecipe = request.resep_obat && matchesRequest(request.resep_obat) ? request.resep_obat : null;
    const matches = directRecipe ? [directRecipe] : candidateRecipes.filter(matchesRequest);
    const recipe = matches.sort((a, b) => Math.abs((a.tanggal_resep?.getTime() ?? 0) - (request.tanggal_permintaan?.getTime() ?? 0)) - Math.abs((b.tanggal_resep?.getTime() ?? 0) - (request.tanggal_permintaan?.getTime() ?? 0)))[0];
    const resolvedFilename =
      filename ??
      recipe?.catatan?.match(filePattern)?.[1] ??
      recipe?.file_resep?.match(filePattern)?.[1] ??
      (recipe ? `00000000-0000-4000-8000-${String(recipe.id_resep).padStart(12, "0")}.jpg` : null);
    return recipe ? [{ request, recipe, status: normalizedStatus(recipe.status_validasi), filename: resolvedFilename }] : [];
  });

  const rows = requests.map((request) => {
    const matched = matchedRows.find((row) => row.request.id_permintaan === request.id_permintaan);
    const requiresPrescription = request.detail_permintaan_obat.some((detail) => /amoxicillin|amoxycillin/i.test(detail.obat.nama_obat));
    return matched ?? { request, recipe: null, status: requiresPrescription ? "Belum ada resep" as const : "Tidak perlu resep" as const, filename: null };
  });
  const filteredRows = selected === "Semua" ? rows : rows.filter((row) => row.status === selected);
  const counts = {
    Menunggu: rows.filter((row) => row.status === "Menunggu").length,
    Disetujui: rows.filter((row) => row.status === "Disetujui").length,
    Ditolak: rows.filter((row) => row.status === "Ditolak").length,
    Semua: rows.length,
  };
  const tabs: ValidationStatus[] = ["Menunggu", "Disetujui", "Ditolak"];

  return <ApotekerShell active="/apoteker/resep" name={apoteker.nama_pengguna} role={apoteker.role}>
    <PageHeading eyebrow="LAYANAN APOTEK" title="Validasi Resep" description="Validasi obat yang tersedia di apotek."/>
    <section className="pharmacist-panel">
      <div className="recipe-status-tabs" aria-label="Filter status resep">
        {tabs.map((status) => <Link key={status} className={`recipe-status-tab${selected === status ? " active" : ""}`} href={`/apoteker/resep?status=${encodeURIComponent(status)}`}><span>{status}</span><b>{counts[status]}</b></Link>)}
        <Link className={`recipe-status-tab${selected === "Semua" ? " active" : ""}`} href="/apoteker/resep"><span>Semua</span><b>{counts.Semua}</b></Link>
      </div>
      <div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>No.</th><th>ID Permintaan</th><th>ID Resep</th><th>Nama Pelanggan</th><th>Nama Pasien</th><th>Tanggal Diajukan</th><th>Obat / Jumlah</th><th>Lampiran</th><th>Status</th><th>Aksi</th></tr></thead><tbody>
        {filteredRows.map(({ request, recipe, status, filename }, index) => <tr key={`${request.id_permintaan}-${recipe?.id_resep ?? "none"}`}>
          <td>{String(index + 1).padStart(3, "0")}</td><td>#{request.id_permintaan}</td><td>{recipe ? `#${recipe.id_resep}` : "—"}</td>
          <td>{request.pelanggan?.nama_pengguna ?? "—"}</td><td><b>{recipe?.nama_pasien ?? request.pelanggan?.nama_pengguna ?? "—"}</b></td>
          <td>{dateText(request.tanggal_permintaan)}</td><td>{request.detail_permintaan_obat.map((detail) => `${detail.obat.nama_obat} × ${detail.jumlah ?? "—"}`).join(", ")}</td>
          <td>{filename ? <Link className="table-action" href={`/api/apoteker/resep/${filename}`} target="_blank" rel="noreferrer">Buka ({filename.split(".").pop()?.toUpperCase()})</Link> : "Tidak tersedia"}</td><td><span className={`status-pill ${status.toLowerCase()}`}>{status}</span></td>
          <td><div className="recipe-row-actions">{recipe ? <><Link className="table-action" href={`/apoteker/resep/${recipe.id_resep}`}>Detail</Link>{status === "Menunggu" && <>
            <form action={reviewPrescription}><input type="hidden" name="id_resep" value={recipe.id_resep}/><input type="hidden" name="keputusan" value="Disetujui"/><button className="pharmacist-button primary" type="submit">Setujui</button></form>
            <form action={reviewPrescription} className="recipe-inline-reject"><input type="hidden" name="id_resep" value={recipe.id_resep}/><input type="hidden" name="keputusan" value="Ditolak"/><label className="sr-only" htmlFor={`reject-reason-${recipe.id_resep}`}>Alasan penolakan untuk resep {recipe.id_resep}</label><input id={`reject-reason-${recipe.id_resep}`} name="alasan" required maxLength={150} placeholder="Alasan penolakan"/><button className="pharmacist-button danger" type="submit">Tolak</button></form>
          </>}</> : <Link className="table-action" href="/apoteker/permintaan">Lihat permintaan</Link>}</div></td>
        </tr>)}
        {!filteredRows.length && <tr><td colSpan={10} className="table-empty">Belum ada permintaan resep untuk filter ini.</td></tr>}
      </tbody></table></div>
    </section>
  </ApotekerShell>;
}
