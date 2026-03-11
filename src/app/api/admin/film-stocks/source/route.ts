import { NextResponse } from "next/server";
import { isUsingEditableFile } from "@/lib/editable-film-stocks";

export async function GET() {
  const source = isUsingEditableFile() ? "file" : "seed";
  return NextResponse.json({ source });
}
