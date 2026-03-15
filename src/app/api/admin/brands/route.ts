import { NextResponse } from "next/server";
import type { FilmBrand } from "@/lib/types";
import { getBrands } from "@/lib/supabase/queries";
import { writeBrandsToFile, removeBrandsFile } from "@/lib/editable-brands";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const brands = await getBrands();
  return NextResponse.json(brands);
}

export async function POST(request: Request) {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  try {
    const body = (await request.json()) as unknown;
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be an array of brands" }, { status: 400 });
    }
    const brands = body as FilmBrand[];
    writeBrandsToFile(brands);
    return NextResponse.json({ ok: true, count: brands.length });
  } catch (err) {
    console.error("[admin brands] write failed:", err);
    return NextResponse.json({ error: "Failed to save brands" }, { status: 500 });
  }
}

export async function DELETE() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  try {
    removeBrandsFile();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin brands] reset failed:", err);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
