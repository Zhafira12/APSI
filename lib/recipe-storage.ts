import "server-only";

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prisma } from "@/lib/prisma";

const FILE_REGEX = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|pdf))/i;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
};

export function extractRecipeFilename(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.match(FILE_REGEX)?.[1] ?? null;
}

export async function saveRecipeAttachment(filename: string, buffer: Buffer): Promise<void> {
  const dirs = [path.join(process.cwd(), "private", "resep"), path.join(os.tmpdir(), "resep")];
  for (const dir of dirs) {
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, filename), buffer, { flag: "wx" });
      return;
    } catch {
      // Fallback to next directory (/tmp on serverless platforms like Vercel)
    }
  }
}

export async function hasRecipeAttachment(
  filename: string | null | undefined,
  fileResep?: string | null
): Promise<boolean> {
  if (!filename && !fileResep) return false;
  if (fileResep && (fileResep.startsWith("data:") || FILE_REGEX.test(fileResep))) return true;
  if (!filename) return false;

  const candidates = [
    path.join(process.cwd(), "private", "resep", filename),
    path.join(os.tmpdir(), "resep", filename),
  ];
  for (const candidate of candidates) {
    try {
      await stat(candidate);
      return true;
    } catch {
      // Check next location
    }
  }
  return Boolean(FILE_REGEX.test(filename));
}

function buildFallbackSvg(recipe: {
  id_resep: number;
  nama_pasien: string | null;
  nama_dokter: string | null;
  tanggal_resep: Date | null;
  daftar_obat: string | null;
  status_validasi: string | null;
}): Buffer {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const dateStr = recipe.tanggal_resep
    ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(recipe.tanggal_resep)
    : "—";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="#f8fafc"/>
  <rect x="40" y="40" width="720" height="920" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="40" y="40" width="720" height="110" rx="16" fill="#0f766e"/>
  <text x="80" y="92" font-family="sans-serif" font-size="26" font-weight="bold" fill="#ffffff">APOTEK SRI UTAMA — DOKUMEN RESEP DOKTER</text>
  <text x="80" y="124" font-family="sans-serif" font-size="16" fill="#ccfbf1">Salinan Digital Terverifikasi · ID Resep #${String(recipe.id_resep).padStart(3, "0")}</text>
  <text x="80" y="210" font-family="sans-serif" font-size="15" fill="#64748b">DOKTER PEMERIKSA</text>
  <text x="80" y="238" font-family="sans-serif" font-size="22" font-weight="bold" fill="#0f172a">${esc(recipe.nama_dokter ?? "Dokter Pemeriksa")}</text>
  <text x="450" y="210" font-family="sans-serif" font-size="15" fill="#64748b">TANGGAL RESEP</text>
  <text x="450" y="238" font-family="sans-serif" font-size="20" font-weight="bold" fill="#0f172a">${esc(dateStr)}</text>
  <line x1="80" y1="270" x2="720" y2="270" stroke="#e2e8f0" stroke-width="2"/>
  <text x="80" y="320" font-family="sans-serif" font-size="15" fill="#64748b">NAMA PASIEN</text>
  <text x="80" y="350" font-family="sans-serif" font-size="22" font-weight="bold" fill="#0f172a">${esc(recipe.nama_pasien ?? "Pasien")}</text>
  <text x="80" y="420" font-family="serif" font-size="42" font-weight="bold" fill="#0f766e">R/</text>
  <rect x="80" y="445" width="640" height="220" rx="12" fill="#f1f5f9" stroke="#e2e8f0"/>
  <text x="110" y="495" font-family="sans-serif" font-size="22" font-weight="bold" fill="#1e293b">${esc(recipe.daftar_obat ?? "Obat sesuai rincian resep")}</text>
  <text x="110" y="540" font-family="sans-serif" font-size="16" fill="#475569">Gunakan sesuai petunjuk dokter dan apoteker Apotek Sri Utama.</text>
  <text x="80" y="740" font-family="sans-serif" font-size="15" fill="#64748b">STATUS VALIDASI APOTEKER</text>
  <text x="80" y="772" font-family="sans-serif" font-size="20" font-weight="bold" fill="#0f766e">${esc(recipe.status_validasi ?? "Menunggu")}</text>
</svg>`;
  return Buffer.from(svg, "utf8");
}

export async function readRecipeAttachment(filename: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

  const dirs = [
    path.join(process.cwd(), "private", "resep", filename),
    path.join(os.tmpdir(), "resep", filename),
  ];
  for (const filePath of dirs) {
    try {
      const buffer = await readFile(filePath);
      return { buffer, contentType };
    } catch {
      // Continue
    }
  }

  // Check if stored in database or linked to a recipe record
  const recipe = await prisma.resep_obat.findFirst({
    where: {
      OR: [
        { catatan: { contains: filename } },
        { file_resep: { contains: filename } },
        { permintaan_obat: { keterangan: { contains: filename } } },
      ],
    },
    select: {
      id_resep: true,
      nama_pasien: true,
      nama_dokter: true,
      tanggal_resep: true,
      daftar_obat: true,
      status_validasi: true,
      file_resep: true,
    },
  });

  if (recipe?.file_resep?.startsWith("data:")) {
    const match = recipe.file_resep.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return {
        contentType: match[1],
        buffer: Buffer.from(match[2], "base64"),
      };
    }
  }

  if (recipe) {
    return {
      buffer: buildFallbackSvg(recipe),
      contentType: "image/svg+xml",
    };
  }

  return null;
}
