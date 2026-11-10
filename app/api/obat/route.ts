import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMedicineInventory } from "@/lib/apoteker-data";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Autentikasi diperlukan." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLocaleLowerCase("id-ID") ?? "";
  const golongan = Number(searchParams.get("golongan"));

  const inventory = await getMedicineInventory();
  const filtered = inventory.filter(
    (item) =>
      (!q || item.nama_obat.toLocaleLowerCase("id-ID").includes(q)) &&
      (!Number.isInteger(golongan) || golongan < 1 || item.golongan_obat_id_golongan === golongan)
  );

  return NextResponse.json({
    data: filtered.map((item) => ({
      id_obat: item.id_obat,
      nama_obat: item.nama_obat,
      golongan: item.golongan_obat?.nama_golongan ?? null,
      harga_jual: Number(item.harga_jual),
       ...(session.role !== "pelanggan" ? { harga_beli: Number(item.harga_beli), stok_minimum: item.stok_minimum } : {}),
      stok: item.stok,
      satuan: item.satuan,
      status: item.status,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !["admin", "apoteker", "asisten_apoteker"].includes(session.role)) {
    return NextResponse.json({ error: "Akses ditolak. Hanya Admin/Apoteker yang dapat menambah obat." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      nama_obat?: string;
      golongan_obat_id_golongan?: number | null;
      harga_beli?: number;
      harga_jual?: number;
      stok_minimum?: number;
      satuan?: string;
    };

    const name = String(body.nama_obat ?? "").trim();
    const buy = Number(body.harga_beli ?? 0);
    const sell = Number(body.harga_jual ?? 0);
    const minimum = Number(body.stok_minimum ?? 0);
    const unit = String(body.satuan ?? "").trim() || null;
    const group = body.golongan_obat_id_golongan ? Number(body.golongan_obat_id_golongan) : null;

    if (!name || name.length > 100 || !Number.isFinite(buy) || buy < 0 || !Number.isFinite(sell) || sell < buy || !Number.isInteger(minimum) || minimum < 0) {
      return NextResponse.json({ error: "Data obat tidak valid." }, { status: 400 });
    }

    const created = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE "obat" IN EXCLUSIVE MODE`;
      const duplicate = await tx.obat.findFirst({ where: { nama_obat: { equals: name, mode: "insensitive" } }, select: { id_obat: true } });
      if (duplicate) throw new Error("DUPLICATE");
      const max = await tx.obat.aggregate({ _max: { id_obat: true } });
      const nextId = (max._max.id_obat ?? 0) + 1;
      return tx.obat.create({
        data: {
          id_obat: nextId,
          nama_obat: name,
          golongan_obat_id_golongan: group,
          harga_beli: buy.toFixed(2),
          harga_jual: sell.toFixed(2),
          stok_minimum: minimum,
          satuan: unit,
          status: "Aktif",
          apoteker_id_pengguna: session.role === "apoteker" ? session.userId : null,
        },
      });
    });

    return NextResponse.json({ status: "success", data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE") {
      return NextResponse.json({ error: "Nama obat sudah terdaftar." }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menyimpan data obat." }, { status: 500 });
  }
}
