import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

/**
 * Returns a list of image paths under public/films so the admin can pick
 * an existing image instead of typing a path. Images must already exist in public/films.
 */
export async function GET() {
  try {
    const dir = path.join(process.cwd(), "public", "films");
    if (!fs.existsSync(dir)) {
      return NextResponse.json([]);
    }
    const names = fs.readdirSync(dir);
    const images = names
      .filter((n) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(n))
      .map((n) => `/films/${n}`)
      .sort();
    return NextResponse.json(images);
  } catch {
    return NextResponse.json([]);
  }
}
