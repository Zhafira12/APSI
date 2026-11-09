
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$connect();

    const tables = await prisma.$queryRaw<
      { table_name: string }[]
    >`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    return NextResponse.json({
      status: "success",
      message: "Koneksi database Apotek Sri Utama berhasil!",
      jumlah_tabel: tables.length,
      tabel: tables.map((item) => item.table_name),
    });
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Koneksi database gagal.",
      },
      { status: 500 }
    );
  }
}
