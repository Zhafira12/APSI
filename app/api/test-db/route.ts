import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role === "pelanggan") {
    return NextResponse.json(
      { status: "error", message: "Akses ditolak. Endpoint ini memerlukan autentikasi staf apotek." },
      { status: 401 }
    );
  }

  try {
    await prisma.$connect();

    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    return NextResponse.json({
      status: "success",
      message: "Koneksi database Apotek Sri Utama berhasil!",
      role: session.role,
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
