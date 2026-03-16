import { NextResponse } from "next/server";
import { getFilmStockBySlug } from "@/lib/supabase/queries";
import { getFilmStockStats } from "@/lib/supabase/stats";

const STALE_SECONDS = 5 * 60; // 5 minutes for stale-while-revalidate

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  try {
    const [stock, stats] = await Promise.all([
      getFilmStockBySlug(slug),
      getFilmStockStats(slug),
    ]);
    if (!stock) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(
      { stock, stats },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${STALE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
        },
      }
    );
  } catch (e) {
    console.error("[api/films/[slug]]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
