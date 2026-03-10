"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Grid2x2,
  Building2,
  Film,
  Gauge,
  Camera,
  BookOpen,
  CheckCircle2,
  Eye,
  Heart,
  Star,
  StarHalf,
  ExternalLink,
  ShoppingBag,
  NotebookPen,
  Plus,
  CircleX,
  DollarSign,
  Aperture,
  Palette,
  Contrast as ContrastIcon,
  Target,
  ScanLine,
  Thermometer,
  QrCode,
  FlaskConical,
  UserCircle,
  Mountain,
  Plane,
  Moon,
  LampDesk,
  Sun,
  Check,
} from "lucide-react";
import { QuickActions } from "@/components/community-section";
import type { BestFor } from "@/lib/types";
import { BEST_FOR_LABELS } from "@/lib/types";

const BEST_FOR_ICONS: Record<BestFor, React.ElementType> = {
  portrait: UserCircle,
  landscape: Mountain,
  street: Building2,
  wedding: Heart,
  travel: Plane,
  night: Moon,
  studio: LampDesk,
  everyday: Sun,
};

interface PurchaseLink {
  id: string;
  retailer_name: string;
  url: string;
  price_note: string | null;
}

interface HeroMockupProps {
  stock: {
    name: string;
    brand: { name: string; slug: string };
    type: string;
    typeLabel: string;
    typeColor: string;
    iso: number;
    format: string[];
    image_url: string | null;
    description: string | null;
    discontinued: boolean;
    price_tier: 1 | 2 | 3 | null;
    base_price_usd: number | null;
    purchase_links?: PurchaseLink[];
    specs?: { label: string; value: string }[];
    best_for?: BestFor[];
  };
}

function MiniStars({ rating, size = 16 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.25 && rating - full < 0.75;
  const adjusted = rating - full >= 0.75 ? full + 1 : full;
  const empty = 5 - adjusted - (hasHalf ? 1 : 0);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {Array.from({ length: adjusted }).map((_, i) => (
          <Star key={`f-${i}`} className="text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
        ))}
        {hasHalf && (
          <div className="relative" style={{ width: size, height: size }}>
            <Star className="absolute text-amber-400/30" style={{ width: size, height: size }} />
            <StarHalf className="absolute text-amber-400 fill-amber-400" style={{ width: size, height: size }} />
          </div>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e-${i}`} className="text-amber-400/30" style={{ width: size, height: size }} />
        ))}
      </div>
      <span className="text-sm font-semibold text-foreground/80">4.3</span>
    </div>
  );
}

/** Single star + "X.X Avg. rating" (reference-style metadata) */
function AvgRatingStar({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      <span>{rating.toFixed(1)} Avg. rating</span>
    </div>
  );
}

function OptionLabel({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-6 rounded-lg bg-primary/10 border border-primary/20 px-4 py-3">
      <p className="text-sm font-bold text-primary">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

function FilmImage({ stock, size = 144 }: { stock: HeroMockupProps["stock"]; size?: number }) {
  if (stock.image_url) {
    return (
      <Image
        src={stock.image_url}
        alt={`${stock.brand.name} ${stock.name}`}
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    );
  }
  return <Camera className="h-14 w-14 text-muted-foreground/40" />;
}

function StatPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary/50 px-3 py-1 text-xs font-medium">
      {children}
    </span>
  );
}

/* ─── OPTION A: Cinematic Banner ─── */
function OptionA({ stock }: HeroMockupProps) {
  return (
    <div>
      <OptionLabel
        label="Option A — Cinematic Banner"
        description="Full-width horizontal banner. Film canister on the left, big bold name, stats as a horizontal row of pills."
      />
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-8 p-8">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center">
            <FilmImage stock={stock} size={128} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">{stock.brand.name}</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">{stock.brand.name} {stock.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full ${stock.typeColor} px-3 py-1 text-xs font-medium text-white`}>
                {stock.typeLabel}
              </span>
              <StatPill>ISO {stock.iso}</StatPill>
              {stock.format.map((f) => (
                <StatPill key={f}>{f}</StatPill>
              ))}
              <StatPill>{stock.brand.name}</StatPill>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <MiniStars rating={4.3} />
              <span className="text-xs text-muted-foreground">Community Rating (600)</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
        <div className="flex-1">
          <p className="leading-relaxed text-muted-foreground text-sm">{stock.description}</p>
        </div>
        <div className="shrink-0">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

/* ─── OPTION B: Compact Catalog Header ─── */
function OptionB({ stock }: HeroMockupProps) {
  return (
    <div>
      <OptionLabel
        label="Option B — Compact Catalog Header"
        description="Single tight row: thumbnail, name, inline badges, and action buttons on the right. Description below."
      />
      <div className="rounded-2xl border border-border/50 bg-card px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center">
            <FilmImage stock={stock} size={64} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">{stock.brand.name} {stock.name}</h1>
              <div className="flex items-center gap-1.5">
                <MiniStars rating={4.3} size={13} />
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full ${stock.typeColor} px-2.5 py-0.5 text-[11px] font-medium text-white`}>
                {stock.typeLabel}
              </span>
              <StatPill>ISO {stock.iso}</StatPill>
              {stock.format.map((f) => (
                <StatPill key={f}>{f}</StatPill>
              ))}
            </div>
          </div>
          <div className="hidden shrink-0 sm:block">
            <QuickActions />
          </div>
        </div>
      </div>
      <div className="mt-4 sm:hidden">
        <QuickActions />
      </div>
      <p className="mt-4 leading-relaxed text-muted-foreground text-sm">{stock.description}</p>
    </div>
  );
}

/* ─── OPTION C: Large Image, No Card ─── */
function OptionC({ stock }: HeroMockupProps) {
  return (
    <div>
      <OptionLabel
        label="Option C — Large Image, No Card"
        description="No card borders. Big image on the left, clean stacked info on the right with a vertical stat list."
      />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
        <div className="flex h-52 w-44 shrink-0 items-center justify-center">
          <FilmImage stock={stock} size={176} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-primary uppercase tracking-wider">{stock.brand.name}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{stock.name}</h1>

          <div className="my-4 h-px bg-border/60" />

          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <Grid2x2 className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-sm">{stock.typeLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              <Gauge className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-sm">ISO {stock.iso}</span>
            </div>
            <div className="flex items-center gap-3">
              <Film className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-sm">{stock.format.join(", ")}</span>
            </div>
          </div>

          <div className="my-4 h-px bg-border/60" />

          <p className="leading-relaxed text-muted-foreground text-sm">{stock.description}</p>

          <div className="mt-4 flex items-center gap-2.5">
            <MiniStars rating={4.3} />
            <span className="text-xs text-muted-foreground">Community Rating (600)</span>
          </div>

          <div className="mt-4">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Interactive Half-Star Rating ─── */
function UserStarRating({
  value,
  onChange,
  rowHover,
}: {
  value: number;
  onChange: (value: number) => void;
  /** When set, clear (X) is shown when this is true and value > 0 (e.g. hover from parent row). */
  rowHover?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const [starsHover, setStarsHover] = useState(false);

  const display = hover || value;
  const showClear = value > 0 && (rowHover !== undefined ? rowHover : starsHover);

  function getValueFromEvent(e: React.MouseEvent<HTMLDivElement>, starIndex: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;
    return starIndex + (isLeft ? 0.5 : 1);
  }

  return (
    <div
      className="flex justify-center"
      onMouseEnter={() => setStarsHover(true)}
      onMouseLeave={() => { setHover(0); setStarsHover(false); }}
    >
      <div className="relative inline-flex">
        {value > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(0);
            }}
            className={`absolute right-full mr-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              showClear ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Clear rating"
            title="Clear rating"
          >
            <CircleX className="h-4 w-4 text-foreground" />
          </button>
        )}
        <div
          className="flex gap-1"
          onMouseLeave={() => setHover(0)}
        >
          {Array.from({ length: 5 }).map((_, i) => {
          const full = display >= i + 1;
          const half = !full && display >= i + 0.5;

          return (
            <div
              key={i}
              className="relative h-7 w-7 cursor-pointer"
              onMouseMove={(e) => setHover(getValueFromEvent(e, i))}
              onClick={(e) => {
                const val = getValueFromEvent(e, i);
                onChange(val === value ? 0 : val);
              }}
            >
              <Star className="absolute inset-0 h-7 w-7 text-muted-foreground/20" />
              {full && (
                <Star className="absolute inset-0 h-7 w-7 fill-primary text-primary" />
              )}
              {half && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className="h-7 w-7 fill-primary text-primary" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
  );
}

/* ─── Sticky Left Pane ─── */

const LOG_OPTIONS = [
  { id: "shot", label: "Shot", fullLabel: "I've shot this stock — save to shot stocks", Icon: CheckCircle2 },
  { id: "favorite", label: "Favorite", fullLabel: "Add to favourites", Icon: Heart },
  { id: "shootlist", label: "Shootlist", fullLabel: "I want to shoot this stock — save to shootlist", Icon: Plus },
] as const;

/** Active Shot: orange circle + white tick */
function ShotActiveIcon({ className }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary ${className ?? ""}`} aria-hidden>
      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
    </span>
  );
}

type LogActionId = (typeof LOG_OPTIONS)[number]["id"];

export function StickyLeftPane({ stock }: HeroMockupProps) {
  const [selectedIds, setSelectedIds] = useState<Set<LogActionId>>(new Set());
  const [rating, setRating] = useState(0);
  const [ratingRowHover, setRatingRowHover] = useState(false);

  const toggleAction = (id: LogActionId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRatingChange = (value: number) => {
    setRating(value);
    if (value > 0) {
      setSelectedIds((prev) => new Set(prev).add("shot"));
    }
  };

  return (
    <div className="w-full sm:w-72 sm:shrink-0">
      {/* Image */}
      <div className="relative mx-auto w-fit overflow-hidden rounded-xl border border-border/50 bg-white sm:mx-0 sm:w-full">
        <span
          className={`absolute left-2.5 top-2.5 z-10 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-sm ${stock.discontinued ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
        >
          {stock.discontinued ? "Discontinued" : "Available"}
        </span>
        <div className="flex items-center justify-center p-6">
          <div className="h-48 w-40">
            <FilmImage stock={stock} size={192} />
          </div>
        </div>
      </div>

      {/* Shot | Favorite | Shootlist — multiple can be selected; filled icons when active */}
      <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Film stock actions">
        {LOG_OPTIONS.map(({ id, label, fullLabel, Icon }) => {
          const isActive = selectedIds.has(id);
          const filledIcon = isActive && id === "favorite";
          const shotActive = isActive && id === "shot";
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleAction(id)}
              title={fullLabel}
              aria-pressed={isActive}
              aria-label={fullLabel}
              className={`group flex flex-col items-center justify-center gap-4 rounded-xl border px-2 py-6 transition-all ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {shotActive ? (
                <ShotActiveIcon />
              ) : filledIcon ? (
                <Icon className="h-6 w-6 shrink-0 fill-primary text-primary" aria-hidden />
              ) : (
                <Icon className="h-6 w-6 shrink-0" aria-hidden />
              )}
              <span className={`text-[10px] font-semibold uppercase tracking-wider leading-tight ${isActive ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Your rating — clear X appears when hovering anywhere on this row */}
      <div
        className="mt-2 overflow-hidden rounded-xl border border-border/50 bg-card px-4 py-3"
        onMouseEnter={() => setRatingRowHover(true)}
        onMouseLeave={() => setRatingRowHover(false)}
      >
        <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Your rating</p>
        <div className="flex justify-center">
          <UserStarRating value={rating} onChange={handleRatingChange} rowHover={ratingRowHover} />
        </div>
      </div>

      {/* Buy this stock */}
      {stock.purchase_links && stock.purchase_links.length > 0 && (
        <div className="mt-8">
          <BuyRightPane stock={stock} />
        </div>
      )}
    </div>
  );
}

/* ─── Buy Right Pane ─── */
export function BuyRightPane({ stock }: HeroMockupProps) {
  const links = stock.purchase_links ?? [];
  if (links.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
      <div className="px-4 py-3">
        <h3 className="text-xl font-bold tracking-tight text-foreground">Buy this stock</h3>
      </div>
      <div className="pb-5">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
              <ExternalLink className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 py-0.5">
              <p className="text-sm leading-tight text-foreground/80 break-words">{link.retailer_name}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Film detail right pane: Buy only (no actions card) ─── */
export function FilmDetailRightPane({ stock }: HeroMockupProps) {
  const links = stock.purchase_links ?? [];
  if (links.length === 0) return null;
  return (
    <div className="w-full self-start sm:sticky sm:top-24 sm:w-56 sm:shrink-0">
      <BuyRightPane stock={stock} />
    </div>
  );
}

/* ─── Page Title Header ─── */
export function PageTitleHeader({ stock }: HeroMockupProps) {
  const stats = {
    avgRating: 4.3,
    shotByCount: 124,
    favouritesCount: 89,
  };

  return (
    <div className="mb-0 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
      <div className="min-w-0 flex-1">
        <h1 className="font-advercase text-3xl font-bold tracking-tight sm:text-4xl">
          {stock.brand.name} {stock.name}
        </h1>
      </div>

      {/* Stats pane — icon + number inline, label below centred */}
      <div className="flex shrink-0 gap-5 sm:gap-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-foreground">{stats.avgRating.toFixed(1)}</span>
          </div>
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg. rating</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-foreground">{stats.shotByCount}</span>
          </div>
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Shot by</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <Heart className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-foreground">{stats.favouritesCount}</span>
          </div>
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Favourites</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Specs Right Pane ─── */

const SPEC_ICONS: Record<string, React.ElementType> = {
  "Film Format": Aperture,
  "Film Colour & Type": Palette,
  "Film Type": Palette,
  "ISO": Gauge,
  "Grain": ScanLine,
  "Contrast": ContrastIcon,
  "Colour Balance": Thermometer,
  "Color Palette": Palette,
  "Exposure Latitude": Target,
  "Latitude": Target,
  "DX Coding": QrCode,
  "Film Development Process": FlaskConical,
  "Development Process": FlaskConical,
};

const SPEC_LABEL_DISPLAY: Record<string, string> = {
  "Film Format": "Format",
  "Film Colour & Type": "Type",
  "Exposure Latitude": "Latitude",
  "Development Process": "Development",
};

function getSpecDisplayLabel(label: string): string {
  return SPEC_LABEL_DISPLAY[label] ?? label;
}

/** Specs table for main content — same row style as right pane (icon + label above value), one card */
export function SpecsTable({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
      <div className="px-4 py-3">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Specs</h2>
      </div>
      <div className="pb-5">
        {specs.map((spec) => {
          const Icon = SPEC_ICONS[spec.label];
          const displayLabel = getSpecDisplayLabel(spec.label);
          return (
            <div
              key={spec.label}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
            >
              {Icon ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
              ) : (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground text-xs font-medium">
                  —
                </span>
              )}
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-tight">
                  {displayLabel}
                </p>
                <p className="mt-px text-sm leading-tight text-foreground/80 break-words">{spec.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SpecsRightPane({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;

  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-border/50">
        <div className="border-b border-border/50 px-4 py-3">
          <p className="font-advercase text-sm font-bold tracking-tight">Specs</p>
        </div>
        {specs.map((spec, i) => (
          <div key={spec.label} className={`px-4 py-2 ${i % 2 === 0 ? "bg-secondary/30" : "bg-card"}`}>
            <p className="text-[10px] font-medium text-muted-foreground">{spec.label}</p>
            <p className="text-xs font-semibold text-foreground">{spec.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Film detail right pane: specs with icon + category label above value (small caps) */
export function FilmDetailSpecsPane({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;

  return (
    <div className="w-full sm:w-56 sm:shrink-0">
      <h2 className="mb-4 text-xl font-bold tracking-tight text-foreground">Specs</h2>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        <div className="pb-5">
          {specs.map((spec) => {
            const Icon = SPEC_ICONS[spec.label];
            return (
              <div
                key={spec.label}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
              >
                {Icon ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs font-medium">
                    —
                  </span>
                )}
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-tight">
                    {spec.label}
                  </p>
                  <p className="mt-px text-sm leading-tight text-foreground/80 break-words">{spec.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 3×3 specs grid for main content — same icons and language as FilmDetailSpecsPane, all in one card */
export function SpecsGrid({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4">
      <div className="grid grid-cols-3 gap-x-6 gap-y-4">
        {specs.map((spec) => {
          const Icon = SPEC_ICONS[spec.label];
          return (
            <div
              key={spec.label}
              className="flex items-center gap-2.5"
            >
              {Icon ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground text-[10px] font-medium">
                  —
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-tight">
                  {spec.label}
                </p>
                <p className="mt-px text-sm leading-tight text-foreground/80 break-words">{spec.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Option A: Current — 3×3 grid, icon + label + value per cell */
export function SpecsGridOptionA({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4">
      <div className="grid grid-cols-3 gap-x-6 gap-y-4">
        {specs.map((spec) => {
          const Icon = SPEC_ICONS[spec.label];
          return (
            <div key={spec.label} className="flex items-center gap-2.5">
              {Icon ? (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
              ) : (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground text-[10px] font-medium">—</span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground leading-tight">{spec.label}</p>
                <p className="mt-px text-sm leading-tight text-foreground/80 break-words">{spec.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Option B: Table — two columns (label | value), no icons, dense rows */
export function SpecsGridOptionB({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
      <table className="w-full text-left text-sm">
        <tbody>
          {specs.map((spec) => (
            <tr key={spec.label} className="border-b border-border/50 last:border-b-0">
              <td className="py-2.5 pr-4 font-medium uppercase tracking-wider text-muted-foreground w-40 shrink-0">
                {spec.label}
              </td>
              <td className="py-2.5 text-foreground/80">
                {spec.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Option C: Value-only 3×3 — just value in cell, label as small caps above */
export function SpecsGridOptionC({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card p-4">
      <div className="grid grid-cols-3 gap-4">
        {specs.map((spec) => (
          <div key={spec.label} className="flex flex-col items-center text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              {spec.label}
            </p>
            <p className="text-sm font-medium text-foreground/90 break-words">
              {spec.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Option D: Definition list — label left (fixed), value right, alternating row bg */
export function SpecsGridOptionD({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
      <dl className="divide-y divide-border/50">
        {specs.map((spec, i) => (
          <div
            key={spec.label}
            className={`flex items-baseline gap-4 px-4 py-2.5 ${i % 2 === 1 ? "bg-secondary/20" : ""}`}
          >
            <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground w-36 shrink-0">
              {spec.label}
            </dt>
            <dd className="text-sm text-foreground/80 min-w-0">
              {spec.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Option E: Pills — icon + Label: Value, no card, flex wrap */
export function SpecsGridOptionE({ specs }: { specs: { label: string; value: string }[] }) {
  if (specs.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {specs.map((spec) => {
        const Icon = SPEC_ICONS[spec.label];
        return (
          <span
            key={spec.label}
            className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/30 px-3 py-1.5 text-sm"
          >
            {Icon ? (
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            ) : (
              <span className="h-3.5 w-3.5 shrink-0 text-[10px] font-medium text-muted-foreground">—</span>
            )}
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {spec.label}:
            </span>
            <span className="text-foreground/90">{spec.value}</span>
          </span>
        );
      })}
    </div>
  );
}

/* ─── Price + Buy Card ─── */
export function PriceBuyCard({ stock }: HeroMockupProps) {
  const links = stock.purchase_links ?? [];
  if (links.length === 0 && stock.base_price_usd === null) return null;
  return (
    <div className="mb-8 rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Avg. price per roll</p>
          {stock.base_price_usd !== null && (
            <p className="text-2xl font-bold tracking-tight">${stock.base_price_usd}</p>
          )}
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer sponsored" className="font-advercase inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3.5 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
                {link.retailer_name}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CircleAction({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="group flex flex-col items-center gap-1.5">
      <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card transition-all group-hover:border-primary/40 group-hover:bg-primary/5">
        <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
      </div>
      <span className="text-[10px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
    </button>
  );
}

function RectAction({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card py-3 transition-all hover:border-primary/40 hover:bg-primary/5">
      <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
      <span className="font-advercase text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
    </button>
  );
}

/* ─── OPTION E: Understated Header, Community First ─── */
function OptionE({ stock }: HeroMockupProps) {
  return (
    <div>
      <OptionLabel
        label="Option E — Understated Header, Community First"
        description="Minimal hero — just name + thumbnail on one line. Everything else below. Puts community interactions front and centre."
      />
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center">
          <FilmImage stock={stock} size={56} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{stock.brand.name} {stock.name}</h1>
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
          <span className={`inline-flex items-center rounded-full ${stock.typeColor} px-2.5 py-0.5 text-[11px] font-medium text-white`}>
            {stock.typeLabel}
          </span>
          <StatPill>ISO {stock.iso}</StatPill>
          {stock.format.map((f) => (
            <StatPill key={f}>{f}</StatPill>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:hidden">
        <span className={`inline-flex items-center rounded-full ${stock.typeColor} px-2.5 py-0.5 text-[11px] font-medium text-white`}>
          {stock.typeLabel}
        </span>
        <StatPill>ISO {stock.iso}</StatPill>
        {stock.format.map((f) => (
          <StatPill key={f}>{f}</StatPill>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-5">
        <MiniStars rating={4.3} />
        <span className="text-xs text-muted-foreground">600 ratings</span>
      </div>

      <div className="mt-4">
        <QuickActions />
      </div>

      <div className="mt-6 rounded-xl border border-border/50 bg-card p-5">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">About this stock</h2>
        </div>
        <p className="leading-relaxed text-muted-foreground text-sm">{stock.description}</p>
      </div>
    </div>
  );
}

/* ─── OPTION F: Letterboxd-Style 3-Column ─── */
function OptionF({ stock }: HeroMockupProps) {
  return (
    <div>
      <OptionLabel
        label="Option F — Letterboxd-Style 3-Column"
        description="Image on the left, description in the middle, community action card on the right."
      />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        {/* Left: Image card with quick stats */}
        <div className="shrink-0 sm:w-48">
          <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
            <div className="flex h-52 w-full items-center justify-center p-3">
              <FilmImage stock={stock} size={200} />
            </div>
            <div className="border-t border-border/50 px-4 py-3">
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                <div className="flex items-center gap-2">
                  <Grid2x2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-medium">{stock.typeLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-medium">{stock.brand.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Film className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-medium">{stock.format.join(", ")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <span className="text-[11px] font-medium">ISO {stock.iso}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Title + description */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/brands/${stock.brand.slug}`}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {stock.brand.name}
          </Link>
          <h1 className="mt-0.5 text-4xl font-bold tracking-tight sm:text-5xl font-advercase">
            {stock.name}
          </h1>

          <p className="mt-5 leading-relaxed text-muted-foreground">{stock.description}</p>
        </div>

        {/* Right: Community action card */}
        <div className="shrink-0 sm:w-52">
          <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/50">
            <CommunityActionRow icon={CheckCircle2} label="I've Shot This" activeColor="emerald" />
            <CommunityActionRow icon={Eye} label="Add to Shootlist" activeColor="blue" />
            <CommunityActionRow icon={Heart} label="Save" activeColor="primary" />

            <div className="px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Rate</p>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 cursor-pointer text-muted-foreground/30 transition-colors hover:text-amber-400 hover:fill-amber-400"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Ratings summary */}
          <div className="mt-4 rounded-xl border border-border/50 bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ratings</p>
              <p className="text-xs text-muted-foreground">600 fans</p>
            </div>
            <div className="mt-2 flex items-end justify-between gap-0.5">
              {[8, 14, 22, 48, 72, 96, 80, 52, 36, 20].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-primary/20 transition-colors hover:bg-primary/40"
                  style={{ height: `${h * 0.4}px` }}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <MiniStars rating={4.3} size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunityActionRow({ icon: Icon, label, activeColor }: { icon: React.ElementType; label: string; activeColor: string }) {
  const colorMap: Record<string, { hover: string; iconHover: string }> = {
    emerald: { hover: "hover:bg-emerald-500/5", iconHover: "group-hover:text-emerald-500" },
    blue: { hover: "hover:bg-blue-500/5", iconHover: "group-hover:text-blue-500" },
    primary: { hover: "hover:bg-primary/5", iconHover: "group-hover:text-primary" },
  };
  const colors = colorMap[activeColor] || colorMap.primary;

  return (
    <button className={`group flex w-full items-center gap-3 px-4 py-3 transition-colors ${colors.hover}`}>
      <Icon className={`h-4 w-4 text-muted-foreground transition-colors ${colors.iconHover}`} />
      <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
    </button>
  );
}

