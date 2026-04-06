/**
 * Fetches https://findmyfilmlab.com/browse/ and regenerates src/lib/film-lab-seed-data.ts
 *
 * Source: Find My Film Lab — photographer-sourced lab directory (https://findmyfilmlab.com/browse/).
 * Re-run when the upstream list changes; verify their terms before redistributing.
 *
 * Usage: npx tsx scripts/generate-film-lab-seed.ts
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const BROWSE_URL = "https://findmyfilmlab.com/browse/";

function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .trim();
}

export type GeneratedFilmLab = {
  id: string;
  slug: string;
  name: string;
  country: string;
};

async function main(): Promise<void> {
  const res = await fetch(BROWSE_URL, {
    headers: { "User-Agent": "film-db-seed-script/1.0 (lab catalog sync)" },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();

  const blocks = html.split('<div class="browseCountry">').slice(1);
  const bySlug = new Map<string, GeneratedFilmLab>();

  for (const block of blocks) {
    const h3 = block.match(/<h3>([^<]*)<\/h3>/);
    if (!h3) continue;
    const country = decodeHtmlEntities(h3[1]);

    const linkRe =
      /<a\s+href="https:\/\/findmyfilmlab\.com\/location\/([^"/]+)\/"[^>]*>([^<]*)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(block)) !== null) {
      const slug = m[1].trim();
      const name = decodeHtmlEntities(m[2]);
      if (!slug || !name) continue;
      if (!bySlug.has(slug)) {
        bySlug.set(slug, {
          id: slug,
          slug,
          name,
          country,
        });
      }
    }
  }

  const labs = [...bySlug.values()].sort((a, b) => {
    const c = a.country.localeCompare(b.country, undefined, { sensitivity: "base" });
    if (c !== 0) return c;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  const outPath = join(process.cwd(), "src/lib/film-lab-seed-data.ts");
  const header = `/**
 * Film lab directory for share-roll Lab picker (searchable catalog).
 *
 * Generated from Find My Film Lab browse listing: https://findmyfilmlab.com/browse/
 * Photographer-sourced guide; regenerate with: npx tsx scripts/generate-film-lab-seed.ts
 *
 * Last generated: ${new Date().toISOString()}
 * Row count: ${labs.length}
 */

export type FilmLabSeedRow = {
  id: string;
  slug: string;
  name: string;
  country: string;
};

`;

  const body = `export const seedFilmLabs: FilmLabSeedRow[] = ${JSON.stringify(labs, null, 2)};
`;

  writeFileSync(outPath, header + body, "utf8");
  console.log(`Wrote ${labs.length} labs to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
