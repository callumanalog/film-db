import { permanentRedirect } from "next/navigation";

interface FilmsLegacyRedirectProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FilmsLegacyRedirect({ searchParams }: FilmsLegacyRedirectProps) {
  const sp = await searchParams;
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        usp.append(key, item);
      }
    } else {
      usp.set(key, value);
    }
  }
  const q = usp.toString();
  permanentRedirect(q ? `/?${q}` : "/");
}
