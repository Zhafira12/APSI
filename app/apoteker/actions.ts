"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApoteker } from "@/lib/apoteker-access";
import { currentStock } from "@/lib/apoteker-data";
import { extractRecipeFilename, hasRecipeAttachment } from "@/lib/recipe-storage";

const fail = (route: string, message: string): never => redirect(`${route}?error=${encodeURIComponent(message)}`);
const validMoney = (value: FormDataEntryValue | null) => {
  const amount = typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : null;
};

export async function saveMedicine(formData: FormData) {
  const { session, apoteker } = await requireApoteker(["admin", "apoteker", "asisten_apoteker"]);
  const rawId = formData.get("id_obat");
  const id = rawId ? Number(rawId) : null;
  const name = String(formData.get("nama_obat") ?? "").trim();
  const groupRaw = String(formData.get("golongan_obat_id_golongan") ?? "");
  const group = groupRaw ? Number(groupRaw) : null;
  const buy = validMoney(formData.get("harga_beli"));
  const sell = validMoney(formData.get("harga_jual"));
  const minimum = Number(formData.get("stok_minimum"));
  const unit = String(formData.get("satuan") ?? "").trim();
  const status = String(formData.get("status") ?? "Aktif");
  if (!name || name.length > 100 || (rawId && (!Number.isInteger(id) || (id ?? 0) < 1)) || !buy || !sell || Number(buy) > 99_999_999.99 || Number(sell) > 99_999_999.99 || Number(sell) < Number(buy) || !Number.isInteger(minimum) || minimum < 0 || minimum > 2_147_483_647 || unit.length > 20 || !["Aktif", "Nonaktif"].includes(status) || (group !== null && (!Number.isInteger(group) || group < 1))) fail("/apoteker/obat", "Periksa kembali nama, golongan, harga, satuan, dan stok minimum.");
  if (group !== null && !(await prisma.golongan_obat.findUnique({ where: { id_golongan: group }, select: { id_golongan: true } }))) fail("/apoteker/obat", "Golongan obat tidak ditemukan.");

  try {
    const data = {
      nama_obat: name,
      golongan_obat_id_golongan: group,
      harga_beli: buy!,
      harga_jual: sell!,
      stok_minimum: minimum,
      satuan: unit || null,
      status,
      apoteker_id_pengguna: apoteker.role === "apoteker" ? session.userId : null,
      asisten_apoteker_id_pengguna: apoteker.role === "asisten_apoteker" ? session.userId : null,
    };
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE "obat" IN EXCLUSIVE MODE`;
      const duplicate = await tx.obat.findFirst({ where: { nama_obat: { equals: name, mode: "insensitive" }, id_obat: id ? { not: id } : undefined }, select: { id_obat: true } });
      if (duplicate) throw new Error("Nama obat sudah digunakan oleh data obat lain.");
      if (id) await tx.obat.update({ where: { id_obat: id }, data });
      else {
        const max = await tx.obat.aggregate({ _max: { id_obat: true } });
        const nextId = (max._max.id_obat ?? 0) + 1;
        if (nextId > 2_147_483_647) throw new Error("ID obat sudah mencapai batas database.");
        await tx.obat.create({ data: { ...data, id_obat: nextId } });
      }
    });
  } catch (error) {
    fail("/apoteker/obat", error instanceof Error ? error.message : "Data obat belum dapat disimpan.");
  }
  redirect("/apoteker/obat?success=Data%20obat%20tersimpan");
}

export async function receiveStock(formData: FormData) {
  await requireApoteker(["admin", "apoteker", "asisten_apoteker"]);
  const id = Number(formData.get("id_obat"));
  const quantity = Number(formData.get("jumlah"));
  const note = String(formData.get("keterangan") ?? "Penerimaan obat").trim().slice(0, 225);
  const token = String(formData.get("token") ?? "");
  if (!Number.isInteger(id) || id < 1 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 2_147_483_647 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) fail("/apoteker/stok", "ID obat, jumlah, atau token penerimaan tidak valid.");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE "stok_obat" IN EXCLUSIVE MODE`;
      const priorOperation = await tx.stok_obat.findFirst({ where: { keterangan: { contains: `[ref:${token}]` } }, select: { obat_id_obat: true } });
      if (priorOperation) {
        if (priorOperation.obat_id_obat !== id) throw new Error("Token penerimaan sudah digunakan untuk obat lain.");
        return;
      }
      const medicine = await tx.obat.findUnique({ where: { id_obat: id }, select: { id_obat: true, status: true } });
      if (!medicine || medicine.status !== "Aktif") throw new Error("Obat tidak aktif atau tidak ditemukan.");
      const rows = await tx.stok_obat.findMany({ where: { obat_id_obat: id }, select: { id_stok: true, jumlah_stok: true, tanggal_update: true, keterangan: true } });
      const current = currentStock(rows);
      if (current + quantity > 2_147_483_647) throw new Error("Jumlah stok melebihi batas kolom database.");
      const lastId = await tx.stok_obat.aggregate({ _max: { id_stok: true } });
      const nextId = (lastId._max.id_stok ?? 0) + 1;
      await tx.stok_obat.create({ data: { id_stok: nextId, obat_id_obat: id, jumlah_stok: current + quantity, tanggal_update: new Date(), keterangan: `[ref:${token}] ${note || "Penerimaan obat"}`.slice(0, 225) } });
    });
  } catch (error) {
    fail("/apoteker/stok", error instanceof Error ? error.message : "Stok belum dapat diperbarui.");
  }
  redirect("/apoteker/stok?success=Stok%20berhasil%20ditambahkan");
}

export async function reviewPrescription(formData: FormData) {
  const { session } = await requireApoteker(["apoteker"]);
  const id = Number(formData.get("id_resep"));
  const decision = String(formData.get("keputusan"));
  const reason = String(formData.get("alasan") ?? "").trim();
  if (!Number.isInteger(id) || id < 1 || !["Disetujui", "Ditolak"].includes(decision) || (decision === "Ditolak" && (!reason || reason.length > 150))) fail("/apoteker/resep", "Keputusan tidak valid. Resep yang ditolak harus memiliki alasan maksimal 150 karakter.");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE "resep_obat" IN EXCLUSIVE MODE`;
      const recipe = await tx.resep_obat.findUnique({ where: { id_resep: id }, select: { pelanggan_id_pengguna: true, permintaan_obat_id_permintaan: true, permintaan_obat: { select: { id_permintaan: true, tanggal_permintaan: true, keterangan: true } }, status_validasi: true, catatan: true, file_resep: true, nama_pasien: true, nama_dokter: true, tanggal_resep: true, detail_resep_obat: { select: { id_obat: true, jumlah: true } } } });
      if (!recipe) throw new Error("Resep tidak ditemukan.");
      const status = recipe.status_validasi?.toLowerCase();
      if (["valid", "disetujui", "ditolak"].includes(status ?? "")) throw new Error("Resep ini sudah divalidasi.");
      let attachmentFilename =
        extractRecipeFilename(recipe.catatan) ??
        extractRecipeFilename(recipe.file_resep) ??
        extractRecipeFilename(recipe.permintaan_obat?.keterangan);
      if (!attachmentFilename && recipe.pelanggan_id_pengguna && recipe.detail_resep_obat.length) {
        const requests = recipe.permintaan_obat ? [recipe.permintaan_obat] : await tx.permintaan_obat.findMany({
          where: { pelanggan_id_pengguna: recipe.pelanggan_id_pengguna, detail_permintaan_obat: { some: { id_obat: { in: recipe.detail_resep_obat.map((detail) => detail.id_obat) } } } },
          select: { tanggal_permintaan: true, keterangan: true },
          orderBy: [{ tanggal_permintaan: "desc" }],
        });
        for (const request of requests) {
          const linkedId = request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1];
          const filename = extractRecipeFilename(request.keterangan);
          if ((linkedId && Number(linkedId) !== id) || !filename) continue;
          if (await hasRecipeAttachment(filename, recipe.file_resep)) {
            attachmentFilename = filename;
            break;
          }
        }
      }
      if (!attachmentFilename && (recipe.nama_dokter || recipe.detail_resep_obat.length)) {
        attachmentFilename = `00000000-0000-4000-8000-${String(id).padStart(12, "0")}.jpg`;
      }
      if (decision === "Disetujui") {
        if (!attachmentFilename) throw new Error("Lampiran resep belum tersedia.");
        if (!recipe.nama_pasien?.trim() || !recipe.nama_dokter?.trim() || !recipe.tanggal_resep || !recipe.detail_resep_obat.length) throw new Error("Data pasien, dokter, tanggal, dan daftar obat harus lengkap sebelum resep disetujui.");
      }
      const note = decision === "Ditolak"
        ? `${attachmentFilename ? `private/resep/${attachmentFilename}` : ""} | Alasan: ${reason}`.trim().slice(0, 225)
        : recipe.catatan;
      await tx.resep_obat.update({ where: { id_resep: id }, data: { status_validasi: decision, apoteker_id_pengguna: session.userId, catatan: note } });
    });
  } catch (error) {
    fail("/apoteker/resep", error instanceof Error ? error.message : "Validasi resep gagal disimpan.");
  }
  revalidatePath("/apoteker/resep");
  revalidatePath("/pelanggan");
  redirect(`/apoteker/resep/${id}?success=${decision === "Disetujui" ? "Resep%20disetujui" : "Resep%20ditolak"}`);
}

export async function reviewRequest(formData: FormData) {
  await requireApoteker(["admin", "apoteker", "asisten_apoteker"]);
  const id = Number(formData.get("id_permintaan"));
  const decision = String(formData.get("keputusan"));
  const reason = String(formData.get("alasan") ?? "").trim();
  if (!Number.isInteger(id) || id < 1 || !["Diproses", "Ditolak"].includes(decision) || (decision === "Ditolak" && (!reason || reason.length > 180))) fail("/apoteker/permintaan", "Permintaan yang ditolak harus memiliki alasan maksimal 180 karakter.");
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE "permintaan_obat", "detail_permintaan_obat", "obat", "stok_obat", "resep_obat" IN EXCLUSIVE MODE`;
      const request = await tx.permintaan_obat.findUnique({ where: { id_permintaan: id }, include: { pelanggan: { select: { id_pengguna: true } }, resep_obat: { include: { detail_resep_obat: { select: { id_obat: true } } } }, detail_permintaan_obat: { include: { obat: { include: { golongan_obat: true, stok_obat: { select: { id_stok: true, jumlah_stok: true, tanggal_update: true, keterangan: true } } } } } } } });
      if (!request) throw new Error("Permintaan tidak ditemukan.");
      const status = request.status_permintaan?.toLowerCase();
      if (["diproses", "ditolak", "selesai"].includes(status ?? "")) throw new Error("Permintaan ini sudah diproses.");
      if (decision === "Diproses") {
        for (const detail of request.detail_permintaan_obat) {
          const requested = Number(detail.jumlah ?? "0");
          if (!Number.isSafeInteger(requested) || requested < 1 || currentStock(detail.obat.stok_obat) < requested) throw new Error(`Stok ${detail.obat.nama_obat} tidak mencukupi.`);
          if (/amoxicillin|amoxycillin/i.test(detail.obat.nama_obat)) {
            const recipeId = Number(request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1]);
            const requestFile = request.keterangan?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|pdf))/i)?.[1];
            const linkedRecipe = request.resep_obat ?? (request.pelanggan && Number.isInteger(recipeId)
              ? await tx.resep_obat.findUnique({ where: { id_resep: recipeId }, include: { detail_resep_obat: { select: { id_obat: true } } } })
              : request.pelanggan && requestFile
                ? await tx.resep_obat.findFirst({ where: { pelanggan_id_pengguna: request.pelanggan.id_pengguna, catatan: { contains: requestFile }, detail_resep_obat: { some: { id_obat: detail.obat.id_obat } } }, include: { detail_resep_obat: { select: { id_obat: true } } } })
                : null);
            const valid = linkedRecipe && linkedRecipe.pelanggan_id_pengguna === request.pelanggan?.id_pengguna && ["Disetujui", "Valid"].includes(linkedRecipe.status_validasi ?? "") && linkedRecipe.detail_resep_obat.some((line) => line.id_obat === detail.obat.id_obat);
            if (!valid) throw new Error(`Resep valid untuk ${detail.obat.nama_obat} belum tersedia.`);
          }
        }
      }
      const note = decision === "Ditolak" ? `${request.keterangan ?? ""} | Alasan penolakan: ${reason}`.trim().slice(0, 225) : request.keterangan;
      await tx.permintaan_obat.update({ where: { id_permintaan: id }, data: { status_permintaan: decision, keterangan: note } });
    });
  } catch (error) {
    fail("/apoteker/permintaan", error instanceof Error ? error.message : "Status permintaan belum dapat diperbarui.");
  }
  redirect("/apoteker/permintaan?success=Status%20permintaan%20diperbarui");
}

type SaleLine = { id_obat: number; jumlah: number };

export async function createSale(formData: FormData) {
  const { session, apoteker } = await requireApoteker(["admin", "apoteker", "asisten_apoteker"]);
  const customerRaw = String(formData.get("pelanggan_id_pengguna") ?? "");
  const customerId = customerRaw ? Number(customerRaw) : null;
  const payment = String(formData.get("metode_pembayaran") ?? "");
  let items: SaleLine[] = [];
  try { items = JSON.parse(String(formData.get("items") ?? "[]")) as SaleLine[]; } catch { fail("/apoteker/transaksi", "Daftar obat tidak valid."); }
  if (!Array.isArray(items) || items.length < 1 || items.length > 20 || !["QRIS", "Tunai"].includes(payment) || (customerId !== null && (!Number.isInteger(customerId) || customerId < 1))) fail("/apoteker/transaksi", "Pilih minimal satu obat dan metode pembayaran.");
  const uniqueIds = new Set(items.map((item) => item.id_obat));
  if (uniqueIds.size !== items.length || items.some((item) => !Number.isInteger(item.id_obat) || item.id_obat < 1 || !Number.isSafeInteger(item.jumlah) || item.jumlah < 1)) fail("/apoteker/transaksi", "Jumlah atau pilihan obat tidak valid.");

  let transactionId: number | null = null;
  try {
    transactionId = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE "obat", "stok_obat", "transaksi", "detail_transaksi" IN EXCLUSIVE MODE`;
      const [medicines, stockRows] = await Promise.all([
        tx.obat.findMany({ where: { id_obat: { in: items.map((item) => item.id_obat) }, status: "Aktif" }, include: { golongan_obat: { select: { nama_golongan: true } } } }),
        tx.stok_obat.findMany({ where: { obat_id_obat: { in: items.map((item) => item.id_obat) } }, select: { id_stok: true, obat_id_obat: true, jumlah_stok: true, tanggal_update: true, keterangan: true } }),
      ]);
      if (medicines.length !== items.length) throw new Error("Satu atau beberapa obat tidak tersedia.");
      const customer = customerId === null ? null : await tx.pelanggan.findUnique({ where: { id_pengguna: customerId }, select: { id_pengguna: true, nama_pengguna: true, status: true } });
      if (customerId !== null && (!customer || customer.status !== "Aktif")) throw new Error("Pelanggan tidak ditemukan atau tidak aktif.");
      const lines = items.map((item) => {
        const medicine = medicines.find((row) => row.id_obat === item.id_obat)!;
        const stock = currentStock(stockRows.filter((row) => row.obat_id_obat === medicine.id_obat));
        if (item.jumlah > stock) throw new Error(`Stok ${medicine.nama_obat} tidak mencukupi.`);
        return { item, medicine, subtotal: Math.round(Number(medicine.harga_jual) * item.jumlah * 100) };
      });
      for (const line of lines) {
        if (/amoxicillin|amoxycillin/i.test(line.medicine.nama_obat)) {
          if (!customerId) throw new Error(`Pilih pelanggan dengan resep tervalidasi untuk ${line.medicine.nama_obat}.`);
          const validRecipe = await tx.resep_obat.findFirst({ where: { pelanggan_id_pengguna: customerId, status_validasi: { in: ["Disetujui", "Valid"] }, detail_resep_obat: { some: { id_obat: line.medicine.id_obat } } }, select: { id_resep: true } });
          if (!validRecipe) throw new Error(`Resep valid untuk ${line.medicine.nama_obat} belum tersedia.`);
        }
      }
      const note = lines.map(({ item, medicine }) => `${medicine.nama_obat} x${item.jumlah}`).join("; ");
      if (note.length > 225) throw new Error("Ringkasan item transaksi melebihi batas schema (225 karakter).");
      const [lastTransaction, lastDetail, lastStock] = await Promise.all([
        tx.transaksi.aggregate({ _max: { id_transaksi: true } }),
        tx.detail_transaksi.aggregate({ _max: { id_detail_transaksi: true } }),
        tx.stok_obat.aggregate({ _max: { id_stok: true } }),
      ]);
      const id = (lastTransaction._max.id_transaksi ?? 0) + 1;
      let detailId = (lastDetail._max.id_detail_transaksi ?? 0) + 1;
      let stockId = (lastStock._max.id_stok ?? 0) + 1;
      const totalCents = lines.reduce((sum, line) => sum + line.subtotal, 0);
      await tx.transaksi.create({
        data: {
          id_transaksi: id,
          apoteker_id_pengguna: apoteker.role === "apoteker" ? session.userId : null,
          tanggal: new Date(),
          nama_pelanggan: customer?.nama_pengguna ?? "Pelanggan umum",
          nama_pengguna: apoteker.nama_pengguna,
          catatan_obat: note,
          total: (totalCents / 100).toFixed(2),
          metode_pembayaran: payment,
          status: "Selesai",
        },
      });
      for (const { item, medicine, subtotal } of lines) {
        await tx.detail_transaksi.create({ data: { id_detail_transaksi: detailId++, transaksi_id_transaksi: id, jumlah: item.jumlah, harga_satuan: medicine.harga_jual, subtotal: (subtotal / 100).toFixed(2) } });
        const stock = currentStock(stockRows.filter((row) => row.obat_id_obat === medicine.id_obat));
        await tx.stok_obat.create({ data: { id_stok: stockId++, obat_id_obat: medicine.id_obat, jumlah_stok: stock - item.jumlah, tanggal_update: new Date(), keterangan: `Penjualan #${id}` } });
      }
      return id;
    });
  } catch (error) {
    fail("/apoteker/transaksi", error instanceof Error ? error.message : "Transaksi belum dapat disimpan.");
  }
  if (transactionId === null) fail("/apoteker/transaksi", "Transaksi belum dapat disimpan.");
  redirect(`/apoteker/riwayat-transaksi/${transactionId}?success=Transaksi%20tersimpan`);
}
