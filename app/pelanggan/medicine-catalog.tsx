"use client";

import { useState, useTransition, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { submitMedicineRequest } from "./actions";
import { medicineImage } from "@/lib/medicine-images";

export type MedicineItem = {
  id_obat: number;
  nama_obat: string;
  harga_jual: string | number;
  satuan: string | null;
  golongan_obat_id_golongan: number | null;
  golongan_obat: { nama_golongan: string } | null;
  stok_obat: { id_stok: number; jumlah_stok: number; tanggal_update: Date | string | null; keterangan: string | null }[];
};

type GroupItem = {
  id_golongan: number;
  nama_golongan: string;
};

type Props = {
  medicines: MedicineItem[];
  groups: GroupItem[];
  initialSelectedId?: number;
  initialError?: string;
  activeTab: string;
  selectedGolongan?: string;
  searchQuery?: string;
};

const money = (value: number | string) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value));

function getStock(stok_obat: MedicineItem["stok_obat"]): number {
  if (!stok_obat || !stok_obat.length) return 0;
  const sorted = [...stok_obat].sort((a, b) => {
    const timeA = a.tanggal_update ? new Date(a.tanggal_update).getTime() : -1;
    const timeB = b.tanggal_update ? new Date(b.tanggal_update).getTime() : -1;
    return timeB - timeA || b.id_stok - a.id_stok;
  });
  return sorted[0]?.jumlah_stok ?? 0;
}

export default function MedicineCatalog({
  medicines,
  groups,
  initialSelectedId,
  initialError,
  activeTab,
  selectedGolongan,
  searchQuery,
}: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId ?? null);
  const [clientError, setClientError] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local time

  const selected = medicines.find((item) => item.id_obat === selectedId);
  const selectedStock = selected ? getStock(selected.stok_obat) : 0;
  const isAmoxicillin = selected ? /amoxicillin|amoxycillin/i.test(selected.nama_obat) : false;

  const openMedicine = (id: number) => {
    setSelectedId(id);
    setClientError(null);
    setFileName(null);
    setFileError(null);

    // Update URL query smoothly
    const url = new URL(window.location.href);
    url.searchParams.set("obat", String(id));
    window.history.pushState({}, "", url.toString());
  };

  const closeModal = () => {
    setSelectedId(null);
    setClientError(null);
    setFileName(null);
    setFileError(null);

    // Clear obat param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("obat");
    window.history.pushState({}, "", url.toString());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileName(null);
      setFileError(null);
      return;
    }
    const maxBytes = 4.5 * 1024 * 1024;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    if (file.size > maxBytes) {
      setFileError(`Ukuran file (${sizeMb} MB) terlalu besar. Maksimal 4.5 MB.`);
      setFileName(null);
      e.target.value = "";
    } else {
      setFileError(null);
      setFileName(`${file.name} (${sizeMb} MB)`);
    }
  };

  return (
    <>
      <section className="catalog-section" id="daftar-obat">
        <div className="catalog-title">
          <div>
            <p className="customer-kicker">KATALOG APOTEK</p>
            <h2>{activeTab === "Beranda" ? "Cari obat yang Anda butuhkan" : "Semua Obat"}</h2>
          </div>
          <span className="catalog-count">{medicines.length} produk</span>
        </div>

        <form className="medicine-search" action="/pelanggan#daftar-obat">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            name="q"
            defaultValue={searchQuery}
            placeholder="Cari nama obat..."
            aria-label="Cari nama obat"
          />
          {selectedGolongan && <input type="hidden" name="golongan" value={selectedGolongan} />}
          <button type="submit">Cari Obat</button>
        </form>

        <div className="category-list">
          <Link
            className={!selectedGolongan ? "category-chip selected" : "category-chip"}
            href={searchQuery ? `/pelanggan?q=${encodeURIComponent(searchQuery)}#daftar-obat` : "/pelanggan#daftar-obat"}
          >
            Semua kategori
          </Link>
          {groups.map((group) => {
            const isSelected = selectedGolongan === String(group.id_golongan);
            const params = new URLSearchParams();
            if (searchQuery) params.set("q", searchQuery);
            params.set("golongan", String(group.id_golongan));
            return (
              <Link
                key={group.id_golongan}
                className={isSelected ? "category-chip selected" : "category-chip"}
                href={`/pelanggan?${params.toString()}#daftar-obat`}
              >
                {group.nama_golongan}
              </Link>
            );
          })}
        </div>

        {medicines.length ? (
          <div className="medicine-grid">
            {medicines.map((item) => {
              const stock = getStock(item.stok_obat);
              const needsPrescription = /amoxicillin|amoxycillin/i.test(item.nama_obat);
              const image = medicineImage(item.id_obat, item.nama_obat);

              return (
                <article className="medicine-card" key={item.id_obat}>
                  <button
                    type="button"
                    className="medicine-visual"
                    onClick={() => openMedicine(item.id_obat)}
                    aria-label={`Lihat detail ${item.nama_obat}`}
                    style={{ cursor: "pointer", border: 0, padding: 0, width: "100%", background: "transparent" }}
                  >
                    {image ? (
                      <Image src={image} width={240} height={180} alt={item.nama_obat} style={{ objectFit: "contain" }} />
                    ) : (
                      <span className="medicine-cross" aria-hidden="true">✚</span>
                    )}
                    {needsPrescription && <span className="prescription-label">Perlu resep</span>}
                  </button>

                  <div className="medicine-info">
                    <span className="medicine-category">{item.golongan_obat?.nama_golongan ?? "Kategori lain"}</span>
                    <h3>
                      <button
                        type="button"
                        onClick={() => openMedicine(item.id_obat)}
                        style={{ background: "none", border: 0, padding: 0, font: "inherit", color: "inherit", textAlign: "left", cursor: "pointer" }}
                      >
                        {item.nama_obat}
                      </button>
                    </h3>
                    <p className="medicine-unit">Satuan: {item.satuan ?? "—"}</p>
                    <div className="medicine-meta">
                      <b>{money(item.harga_jual.toString())}</b>
                      <span className={stock > 0 ? "stock-in" : "stock-out"}>
                        {stock > 0 ? `Stok ${stock}` : "Stok habis"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="medicine-action"
                      onClick={() => openMedicine(item.id_obat)}
                      style={{ cursor: "pointer", border: 0, width: "100%" }}
                    >
                      {needsPrescription ? "Lihat Detail & Ajukan Resep →" : "Lihat detail →"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="catalog-empty">Obat tidak ditemukan. Coba kata kunci atau kategori lain.</div>
        )}
      </section>

      {/* DETAIL MODAL */}
      {selected && (
        <div
          className="detail-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
          style={{ zIndex: 9999 }}
        >
          <section className="medicine-detail" aria-labelledby="medicine-detail-title">
            <button
              type="button"
              className="detail-close"
              onClick={closeModal}
              aria-label="Tutup detail obat"
              style={{ cursor: "pointer", border: 0 }}
            >
              ×
            </button>

            <div className="detail-visual">
              {medicineImage(selected.id_obat, selected.nama_obat) ? (
                <Image
                  src={medicineImage(selected.id_obat, selected.nama_obat)!}
                  width={480}
                  height={480}
                  alt={selected.nama_obat}
                  style={{ objectFit: "contain", maxHeight: 380 }}
                />
              ) : (
                <span aria-hidden="true">✚</span>
              )}
            </div>

            <div className="detail-body">
              <span className="medicine-category">{selected.golongan_obat?.nama_golongan ?? "Kategori lain"}</span>
              <h2 id="medicine-detail-title">{selected.nama_obat}</h2>
              <p>Satuan: {selected.satuan ?? "—"}</p>
              <p className="detail-price">{money(selected.harga_jual.toString())}</p>
              <p>Stok tersedia: {selectedStock} {selected.satuan ?? "unit"}</p>

              {isAmoxicillin ? (
                <p className="detail-prescription-badge">
                  ⚠️ Wajib Resep Dokter · Memerlukan persetujuan Apoteker
                </p>
              ) : (
                <p className="detail-otc-badge">
                  ✓ Obat Bebas · Langsung Transaksi Tanpa Resep
                </p>
              )}

              {clientError && (
                <p className="customer-alert" role="alert" style={{ marginTop: 12, marginBottom: 12 }}>
                  {clientError}
                </p>
              )}

              <form
                className="request-form"
                action={(formData) => {
                  startTransition(async () => {
                    try {
                      await submitMedicineRequest(formData);
                    } catch (err: any) {
                      if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err;
                      setClientError(err?.message || "Terjadi kendala saat memproses pesanan.");
                    }
                  });
                }}
                encType="multipart/form-data"
              >
                <input type="hidden" name="id_obat" value={selected.id_obat} />

                <label>
                  Jumlah
                  <input
                    name="jumlah"
                    type="number"
                    min="1"
                    max={Math.max(1, selectedStock)}
                    defaultValue="1"
                    required
                    disabled={selectedStock < 1 || isPending}
                  />
                </label>

                <label>
                  Metode pembayaran
                  <select name="metode_pembayaran" defaultValue="QRIS" disabled={isPending}>
                    <option value="QRIS">QRIS</option>
                    <option value="Tunai">Tunai</option>
                  </select>
                </label>

                {isAmoxicillin && (
                  <>
                    <label className="recipe-upload">
                      Nama dokter
                      <input
                        type="text"
                        name="nama_dokter"
                        maxLength={100}
                        required
                        placeholder="Contoh: Dr. Budi Santoso, Sp.A"
                        disabled={isPending}
                      />
                      <small>Isi sesuai nama dokter pada resep</small>
                    </label>

                    <label>
                      Tanggal resep
                      <input
                        type="date"
                        name="tanggal_resep"
                        defaultValue={todayStr}
                        max={todayStr}
                        required
                        disabled={isPending}
                      />
                    </label>

                    <label className="recipe-upload">
                      Unggah foto resep dokter
                      <input
                        type="file"
                        name="resep"
                        accept="image/jpeg,image/png,application/pdf"
                        required
                        disabled={isPending}
                        onChange={handleFileChange}
                      />
                      <small>JPG, PNG, atau PDF · maks. 4.5 MB</small>
                      {fileName && <span style={{ color: "#087443", fontSize: "11px", fontWeight: 600 }}>File dipilih: {fileName}</span>}
                      {fileError && <span style={{ color: "#d9534f", fontSize: "11px", fontWeight: 600 }}>{fileError}</span>}
                    </label>
                  </>
                )}

                <label>
                  Catatan (opsional)
                  <textarea
                    name="catatan"
                    maxLength={225}
                    placeholder={isAmoxicillin ? "Catatan untuk apoteker..." : "Catatan pesanan..."}
                    disabled={isPending}
                  />
                </label>

                <button
                  className="medicine-action request-submit"
                  type="submit"
                  disabled={selectedStock < 1 || isPending || Boolean(fileError)}
                  style={{
                    opacity: isPending ? 0.75 : 1,
                    cursor: isPending || selectedStock < 1 ? "not-allowed" : "pointer",
                  }}
                >
                  {isPending
                    ? isAmoxicillin
                      ? "⏳ Sedang Mengunggah & Memproses Resep..."
                      : "⏳ Sedang Memproses Transaksi..."
                    : selectedStock < 1
                    ? "Stok habis"
                    : isAmoxicillin
                    ? "Unggah Resep & Ajukan Pembelian"
                    : "Beli Sekarang (Langsung Transaksi)"}
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
