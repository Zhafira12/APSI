"use server";

import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentStock } from "@/lib/apoteker-data";

const maxUploadBytes = 5 * 1024 * 1024;
const allowedTypes = new Map([["image/jpeg", ".jpg"], ["image/png", ".png"], ["application/pdf", ".pdf"]]);

export async function submitMedicineRequest(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "pelanggan") redirect("/login");
  const idObat = Number(formData.get("id_obat"));
  const jumlah = Number(formData.get("jumlah"));
  const metode = formData.get("metode_pembayaran");
  const catatan = formData.get("catatan");
  if (!Number.isInteger(idObat) || !Number.isInteger(jumlah) || jumlah < 1 || !["QRIS", "Tunai"].includes(String(metode))) redirect("/pelanggan?error=Permintaan%20tidak%20valid");

  const [account, medicine] = await Promise.all([
    prisma.pelanggan.findUnique({ where: { id_pengguna: session.userId }, select: { nama_pengguna: true, status: true } }),
    prisma.obat.findUnique({ where: { id_obat: idObat }, include: { golongan_obat: true, stok_obat: { select: { id_stok: true, jumlah_stok: true, tanggal_update: true, keterangan: true } } } }),
  ]);
  if (account?.status !== "Aktif" || !medicine || medicine.status !== "Aktif") redirect("/login");
  const stock = currentStock(medicine.stok_obat);
  if (jumlah > stock) redirect(`/pelanggan?obat=${idObat}&error=Stok%20obat%20tidak%20mencukupi`);

  const requiresPrescription = /resep|antibiotik|keras/i.test(medicine.golongan_obat?.nama_golongan ?? "");
  const uploaded = formData.get("resep");
  const doctor = String(formData.get("nama_dokter") ?? "").trim();
  const prescriptionDate = String(formData.get("tanggal_resep") ?? "");
  const parsedPrescriptionDate = /^\d{4}-\d{2}-\d{2}$/.test(prescriptionDate) ? new Date(`${prescriptionDate}T00:00:00`) : null;
  const hasValidPrescriptionDate = parsedPrescriptionDate !== null && !Number.isNaN(parsedPrescriptionDate.getTime()) && parsedPrescriptionDate.toISOString().slice(0, 10) === prescriptionDate;
  let storedRecipe: string | undefined;
  if (requiresPrescription) {
    if (!(uploaded instanceof File) || uploaded.size === 0 || uploaded.size > maxUploadBytes || !allowedTypes.has(uploaded.type)) redirect(`/pelanggan?obat=${idObat}&error=Unggah%20resep%20JPG%2C%20PNG%2C%20atau%20PDF%20maksimal%205%20MB`);
    if (!doctor || doctor.length > 100 || !hasValidPrescriptionDate || parsedPrescriptionDate! > new Date()) redirect(`/pelanggan?obat=${idObat}&error=Isi%20nama%20dokter%20dan%20tanggal%20resep%20dengan%20benar`);
    const extension = allowedTypes.get(uploaded.type)!;
    storedRecipe = `${randomUUID()}${extension}`;
    const directory = path.join(process.cwd(), "private", "resep");
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, storedRecipe), Buffer.from(await uploaded.arrayBuffer()), { flag: "wx" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE "permintaan_obat", "detail_permintaan_obat", "resep_obat", "detail_resep_obat" IN EXCLUSIVE MODE`;
      const [lastRequest, lastDetail, lastRecipe, lastRecipeDetail] = await Promise.all([
        tx.permintaan_obat.aggregate({ _max: { id_permintaan: true } }),
        tx.detail_permintaan_obat.aggregate({ _max: { id_detail_permintaan_obat: true } }),
        tx.resep_obat.aggregate({ _max: { id_resep: true } }),
        tx.detail_resep_obat.aggregate({ _max: { id_detail_resep: true } }),
      ]);
      const requestId = (lastRequest._max.id_permintaan ?? 0) + 1;
      const recipeId = storedRecipe ? (lastRecipe._max.id_resep ?? 0) + 1 : null;
      await tx.permintaan_obat.create({ data: {
        id_permintaan: requestId,
        pelanggan_id_pengguna: session.userId,
        tanggal_permintaan: new Date(),
        status_permintaan: "Menunggu",
        harga_obat: medicine.harga_jual.mul(jumlah),
        keterangan: [`Pembayaran: ${metode}`, storedRecipe ? `Resep ID: ${recipeId}; private/resep/${storedRecipe}` : "", typeof catatan === "string" ? catatan.slice(0, 90) : ""].filter(Boolean).join(" · ").slice(0, 225),
      } });
      await tx.detail_permintaan_obat.create({ data: {
        id_detail_permintaan_obat: (lastDetail._max.id_detail_permintaan_obat ?? 0) + 1,
        permintaan_obat_id_permintaan: requestId,
        id_obat: medicine.id_obat,
        jumlah: String(jumlah),
        catatan: typeof catatan === "string" ? catatan.slice(0, 225) : null,
      } });
      if (storedRecipe && recipeId !== null) {
        await tx.resep_obat.create({ data: {
          id_resep: recipeId,
          pelanggan_id_pengguna: session.userId,
          permintaan_obat_id_permintaan: requestId,
          tanggal_resep: parsedPrescriptionDate!,
          nama_pasien: account.nama_pengguna,
          nama_dokter: doctor,
          daftar_obat: `${medicine.nama_obat} x${jumlah}`,
          status_validasi: "Menunggu",
          catatan: `Lampiran: private/resep/${storedRecipe}`,
        } });
        await tx.detail_resep_obat.create({ data: {
          id_detail_resep: (lastRecipeDetail._max.id_detail_resep ?? 0) + 1,
          id_obat: medicine.id_obat,
          id_resep: recipeId,
          jumlah: String(jumlah),
        } });
      }
    });
  } catch {
    if (storedRecipe) await rm(path.join(process.cwd(), "private", "resep", storedRecipe), { force: true });
    redirect(`/pelanggan?obat=${idObat}&error=Permintaan%20belum%20dapat%20disimpan`);
  }
  redirect(`/pelanggan?tab=Permintaan%20Obat&success=${storedRecipe ? "prescription" : "request"}`);
}

export async function continueApprovedRequest(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "pelanggan") redirect("/login");
  const idRequest = Number(formData.get("id_permintaan"));
  if (!Number.isSafeInteger(idRequest) || idRequest < 1) redirect("/pelanggan?tab=Permintaan%20Obat&error=Permintaan%20tidak%20valid");

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`LOCK TABLE "permintaan_obat", "detail_permintaan_obat", "resep_obat", "detail_resep_obat", "obat", "stok_obat", "transaksi", "detail_transaksi", "pelanggan" IN EXCLUSIVE MODE`;
      const request = await tx.permintaan_obat.findUnique({
        where: { id_permintaan: idRequest },
        include: {
          pelanggan: { select: { id_pengguna: true, nama_pengguna: true, status: true } },
          resep_obat: { include: { detail_resep_obat: { select: { id_obat: true } } } },
          detail_permintaan_obat: { include: { obat: { include: { golongan_obat: { select: { nama_golongan: true } }, stok_obat: { select: { id_stok: true, jumlah_stok: true, tanggal_update: true, keterangan: true } } } } } },
        },
      });
      if (!request || request.pelanggan_id_pengguna !== session.userId || request.pelanggan?.status !== "Aktif") throw new Error("Permintaan tidak ditemukan pada akun Anda.");
      if (["selesai", "ditolak"].includes(request.status_permintaan?.toLowerCase() ?? "")) throw new Error("Permintaan ini sudah selesai atau ditolak.");
      if (!request.detail_permintaan_obat.length) throw new Error("Detail obat pada permintaan tidak ditemukan.");

      let recipe = request.resep_obat;
      const prescriptionDetails = request.detail_permintaan_obat.filter((detail) => /resep|antibiotik|keras/i.test(detail.obat.golongan_obat?.nama_golongan ?? ""));
      if (!recipe && prescriptionDetails.length && request.pelanggan_id_pengguna) {
        const legacyRecipeId = request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1];
        const legacyFilename = request.keterangan?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|pdf))/i)?.[1];
        const candidates = await tx.resep_obat.findMany({
          where: {
            pelanggan_id_pengguna: request.pelanggan_id_pengguna,
            status_validasi: { in: ["Disetujui", "Valid"] },
            id_resep: legacyRecipeId ? Number(legacyRecipeId) : undefined,
            catatan: !legacyRecipeId && legacyFilename ? { contains: legacyFilename } : undefined,
            detail_resep_obat: { some: { id_obat: { in: prescriptionDetails.map((detail) => detail.id_obat) } } },
          },
          include: { detail_resep_obat: { select: { id_obat: true } } },
        });
        const exactCandidates = candidates.filter((candidate) => prescriptionDetails.every((detail) => candidate.detail_resep_obat.some((line) => line.id_obat === detail.id_obat)));
        if (exactCandidates.length === 1) recipe = exactCandidates[0];
      }
      for (const detail of request.detail_permintaan_obat) {
        const quantity = Number(detail.jumlah ?? "0");
        if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error(`Jumlah ${detail.obat.nama_obat} tidak valid.`);
        if (detail.obat.status !== "Aktif") throw new Error(`${detail.obat.nama_obat} sudah tidak tersedia.`);
        if (currentStock(detail.obat.stok_obat) < quantity) throw new Error(`Stok ${detail.obat.nama_obat} tidak mencukupi.`);
        if (/resep|antibiotik|keras/i.test(detail.obat.golongan_obat?.nama_golongan ?? "")) {
          if (!recipe || recipe.pelanggan_id_pengguna !== session.userId || !["Disetujui", "Valid"].includes(recipe.status_validasi ?? "") || !recipe.detail_resep_obat.some((line) => line.id_obat === detail.id_obat)) {
            throw new Error(`Resep untuk ${detail.obat.nama_obat} belum disetujui Apoteker.`);
          }
        }
      }

      const payment = request.keterangan?.match(/Pembayaran:\s*(QRIS|Tunai)/i)?.[1] ?? "Tunai";
      const lines = request.detail_permintaan_obat.map((detail) => {
        const quantity = Number(detail.jumlah);
        const subtotalCents = Math.round(Number(detail.obat.harga_jual) * quantity * 100);
        return { detail, quantity, subtotalCents, stock: currentStock(detail.obat.stok_obat) };
      });
      const note = lines.map(({ detail, quantity }) => `${detail.obat.nama_obat} x${quantity}`).join("; ");
      if (note.length > 225) throw new Error("Ringkasan obat melebihi batas data transaksi.");
      const [lastTransaction, lastDetail, lastStock] = await Promise.all([
        tx.transaksi.aggregate({ _max: { id_transaksi: true } }),
        tx.detail_transaksi.aggregate({ _max: { id_detail_transaksi: true } }),
        tx.stok_obat.aggregate({ _max: { id_stok: true } }),
      ]);
      const transactionId = (lastTransaction._max.id_transaksi ?? 0) + 1;
      let detailId = (lastDetail._max.id_detail_transaksi ?? 0) + 1;
      let stockId = (lastStock._max.id_stok ?? 0) + 1;
      const totalCents = lines.reduce((sum, line) => sum + line.subtotalCents, 0);
      await tx.transaksi.create({ data: {
        id_transaksi: transactionId,
        tanggal: new Date(),
        nama_pelanggan: request.pelanggan.nama_pengguna,
        catatan_obat: note,
        total: (totalCents / 100).toFixed(2),
        metode_pembayaran: payment,
        status: "Selesai",
      } });
      for (const line of lines) {
        await tx.detail_transaksi.create({ data: {
          id_detail_transaksi: detailId++,
          transaksi_id_transaksi: transactionId,
          jumlah: line.quantity,
          harga_satuan: line.detail.obat.harga_jual,
          subtotal: (line.subtotalCents / 100).toFixed(2),
        } });
        await tx.stok_obat.create({ data: {
          id_stok: stockId++,
          obat_id_obat: line.detail.id_obat,
          jumlah_stok: line.stock - line.quantity,
          tanggal_update: new Date(),
          keterangan: `Penjualan pelanggan #${transactionId}`,
        } });
      }
      await tx.pelanggan.update({ where: { id_pengguna: session.userId }, data: { transaksi_id_transaksi: transactionId } });
      await tx.permintaan_obat.update({ where: { id_permintaan: idRequest }, data: { status_permintaan: "Selesai" } });
    });
  } catch (error) {
    redirect(`/pelanggan?tab=Permintaan%20Obat&error=${encodeURIComponent(error instanceof Error ? error.message : "Transaksi belum dapat dibuat")}`);
  }
  redirect(`/pelanggan?tab=Permintaan%20Obat&purchase=success`);
}
