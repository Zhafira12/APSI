import { NextResponse } from "next/server";
import { requireApoteker } from "@/lib/apoteker-access";
import { readRecipeAttachment } from "@/lib/recipe-storage";

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  await requireApoteker(["apoteker"]);
  const { filename } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|jpeg|png|pdf)$/i.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const found = await readRecipeAttachment(filename);
  if (!found) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(found.buffer), {
    headers: {
      "Content-Type": found.contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
