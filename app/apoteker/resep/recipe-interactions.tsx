"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { reviewPrescription } from "@/app/apoteker/actions";

export function PrescriptionViewer({ src, filename, patient }: { src: string; filename: string; patient: string }) {
  const [zoom, setZoom] = useState(100);
  const [open, setOpen] = useState(false);
  const isPdf = filename.toLowerCase().endsWith(".pdf") || src.startsWith("data:application/pdf");
  const increase = () => setZoom((value) => Math.min(value + 20, 200));
  const decrease = () => setZoom((value) => Math.max(value - 20, 60));

  return <>
    <div className="prescription-toolbar" aria-label="Kontrol lampiran resep">
      <button type="button" onClick={decrease} aria-label="Perkecil resep" disabled={zoom <= 60}>−</button>
      <output aria-live="polite">{zoom}%</output>
      <button type="button" onClick={increase} aria-label="Perbesar resep" disabled={zoom >= 200}>+</button>
      <button type="button" className="prescription-open" onClick={() => setOpen(true)}>Buka</button>
    </div>
    <div className="prescription-canvas">
      {isPdf
        ? <iframe className="prescription-frame" src={src} title={`Lampiran resep ${patient}`} />
        : <button className="prescription-image-button" type="button" onClick={() => setOpen(true)} aria-label="Buka resep dalam tampilan besar">
            <Image src={src} width={960} height={1200} alt={`Resep pasien ${patient}`} unoptimized style={{ transform: `scale(${zoom / 100})` }} />
          </button>}
    </div>
    {open && <div className="prescription-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="prescription-dialog" role="dialog" aria-modal="true" aria-label={`Lampiran resep ${patient}`}>
        <div className="prescription-dialog-toolbar"><div><b>Lampiran resep</b><span>{filename}</span></div><div className="prescription-dialog-actions">
          {!isPdf && <><button type="button" onClick={decrease} aria-label="Perkecil resep" disabled={zoom <= 60}>−</button><output>{zoom}%</output><button type="button" onClick={increase} aria-label="Perbesar resep" disabled={zoom >= 200}>+</button></>}
          <button type="button" className="prescription-close" onClick={() => setOpen(false)}>Tutup</button>
        </div></div>
        <div className="prescription-dialog-canvas">{isPdf
          ? <iframe className="prescription-pdf-large" src={src} title={`Lampiran resep ${patient}`} />
          : <Image src={src} width={1200} height={1600} alt={`Resep pasien ${patient}`} unoptimized style={{ transform: `scale(${zoom / 100})` }} />}</div>
      </section>
    </div>}
  </>;
}

export function RecipeDecisionForm({ id }: { id: number }) {
  const [decision, setDecision] = useState<"Disetujui" | "Ditolak" | null>(null);
  const reject = decision === "Ditolak";

  return <>
    <div className="recipe-review-form"><div className="pharmacist-form-actions">
      <button className="pharmacist-button primary" type="button" onClick={() => setDecision("Disetujui")}>Setujui Resep</button>
      <button className="pharmacist-button danger" type="button" onClick={() => setDecision("Ditolak")}>Tolak Resep</button>
    </div></div>
    {decision && <div className="recipe-confirm-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDecision(null); }}>
      <section className="recipe-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-confirm-title">
        <span className={`recipe-confirm-icon${reject ? " reject" : ""}`} aria-hidden="true">{reject ? "×" : "✓"}</span>
        <h2 id="recipe-confirm-title">{reject ? "Tolak Resep Ini?" : "Setujui Resep Ini?"}</h2>
        <p>{reject ? "Tuliskan alasan penolakan agar pelanggan dapat menindaklanjuti." : "Pastikan data pasien, dokter, dan obat pada resep sudah sesuai."}</p>
        <form action={reviewPrescription} className="recipe-confirm-form">
          <input type="hidden" name="id_resep" value={id}/>
          <input type="hidden" name="keputusan" value={decision}/>
          {reject && <label className="sr-only" htmlFor="rejection-reason">Alasan penolakan</label>}
          {reject && <textarea id="rejection-reason" name="alasan" required maxLength={150} placeholder="Contoh: resep tidak terbaca atau data dokter belum lengkap." autoFocus />}
          <div className="pharmacist-form-actions"><button type="button" className="pharmacist-button secondary" onClick={() => setDecision(null)}>Batal</button><button className={`pharmacist-button ${reject ? "danger" : "primary"}`} type="submit">{reject ? "Tolak Resep" : "Ya, Setujui"}</button></div>
        </form>
      </section>
    </div>}
  </>;
}

export function RecipeDecisionResult({ message, decision, id }: { message: string; decision: "Disetujui" | "Ditolak"; id: number }) {
  return <div className="recipe-confirm-overlay recipe-result-overlay">
    <section className="recipe-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="recipe-result-title">
      <span className={`recipe-confirm-icon${decision === "Ditolak" ? " reject" : ""}`} aria-hidden="true">{decision === "Ditolak" ? "×" : "✓"}</span>
      <h2 id="recipe-result-title">{message}</h2>
      <div className="recipe-result-links"><Link className="pharmacist-button secondary" href="/apoteker/resep">Kembali ke Daftar Resep</Link><Link className="pharmacist-button primary" href={`/apoteker/resep/${id}`}>Lihat Detail Resep</Link></div>
    </section>
  </div>;
}
