import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

function getExpectedToken(): string | undefined {
  return process.env.CACHE_REVALIDATE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function getProvidedToken(request: Request): string | null {
  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return bearer.slice("Bearer ".length).trim();
  }
  return request.headers.get("x-revalidate-token");
}

export async function POST(request: Request) {
  const expected = getExpectedToken();
  const provided = getProvidedToken(request);

  if (!expected) {
    return NextResponse.json(
      { error: "Missing CACHE_REVALIDATE_SECRET or SUPABASE_SERVICE_ROLE_KEY on server." },
      { status: 500 }
    );
  }

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("film-stocks", "max");

  return NextResponse.json({ ok: true, revalidated: ["film-stocks"] });
}
