import { NextResponse } from "next/server";
import { isUsingEditableFile } from "@/lib/editable-film-stocks";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const forbidden = await requireAdmin();
  if (forbidden) return forbidden;
  const source = isUsingEditableFile() ? "file" : "seed";
  return NextResponse.json({ source });
}
