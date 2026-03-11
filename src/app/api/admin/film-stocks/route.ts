import { NextResponse } from "next/server";
import type { FilmStock } from "@/lib/types";
import { writeFilmStocksToFile, removeFilmStocksFile } from "@/lib/editable-film-stocks";
import { getFilmStocks } from "@/lib/supabase/queries";

/** Strip client-only fields so we store only FilmStock shape. */
function toStorable(stock: FilmStock & { brand?: unknown }): FilmStock {
  const { brand: _, ...rest } = stock;
  return rest as FilmStock;
}

/** GET: return all film stocks (with brand) for the admin UI. */
export async function GET() {
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  return NextResponse.json(stocks);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Body must be an array of film stocks" }, { status: 400 });
    }
    const stocks = body.map((s) => toStorable(s as FilmStock & { brand?: unknown }));
    writeFilmStocksToFile(stocks);
    return NextResponse.json({ ok: true, count: stocks.length });
  } catch (err) {
    console.error("[admin film-stocks] write failed:", err);
    return NextResponse.json({ error: "Failed to save film stocks" }, { status: 500 });
  }
}

/** DELETE: remove data/film-stocks.json so the app uses seed again. */
export async function DELETE() {
  try {
    removeFilmStocksFile();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin film-stocks] reset failed:", err);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
