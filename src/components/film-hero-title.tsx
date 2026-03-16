"use client";

/** Metadata line: TYPE LABEL | ISO N | FORMAT1, FORMAT2 (uppercase) */
function formatMeta(typeLabel: string, iso: number | null, format: string[]) {
  const isoStr = iso != null ? `ISO ${iso}` : "ISO —";
  const formatStr = format.length ? format.map((f) => f.toUpperCase()).join(", ") : "—";
  return `${(typeLabel ?? "—").toUpperCase()} | ${isoStr} | ${formatStr}`;
}

interface FilmHeroTitleProps {
  name: string;
  typeLabel: string;
  iso: number | null;
  format: string[];
}

export function FilmHeroTitle({ name, typeLabel, iso, format }: FilmHeroTitleProps) {
  const meta = formatMeta(typeLabel, iso, format);

  return (
    <header
      className="w-full bg-white px-4 py-4 text-center md:hidden sm:px-6"
      data-film-hero-title
    >
      <h1 className="font-sans text-2xl font-bold tracking-tight">{name}</h1>
      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {meta}
      </p>
    </header>
  );
}
