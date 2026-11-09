"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createSale } from "@/app/apoteker/actions";

type Medicine = { id: number; name: string; unit: string | null; price: string; stock: number; group: string | null };
type Customer = { id: number; name: string };
type Line = { id_obat: number; jumlah: number };
const currency = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

function SubmitSaleButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button className="pharmacist-button primary sale-submit" type="submit" disabled={disabled || pending}>{pending ? "Menyimpan…" : "Simpan Transaksi"}</button>;
}

export default function SaleForm({ medicines, customers }: { medicines: Medicine[]; customers: Customer[] }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const chosen = medicines.find((item) => item.id === Number(selectedId));
  const filtered = useMemo(() => medicines.filter((item) => item.name.toLocaleLowerCase("id-ID").includes(query.toLocaleLowerCase("id-ID"))), [medicines, query]);
  const total = lines.reduce((sum, line) => sum + Number(medicines.find((item) => item.id === line.id_obat)?.price ?? 0) * line.jumlah, 0);

  function addLine() {
    if (!chosen || chosen.stock < 1) return;
    setLines((current) => {
      const found = current.find((line) => line.id_obat === chosen.id);
      if (found) return current.map((line) => line.id_obat === chosen.id ? { ...line, jumlah: Math.min(line.jumlah + 1, chosen.stock) } : line);
      return [...current, { id_obat: chosen.id, jumlah: 1 }];
    });
  }

  return <form action={createSale} className="sale-form">
    <div className="sale-customer-row"><label>Pelanggan<select name="pelanggan_id_pengguna" defaultValue=""><option value="">Pelanggan umum</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}</select></label><label>Metode pembayaran<select name="metode_pembayaran" defaultValue="Tunai"><option value="Tunai">Tunai</option><option value="QRIS">QRIS</option></select></label></div>
    <section className="sale-product-picker"><h3>Pilih obat</h3><div className="sale-picker-controls"><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama obat" aria-label="Cari obat untuk transaksi"/><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} aria-label="Pilih obat"><option value="">Pilih obat</option>{filtered.map((item) => <option value={item.id} key={item.id} disabled={item.stock < 1}>{item.name} · stok {item.stock}</option>)}</select><button className="pharmacist-button primary" type="button" onClick={addLine} disabled={!chosen || chosen.stock < 1}>Tambah Obat</button></div></section>
    <input type="hidden" name="items" value={JSON.stringify(lines)}/>
    <div className="pharmacist-table-scroll"><table className="pharmacist-table"><thead><tr><th>Obat</th><th>Harga satuan</th><th>Jumlah</th><th>Subtotal</th><th></th></tr></thead><tbody>{lines.map((line) => { const item = medicines.find((medicine) => medicine.id === line.id_obat)!; return <tr key={line.id_obat}><td><b>{item.name}</b><small className="table-subtext">{item.group ?? "Tanpa golongan"}</small></td><td>{currency(Number(item.price))}</td><td><input className="sale-quantity" aria-label={`Jumlah ${item.name}`} type="number" min="1" max={item.stock} value={line.jumlah} onChange={(event) => setLines((current) => current.map((row) => row.id_obat === line.id_obat ? { ...row, jumlah: Math.max(1, Math.min(item.stock, Number(event.target.value) || 1)) } : row))}/><small className="table-subtext">maks. {item.stock}</small></td><td>{currency(Number(item.price) * line.jumlah)}</td><td><button className="table-action danger-text" type="button" onClick={() => setLines((current) => current.filter((row) => row.id_obat !== line.id_obat))}>Hapus</button></td></tr>; })}{!lines.length && <tr><td colSpan={5} className="table-empty">Tambahkan obat ke daftar transaksi.</td></tr>}</tbody><tfoot><tr><th colSpan={3}>Total pembayaran</th><th>{currency(total)}</th><th></th></tr></tfoot></table></div>
    <SubmitSaleButton disabled={!lines.length}/>
    <p className="pharmacist-footnote">Obat dengan golongan resep hanya dapat dijual setelah ada resep berstatus Valid untuk pelanggan terpilih. Stok diperiksa dan diperbarui bersamaan dengan penyimpanan transaksi.</p>
  </form>;
}
