import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import Link from "next/link";
import { dateText } from "@/lib/apoteker-data";
import type { ApotekerDashboardData } from "@/lib/assistant-dashboard-data";
import type { StaffRole } from "@/lib/auth";

function Metric({ label, value, tone = "green" }: { label: string; value: string | number; tone?: "green" | "red" }) {
  return <article className="pharmacist-metric"><span>{label}</span><b className={tone}>{value}</b></article>;
}

export default function ApotekerDashboard({ data, name, role = "apoteker" }: { data: ApotekerDashboardData; name: string; role?: StaffRole }) {
  const stats = data.metrics;
  const canInspectRecipe = role === "apoteker";
  return <ApotekerShell active="/" name={name} role={role}>
    <PageHeading eyebrow="DASHBOARD OPERASIONAL" title={`Halo, ${name}!`} description="Ringkasan metrik operasional dan aktivitas validasi resep Apotek Sri Utama." />
    <div className="pharmacist-metrics">
      <Metric label="Total resep masuk" value={stats.totalResep}/><Metric label="Menunggu validasi" value={stats.menunggu} tone={stats.menunggu ? "red" : "green"}/>
      <Metric label="Resep disetujui" value={stats.disetujui}/><Metric label="Resep ditolak" value={stats.ditolak} tone={stats.ditolak ? "red" : "green"}/>
    </div>
    <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>AKTIVITAS</p><h2>Aktivitas Validasi Resep Terbaru</h2></div>{canInspectRecipe ? <Link href="/apoteker/resep">Lihat semua resep</Link> : <Link href="/apoteker/laporan">Lihat laporan lengkap</Link>}</div>
      {data.activities.length ? <div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>Tanggal resep</th><th>ID resep</th><th>Nama pasien</th><th>Status</th></tr></thead><tbody>{data.activities.map((row) => <tr key={row.id}><td>{dateText(row.date)}</td><td>{canInspectRecipe ? <Link href={`/apoteker/resep/${row.id}`}>#{row.id}</Link> : `#${row.id}`}</td><td>{row.patient}</td><td><span className={`status-pill ${row.status.toLowerCase()}`}>{row.status}</span></td></tr>)}</tbody></table></div> : <p className="pharmacist-empty">Belum ada resep untuk ditampilkan.</p>}
    </section>
  </ApotekerShell>;
}
