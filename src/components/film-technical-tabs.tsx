"use client";

import { Fragment, useMemo } from "react";
import type { BestFor, FilmType, ShootingNote } from "@/lib/types";
import { BEST_FOR_LABELS } from "@/lib/types";
import { isBlackAndWhiteFilm } from "@/lib/types";
import { cn } from "@/lib/utils";

function specsListLabel(specLabel: string): string {
  if (specLabel === "Development Process" || specLabel === "Film Development Process") return "dev";
  return specLabel;
}

function titleCaseUseCaseSegment(s: string): string {
  return s
    .replace(/_/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function BestForPill({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-md border border-border/60 bg-white px-2.5 py-1 text-[13px] font-normal leading-none text-foreground dark:border-border dark:bg-background">
      {children}
    </span>
  );
}

/** Resolved labels for overview use-case pills (under description, not in Details grid). */
export function buildBestForPillTags(
  bestFor: BestFor[],
  useCaseSpec?: { label: string; value: string }
): string[] {
  if (bestFor.length > 0) {
    return bestFor.map((tag) => (BEST_FOR_LABELS[tag as BestFor] ?? String(tag)).replace(/_/g, " "));
  }
  if (useCaseSpec?.value && useCaseSpec.value !== "—") {
    return useCaseSpec.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map(titleCaseUseCaseSegment);
  }
  return [];
}

export function FilmBestForPills({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Best for">
      {tags.map((tag, i) => (
        <li key={`${tag}-${i}`}>
          <BestForPill>{tag}</BestForPill>
        </li>
      ))}
    </ul>
  );
}

function SpecsValue({ value }: { value: string }) {
  if (!value || value === "—") {
    return <span className="text-[13px] leading-normal text-muted-foreground">—</span>;
  }
  return <span className="text-[13px] leading-normal text-foreground">{value}</span>;
}

type OverviewDetailRow = { type: "spec"; label: string; value: string };

type CharacteristicKey = "grain" | "contrast" | "saturation" | "latitude";

const SLIDER_CONFIG: { key: CharacteristicKey; label: string; low: string; high: string }[] = [
  { key: "grain", label: "Grain", low: "Fine", high: "Coarse" },
  { key: "contrast", label: "Contrast", low: "Soft", high: "Punchy" },
  { key: "saturation", label: "Saturation", low: "Muted", high: "Vivid" },
  { key: "latitude", label: "Latitude", low: "Narrow", high: "Wide" },
];

const SEGMENT_COUNT = 5;

/** Fixed label column: matches rendered width of "SATURATION" at 10px uppercase tracking-[0.07em]. */
const CHARACTERISTIC_LABEL_WIDTH_CLASS = "w-[80px] shrink-0";

const characteristicLabelTextClass =
  "block whitespace-nowrap text-left text-[13px] font-medium leading-none text-muted-foreground";

/** Scale row: fixed-width end labels + five segments in a single flex row. */
function CharacteristicScaleRow({
  value,
  lowLabel,
  highLabel,
  nameForA11y,
}: {
  value: number;
  lowLabel: string;
  highLabel: string;
  nameForA11y: string;
}) {
  const clamped = Math.min(SEGMENT_COUNT, Math.max(1, Math.round(value)));
  return (
    <div
      className="flex w-full items-center gap-1.5"
      role="img"
      aria-label={`${nameForA11y}: ${clamped} out of ${SEGMENT_COUNT}`}
    >
      <span className="w-[52px] shrink-0 text-left text-[11px] uppercase leading-none text-muted-foreground">
        {lowLabel}
      </span>
      {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-2 min-w-0 flex-1 rounded-[3px]",
            i < clamped ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-700"
          )}
          aria-hidden
        />
      ))}
      <span className="w-[52px] shrink-0 text-right text-[11px] uppercase leading-none text-muted-foreground">
        {highLabel}
      </span>
    </div>
  );
}

function buildDetailRows(specs: { label: string; value: string }[]): OverviewDetailRow[] {
  const topSpecsRows: { label: string; value: string }[][] = [
    [
      specs.find((s) => s.label === "Film Type") ?? { label: "Film Type", value: "—" },
      specs.find((s) => s.label === "ISO") ?? { label: "ISO", value: "—" },
    ],
    [
      specs.find((s) => s.label === "Format") ?? { label: "Format", value: "—" },
      specs.find((s) => s.label === "Development Process" || s.label === "Film Development Process") ?? {
        label: "Development Process",
        value: "—",
      },
    ],
  ];

  const hasSpecs = specs.length > 0;
  const rows: OverviewDetailRow[] = [];
  if (hasSpecs) {
    const [topLeft, topRight] = topSpecsRows[0];
    const [botLeft, botRight] = topSpecsRows[1];
    rows.push({ type: "spec", label: topLeft.label, value: topLeft.value });
    rows.push({ type: "spec", label: topRight.label, value: topRight.value });
    rows.push({ type: "spec", label: botLeft.label, value: botLeft.value });
    rows.push({ type: "spec", label: botRight.label, value: botRight.value });
  }
  return rows;
}

export type FilmSpecsTabContentProps = {
  specs?: { label: string; value: string }[];
  /** When true, omit the four core rows (film type, ISO, format, dev) — e.g. shown in mobile hero. */
  hideCoreSpecRows?: boolean;
};

export function FilmSpecsTabContent({
  specs = [],
  hideCoreSpecRows = false,
}: FilmSpecsTabContentProps) {
  const allRows = buildDetailRows(specs);
  const overviewDetailRows = hideCoreSpecRows
    ? allRows.filter((r) => r.type !== "spec")
    : allRows;

  if (overviewDetailRows.length === 0) {
    if (hideCoreSpecRows) return null;
    return (
      <p className="text-sm text-muted-foreground">
        No specifications are listed for this film stock yet.
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-10">
      <section aria-labelledby="film-specs-heading">
        <h3 id="film-specs-heading" className="mb-3 text-xl font-bold tracking-tight text-foreground">
          Details
        </h3>
        <dl className="grid min-w-0 w-full grid-cols-[max-content_minmax(0,1fr)] items-baseline gap-x-3 gap-y-2.5 sm:gap-x-4">
          {overviewDetailRows.map((row) => (
            <Fragment key={row.label}>
              <dt className="whitespace-nowrap text-right text-[10px] font-medium uppercase leading-none tracking-[0.07em] text-muted-foreground sm:text-[11px] sm:tracking-[0.05em]">
                {specsListLabel(row.label)}
              </dt>
              <dd className="min-w-0">
                <SpecsValue value={row.value} />
              </dd>
            </Fragment>
          ))}
        </dl>
      </section>
    </div>
  );
}

export type FilmCharacteristicsTabContentProps = {
  characterScales?: {
    grain?: number | null;
    contrast?: number | null;
    saturation?: number | null;
    latitude?: number | null;
  };
  filmType?: FilmType | null;
};

export function FilmCharacteristicsTabContent({ characterScales, filmType }: FilmCharacteristicsTabContentProps) {
  const characterSliders = useMemo(() => {
    const isBw = isBlackAndWhiteFilm(filmType ?? null);
    const sliderConfig = SLIDER_CONFIG.map((c) => {
      if (c.key === "saturation" && isBw) {
        return { ...c, label: "Color Sensitivity", low: "Orthochromatic", high: "Extended Panchromatic" };
      }
      return c;
    });
    return sliderConfig
      .filter(
        (c) => characterScales?.[c.key] != null && characterScales[c.key]! >= 1 && characterScales[c.key]! <= 5
      )
      .map((c) => ({ ...c, value: characterScales![c.key] as number }));
  }, [characterScales, filmType]);

  if (characterSliders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No characteristic scales are listed for this film stock yet.
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-10">
      <section aria-labelledby="film-characteristics-heading">
        <div className="mb-3">
          <h3 id="film-characteristics-heading" className="text-base font-semibold tracking-tight text-foreground">
            Characteristics
          </h3>
        </div>
        <div className="min-w-0 w-full" role="list" aria-label="Film characteristics">
          {characterSliders.map((item, i) => {
            const isLast = i === characterSliders.length - 1;
            return (
              <div
                key={item.key}
                role="listitem"
                className={cn(
                  "flex flex-col gap-y-2.5 border-b border-border/40 pb-5",
                  !isLast && "mb-5"
                )}
              >
                <p className={characteristicLabelTextClass}>{item.label}</p>
                <CharacteristicScaleRow
                  value={item.value}
                  lowLabel={item.low}
                  highLabel={item.high}
                  nameForA11y={item.label}
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export type FilmPerformanceTabContentProps = {
  shootingNotes: ShootingNote[];
};

function splitFirstSentence(text: string): [string, string] {
  const match = text.match(/^(.+?[.!?])\s+([\s\S]+)$/);
  if (match) return [match[1], match[2]];
  return [text, ""];
}

export function FilmPerformanceTabContent({ shootingNotes }: FilmPerformanceTabContentProps) {
  if (shootingNotes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No performance notes are listed for this film stock yet.
      </p>
    );
  }

  return (
    <div className="min-w-0">
      <section aria-labelledby="film-performance-heading">
        <div className="mb-3">
          <h3 id="film-performance-heading" className="text-base font-semibold tracking-tight text-foreground">
            Performance
          </h3>
        </div>
        <div className="min-w-0 w-full">
          {shootingNotes.map((note, i) => {
            const label = note.header?.trim() || `Note ${i + 1}`;
            const [firstSentence, rest] = splitFirstSentence(note.dek?.trim() ?? "");
            return (
              <div
                key={i}
                className={cn(
                  "border-b border-border/40 pb-4",
                  i === 0 ? "pt-0" : "pt-4"
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {firstSentence}
                </p>
                {rest && (
                  <p className="mt-1 text-sm leading-relaxed text-foreground/70">
                    {rest}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
