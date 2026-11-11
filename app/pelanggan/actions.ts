"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { currentStock } from "@/lib/apoteker-data";
import { saveRecipeAttachment } from "@/lib/recipe-storage";

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

  const requiresPrescription = /amoxicillin|amoxycillin/i.test(medicine.nama_obat);
  if (!requiresPrescription) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`LOCK TABLE "transaksi", "detail_transaksi", "stok_obat", "permintaan_obat", "detail_permintaan_obat", "pelanggan" IN EXCLUSIVE MODE`;

        const [lastTransaction, lastDetail, lastStock, lastRequest, lastRequestDetail] = await Promise.all([
          tx.transaksi.aggregate({ _max: { id_transaksi: true } }),
          tx.detail_transaksi.aggregate({ _max: { id_detail_transaksi: true } }),
          tx.stok_obat.aggregate({ _max: { id_stok: true } }),
          tx.permintaan_obat.aggregate({ _max: { id_permintaan: true } }),
          tx.detail_permintaan_obat.aggregate({ _max: { id_detail_permintaan_obat: true } }),
        ]);

        const transactionId = (lastTransaction._max.id_transaksi ?? 0) + 1;
        const detailId = (lastDetail._max.id_detail_transaksi ?? 0) + 1;
        const stockId = (lastStock._max.id_stok ?? 0) + 1;
        const requestId = (lastRequest._max.id_permintaan ?? 0) + 1;
        const requestDetailId = (lastRequestDetail._max.id_detail_permintaan_obat ?? 0) + 1;
        const subtotal = medicine.harga_jual.mul(jumlah);

        await tx.transaksi.create({
          data: {
            id_transaksi: transactionId,
            tanggal: new Date(),
            nama_pelanggan: account.nama_pengguna,
            catatan_obat: `${medicine.nama_obat} x${jumlah}`,
            total: subtotal,
            metode_pembayaran: String(metode),
            status: "Selesai",
          },
        });

        await tx.detail_transaksi.create({
          data: {
            id_detail_transaksi: detailId,
            transaksi_id_transaksi: transactionId,
            jumlah: jumlah,
            harga_satuan: medicine.harga_jual,
            subtotal: subtotal,
          },
        });

        await tx.stok_obat.create({
          data: {
            id_stok: stockId,
            obat_id_obat: medicine.id_obat,
            jumlah_stok: stock - jumlah,
            tanggal_update: new Date(),
            keterangan: `Penjualan langsung pelanggan #${transactionId} (${medicine.nama_obat})`,
          },
        });

        await tx.pelanggan.update({
          where: { id_pengguna: session.userId },
          data: { transaksi_id_transaksi: transactionId },
        });

        await tx.permintaan_obat.create({
          data: {
            id_permintaan: requestId,
            pelanggan_id_pengguna: session.userId,
            tanggal_permintaan: new Date(),
            status_permintaan: "Selesai",
            harga_obat: subtotal,
            keterangan: `Pembayaran: ${metode} · Transaksi #${transactionId} (Langsung tanpa resep)`,
          },
        });

        await tx.detail_permintaan_obat.create({
          data: {
            id_detail_permintaan_obat: requestDetailId,
            permintaan_obat_id_permintaan: requestId,
            id_obat: medicine.id_obat,
            jumlah: String(jumlah),
            catatan: typeof catatan === "string" ? catatan.slice(0, 225) : null,
          },
        });
      });
    } catch (error) {
      console.error("Gagal memproses pembelian langsung pelanggan.", error);
      redirect(`/pelanggan?obat=${idObat}&error=Transaksi%20belum%20dapat%20diproses`);
    }

    revalidatePath("/pelanggan");
    revalidatePath("/apoteker/obat");
    revalidatePath("/apoteker/stok");
    revalidatePath("/apoteker/transaksi");
    revalidatePath("/apoteker/laporan");
    redirect(`/pelanggan?tab=Riwayat%20Transaksi&purchase=success`);
  }

  const jakartaDateParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const datePart = (type: "year" | "month" | "day") => jakartaDateParts.find((part) => part.type === type)?.value;
  const todayJakarta = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
  const requestDate = new Date(`${todayJakarta}T00:00:00.000Z`);
  const uploaded = formData.get("resep");
  const doctor = String(formData.get("nama_dokter") ?? "").trim();
  const prescriptionDate = String(formData.get("tanggal_resep") ?? "");
  const parsedPrescriptionDate = /^\d{4}-\d{2}-\d{2}$/.test(prescriptionDate) ? new Date(`${prescriptionDate}T00:00:00.000Z`) : null;
  const hasValidPrescriptionDate = parsedPrescriptionDate !== null && !Number.isNaN(parsedPrescriptionDate.getTime()) && parsedPrescriptionDate.toISOString().slice(0, 10) === prescriptionDate;

  if (!(uploaded instanceof File) || uploaded.size === 0 || uploaded.size > maxUploadBytes || !allowedTypes.has(uploaded.type)) {
    redirect(`/pelanggan?obat=${idObat}&error=Unggah%20resep%20JPG%2C%20PNG%2C%20atau%20PDF%20maksimal%205%20MB`);
  }
  if (!doctor || !hasValidPrescriptionDate || prescriptionDate > todayJakarta) {
    redirect(`/pelanggan?obat=${idObat}&error=Isi%20nama%20dokter%20dan%20tanggal%20resep%20dengan%20benar`);
  }
  const extension = allowedTypes.get(uploaded.type)!;
  const storedRecipe = `${randomUUID()}${extension}`;
  const buffer = Buffer.from(await uploaded.arrayBuffer());
  await saveRecipeAttachment(storedRecipe, buffer);
  const dataUrl = `data:${uploaded.type};base64,${buffer.toString("base64")}`;

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
      const recipeId = (lastRecipe._max.id_resep ?? 0) + 1;
      await tx.permintaan_obat.create({ data: {
        id_permintaan: requestId,
        pelanggan_id_pengguna: session.userId,
        tanggal_permintaan: requestDate,
        status_permintaan: "Menunggu",
        harga_obat: medicine.harga_jual.mul(jumlah),
        keterangan: [`Pembayaran: ${metode}`, `Resep ID: ${recipeId}; private/resep/${storedRecipe}`, typeof catatan === "string" ? catatan.slice(0, 90) : ""].filter(Boolean).join(" · ").slice(0, 225),
      } });
      await tx.detail_permintaan_obat.create({ data: {
        id_detail_permintaan_obat: (lastDetail._max.id_detail_permintaan_obat ?? 0) + 1,
        permintaan_obat_id_permintaan: requestId,
        id_obat: medicine.id_obat,
        jumlah: String(jumlah),
        catatan: typeof catatan === "string" ? catatan.slice(0, 225) : null,
      } });
      await tx.resep_obat.create({ data: {
        id_resep: recipeId,
        pelanggan_id_pengguna: session.userId,
        permintaan_obat_id_permintaan: requestId,
        tanggal_resep: parsedPrescriptionDate,
        nama_pasien: account.nama_pengguna,
        nama_dokter: doctor,
        daftar_obat: `${medicine.nama_obat} x${jumlah}`,
        status_validasi: "Menunggu",
        catatan: `Lampiran: private/resep/${storedRecipe}`,
        file_resep: dataUrl,
      } });
      await tx.detail_resep_obat.create({ data: {
        id_detail_resep: (lastRecipeDetail._max.id_detail_resep ?? 0) + 1,
        id_obat: medicine.id_obat,
        id_resep: recipeId,
        jumlah: String(jumlah),
      } });
    });
  } catch (error) {
    console.error("Gagal menyimpan permintaan obat pelanggan.", error);
    redirect(`/pelanggan?obat=${idObat}&error=Permintaan%20belum%20dapat%20disimpan`);
  }
  revalidatePath("/pelanggan");
  revalidatePath("/apoteker/permintaan");
  revalidatePath("/apoteker/resep");
  redirect(`/pelanggan?tab=Resep%20Saya&success=prescription`);
}

export async function continueApprovedRequest(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "pelanggan") redirect("/login");
  const idRequest = Number(formData.get("id_permintaan"));
  if (!Number.isSafeInteger(idRequest) || idRequest < 1) redirect("/pelanggan?tab=Resep%20Saya&error=Permintaan%20tidak%20valid");

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
      const prescriptionDetails = request.detail_permintaan_obat.filter((detail) => /amoxicillin|amoxycillin/i.test(detail.obat.nama_obat));
      if (!recipe && prescriptionDetails.length && request.pelanggan_id_pengguna) {
        const legacyRecipeId = request.keterangan?.match(/Resep ID:\s*(\d+)/i)?.[1];
        const legacyFilename = request.keterangan?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|pdf))/i)?.[1];
        const legacyRecipe = legacyRecipeId
          ? await tx.resep_obat.findUnique({ where: { id_resep: Number(legacyRecipeId) }, include: { detail_resep_obat: { select: { id_obat: true } } } })
          : legacyFilename
            ? await tx.resep_obat.findFirst({ where: { pelanggan_id_pengguna: request.pelanggan_id_pengguna, catatan: { contains: legacyFilename } }, include: { detail_resep_obat: { select: { id_obat: true } } } })
            : null;
        if (legacyRecipe?.pelanggan_id_pengguna === request.pelanggan_id_pengguna
          && prescriptionDetails.every((detail) => legacyRecipe.detail_resep_obat.some((line) => line.id_obat === detail.id_obat))) recipe = legacyRecipe;
      }
      for (const detail of request.detail_permintaan_obat) {
        const quantity = Number(detail.jumlah ?? "0");
        if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error(`Jumlah ${detail.obat.nama_obat} tidak valid.`);
        if (detail.obat.status !== "Aktif") throw new Error(`${detail.obat.nama_obat} sudah tidak tersedia.`);
        if (currentStock(detail.obat.stok_obat) < quantity) throw new Error(`Stok ${detail.obat.nama_obat} tidak mencukupi.`);
        if (/amoxicillin|amoxycillin/i.test(detail.obat.nama_obat)) {
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
    redirect(`/pelanggan?tab=Resep%20Saya&error=${encodeURIComponent(error instanceof Error ? error.message : "Transaksi belum dapat dibuat")}`);
  }
  redirect(`/pelanggan?tab=Resep%20Saya&purchase=success`);
}
