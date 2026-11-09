import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireApoteker } from "@/lib/apoteker-access";

const contentTypes: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", pdf: "application/pdf" };

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  await requireApoteker();
  const { filename } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|pdf)$/i.test(filename)) return new NextResponse("Not found", { status: 404 });
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  try {
    const file = await readFile(path.join(process.cwd(), "private", "resep", filename));
    return new NextResponse(file, { headers: { "Content-Type": contentTypes[ext], "Content-Disposition": "inline", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
