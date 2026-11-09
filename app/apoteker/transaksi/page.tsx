import type { Metadata } from "next";
import { Suspense } from "react";
import { ApotekerShell, PageHeading } from "@/app/apoteker-shell";
import SaleForm from "./sale-form";
import { requireApoteker } from "@/lib/apoteker-access";
import { getMedicineInventory } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Transaksi Penjualan | Apotek Sri Utama" };
type Props = { searchParams: Promise<{ error?: string }> };

export default function TransaksiPage(props: Props) {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat transaksi…</main>}><TransaksiContent {...props}/></Suspense>;
}

async function TransaksiContent({ searchParams }: Props) {
  const { apoteker } = await requireApoteker();
  const [params, inventory, customers] = await Promise.all([searchParams, getMedicineInventory(), prisma.pelanggan.findMany({ where: { status: "Aktif" }, select: { id_pengguna: true, nama_pengguna: true }, orderBy: { nama_pengguna: "asc" } })]);
  const medicines = inventory.filter((item) => item.status === "Aktif").map((item) => ({ id: item.id_obat, name: item.nama_obat, unit: item.satuan, price: item.harga_jual.toString(), stock: item.stok, group: item.golongan_obat?.nama_golongan ?? null }));
  return <ApotekerShell active="/apoteker/transaksi" name={apoteker.nama_pengguna}>
    <PageHeading eyebrow="PENJUALAN APOTEK" title="Transaksi Baru" description="Pilih pelanggan, obat, jumlah, dan metode pembayaran."/>
    {params.error && <p className="pharmacist-notice error" role="alert">{params.error}</p>}
    <section className="pharmacist-panel"><div className="pharmacist-panel-heading"><div><p>CHECKOUT APOTEKER</p><h2>Rincian Penjualan</h2></div></div><SaleForm medicines={medicines} customers={customers.map((customer) => ({ id: customer.id_pengguna, name: customer.nama_pengguna }))}/></section>
  </ApotekerShell>;
}
