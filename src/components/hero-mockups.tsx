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
  SunDim,
  Trophy,
  Sparkles,
  Check,
  Image as ImageIcon,
  Pencil,
  Calendar,
  CirclePlus,
  Plus,
  Landmark,
  Sunset,
  Lightbulb,
  FileVideo,
} from "lucide-react";
import { QuickActions } from "@/components/community-section";
import { TrackFilmModal } from "@/components/track-film-modal";
import { AddReviewModal } from "@/components/add-review-modal";
import { showToastViaEvent } from "@/components/toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUserActions } from "@/context/user-actions-context";
import { useAuth } from "@/context/auth-context";
import type { AddReviewModalPayload } from "@/components/add-review-modal";
import type { BestFor } from "@/lib/types";
import { BEST_FOR_LABELS } from "@/lib/types";

const BEST_FOR_ICONS: Record<BestFor, React.ElementType> = {
  general_purpose: Sun,
  portrait: UserCircle,
  street: Building2,
  landscapes: Mountain,
  architecture: Landmark,
  documentary: FileVideo,
  sports: Trophy,
  travel: Plane,
  weddings: Heart,
  studio: LampDesk,
  bright_sun: SunDim,
  golden_hour: Sunset,
  low_light: Moon,
  artificial_light: Lightbulb,
  experimental: Sparkles,
};

interface PurchaseLink {
  id: string;
  retailer_name: string;
  url: string;
  price_note: string | null;
}

interface HeroMockupProps {
  stock: {
    slug: string;
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
    <div className="mb-6 rounded-card bg-primary/10 border border-primary/20 px-4 py-3">
      <p className="text-sm font-bold text-primary">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

function FilmImage({
  stock,
  size = 144,
  width: widthProp,
  height: heightProp,
}: {
  stock: HeroMockupProps["stock"];
  size?: number;
  width?: number;
  height?: number;
}) {
  const width = widthProp ?? size;
  const height = heightProp ?? size;
  if (stock.image_url) {
    return (
      <Image
        src={stock.image_url}
        alt={stock.name}
        width={width}
        height={height}
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
      <div className="rounded-[7px] border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-8 p-8">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center">
            <FilmImage stock={stock} size={128} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-primary uppercase tracking-wider">{stock.typeLabel}</p>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">{stock.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full ${stock.typeColor} px-3 py-1 text-xs font-medium text-white`}>
                {stock.typeLabel}
              </span>
              <StatPill>ISO {stock.iso}</StatPill>
              {stock.format.map((f) => (
                <StatPill key={f}>{f}</StatPill>
              ))}
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
      <div className="rounded-[7px] border border-border/50 bg-card px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center">
            <FilmImage stock={stock} size={64} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">{stock.name}</h1>
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
          <p className="text-xs font-medium text-primary uppercase tracking-wider">{stock.typeLabel}</p>
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
            className={`absolute right-full mr-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50 ${
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
              className="relative h-6 w-6 cursor-pointer"
              onMouseMove={(e) => setHover(getValueFromEvent(e, i))}
              onClick={(e) => {
                const val = getValueFromEvent(e, i);
                const isLeftHalfOfFirstStar = i === 0 && val === 0.5;
                if (value > 0 && isLeftHalfOfFirstStar) {
                  onChange(0);
                } else {
                  onChange(val === value ? 0 : val);
                }
              }}
            >
              <Star className="absolute inset-0 h-6 w-6 fill-none stroke-[1.5] text-muted-foreground/50" />
              {full && (
                <Star className="absolute inset-0 h-6 w-6 fill-primary text-primary" />
              )}
              {half && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className="h-6 w-6 fill-primary text-primary" />
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
  { id: "shot", labelInactive: "Shot It", labelActive: "Shot It", fullLabel: "I've shot this stock — save to shot stocks", Icon: CheckCircle2 },
  { id: "favorite", labelInactive: "Shootlist", labelActive: "On Shootlist", fullLabel: "Add to shootlist", Icon: CirclePlus },
] as const;

/** Active Shot: orange circle + white tick */
function ShotActiveIcon({ className }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary ${className ?? ""}`} aria-hidden>
      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
    </span>
  );
}

/** Active Shootlist: orange circle + white plus (same treatment as Shot) */
function ShootlistActiveIcon({ className }: { className?: string }) {
  return (
    <span className={`relative inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary ${className ?? ""}`} aria-hidden>
      <Plus className="h-3.5 w-3.5 text-white" strokeWidth={3} />
    </span>
  );
}

/** Inactive Shot it icon: circle + check visible always; check draws in on hover (record.club-style) */
function ShotItIconInactive() {
  return (
    <span className="shot-tick-draw inline-flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground/20 transition-colors group-hover:text-primary" aria-hidden>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <circle cx="12" cy="12" r="10" />
        {/* Always-visible tick (muted, turns primary on hover) */}
        <path
          d="M9 12l2 2 4-4"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={0}
        />
        {/* Overlay tick that draws in on hover via CSS animation */}
        <path
          className="tick-draw-path"
          d="M9 12l2 2 4-4"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
      </svg>
    </span>
  );
}

type LogActionId = (typeof LOG_OPTIONS)[number]["id"];

export function StickyLeftPane({ stock }: HeroMockupProps) {
  const { slug } = stock;
  const {
    shotSlugs,
    favouriteSlugs,
    toggleShot,
    toggleFavourite,
    addOrUpdateTracked,
    setRating: persistRating,
    ratings,
  } = useUserActions();
  const { user } = useAuth();

  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<"review" | "upload">("review");
  const [hoveredActionId, setHoveredActionId] = useState<"shot" | "favorite" | null>(null);
  const [actionsDrawerOpen, setActionsDrawerOpen] = useState(false);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);

  const isShot = shotSlugs.includes(slug);
  const isFavourite = favouriteSlugs.includes(slug);
  const rating = ratings[slug] ?? 0;

  const [ratingRowHover, setRatingRowHover] = useState(false);

  const toggleAction = (id: LogActionId) => {
    if (id === "shot") {
      const { added } = toggleShot(slug);
      showToastViaEvent(added ? "Added to stocks you've shot" : "Removed from Shot");
      return;
    }
    if (id === "favorite") {
      const { added } = toggleFavourite(slug);
      showToastViaEvent(added ? "Added to shootlist" : "Removed from shootlist");
      return;
    }
  };

  const handleRatingChange = (value: number) => {
    persistRating(slug, value);
    if (value > 0 && !isShot) {
      toggleShot(slug);
      showToastViaEvent("Added to stocks you've shot");
    }
  };

  const handleTrackSave = (entry: { format: string; status: string; expiryDate: string; notes: string }) => {
    addOrUpdateTracked({
      slug,
      format: entry.format,
      status: entry.status,
      expiryDate: entry.expiryDate,
      notes: entry.notes,
    });
    showToastViaEvent("Added to Tracked");
    setTrackModalOpen(false);
  };

  const closeDrawerThen = (fn: () => void) => {
    setActionsDrawerOpen(false);
    setReviewDrawerOpen(false);
    const t = setTimeout(fn, 150);
    return () => clearTimeout(t);
  };

  return (
    <div className="w-full min-w-0 flex flex-col md:w-56 md:min-w-[14rem] md:shrink-0 md:self-start md:overflow-visible">
      {/* Below md (768px): single col, image + 3-btn row. md+: 2-col (image | rating) then contents. */}
      <div className="grid grid-cols-1 gap-4">
      <div className="flex min-w-0 flex-col gap-3">
      {/* Image card — mobile: image + Shot it | Shootlist | Log a roll (3 in row); md+: image + 2-col + Log a roll */}
      <div className="relative mx-auto w-full min-w-0 max-w-sm overflow-hidden rounded-[7px] border border-border/50 bg-white md:mx-0 md:max-w-none md:w-full">
        {stock.discontinued && (
          <span
            className="absolute left-2.5 top-2.5 z-10 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            aria-hidden
          >
            Discontinued
          </span>
        )}
        <div className="flex items-center justify-center px-6 pt-0 pb-0">
          <div className={slug === "cinestill-800t" ? "h-40 w-48" : "h-48 w-40"}>
            <FilmImage
              stock={stock}
              size={192}
              {...(slug === "cinestill-800t" ? { width: 192, height: 160 } : {})}
            />
          </div>
        </div>
        {/* Desktop (md+): 2-col Shot it | Shootlist */}
        <div className="hidden grid-cols-2 gap-0 border-t border-border/50 md:grid [&>*:first-child]:border-r [&>*:first-child]:border-border/50" role="group" aria-label="Film stock actions">
          {LOG_OPTIONS.map(({ id, fullLabel, Icon, labelInactive, labelActive }) => {
            const isActive = id === "shot" ? isShot : isFavourite;
            const label = isActive ? labelActive : labelInactive;
            const filledIcon = isActive && id === "favorite";
            const shotActive = isActive && id === "shot";
            const showRemove = isActive && hoveredActionId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleAction(id)}
                title={fullLabel}
                aria-pressed={isActive}
                aria-label={fullLabel}
                className="group flex flex-col items-center justify-center gap-2 px-2 py-3 text-xs font-normal normal-case transition-colors hover:bg-muted/60 text-muted-foreground"
                onMouseEnter={() => setHoveredActionId(id)}
                onMouseLeave={() => setHoveredActionId(null)}
              >
                {shotActive ? (
                  <ShotActiveIcon />
                ) : filledIcon ? (
                  <ShootlistActiveIcon />
                ) : id === "shot" ? (
                  <ShotItIconInactive />
                ) : (
                  <Icon
                    className="h-6 w-6 shrink-0 text-muted-foreground/20 transition-colors group-hover:text-primary transition-transform duration-200 group-hover:rotate-90"
                    aria-hidden
                  />
                )}
                <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                  {showRemove ? "Remove" : label}
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setTrackModalOpen(true)}
          className="hidden w-full items-center justify-center border-t border-border/50 px-4 py-3 text-xs font-normal normal-case transition-colors hover:bg-primary/5 text-muted-foreground hover:text-foreground md:flex"
        >
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Log a roll</span>
        </button>

        {/* Mobile only (below md): Shot it | Shootlist | Log a roll — same as desktop, 3 in one row */}
        <div className="grid grid-cols-3 gap-0 border-t border-border/50 md:hidden [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-border/50" role="group" aria-label="Film stock actions">
          {LOG_OPTIONS.map(({ id, fullLabel, Icon, labelInactive, labelActive }) => {
            const isActive = id === "shot" ? isShot : isFavourite;
            const label = isActive ? labelActive : labelInactive;
            const filledIcon = isActive && id === "favorite";
            const shotActive = isActive && id === "shot";
            const showRemove = isActive && hoveredActionId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleAction(id)}
                title={fullLabel}
                aria-pressed={isActive}
                aria-label={fullLabel}
                className="group flex flex-col items-center justify-center gap-2 px-2 py-3 text-xs font-normal normal-case transition-colors hover:bg-muted/60 text-muted-foreground"
                onMouseEnter={() => setHoveredActionId(id)}
                onMouseLeave={() => setHoveredActionId(null)}
              >
                {shotActive ? (
                  <ShotActiveIcon />
                ) : filledIcon ? (
                  <ShootlistActiveIcon />
                ) : id === "shot" ? (
                  <ShotItIconInactive />
                ) : (
                  <Icon
                    className="h-6 w-6 shrink-0 text-muted-foreground/20 transition-colors group-hover:text-primary transition-transform duration-200 group-hover:rotate-90"
                    aria-hidden
                  />
                )}
                <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">
                  {showRemove ? "Remove" : label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setActionsDrawerOpen(true)}
            className="group flex flex-col items-center justify-center gap-2 px-2 py-3 text-xs font-normal normal-case transition-colors hover:bg-muted/60 text-muted-foreground hover:text-foreground"
            aria-label="Actions"
          >
            <Star className="h-6 w-6 shrink-0 fill-none stroke-[1.5] text-muted-foreground/50 transition-colors group-hover:text-primary group-hover:fill-primary/10 group-hover:stroke-primary" aria-hidden />
            <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Actions</span>
          </button>
        </div>
      </div>
      </div>

      {/* Card 2: Rate + Write review + Post a shot (hidden below md; gap above when stacked on md+) */}
      <div className="hidden overflow-hidden rounded-[7px] border border-border/50 bg-card divide-y divide-border/50 md:block md:mt-4">
        <div
          className="px-4 py-3 text-center"
          onMouseEnter={() => setRatingRowHover(true)}
          onMouseLeave={() => setRatingRowHover(false)}
        >
          <div className="flex justify-center">
            <UserStarRating value={rating} onChange={handleRatingChange} rowHover={ratingRowHover} />
          </div>
          <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rate</p>
        </div>

        {/* Row: Write review — text only, centered */}
        <button
          type="button"
          onClick={() => {
            setReviewModalMode("review");
            setReviewModalOpen(true);
          }}
          className="group flex w-full items-center justify-center px-4 py-3 text-xs font-normal normal-case transition-colors hover:bg-primary/5 text-muted-foreground hover:text-foreground"
        >
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Write review</span>
        </button>

        {/* Row: Post a shot — text only, centered */}
        <button
          type="button"
          onClick={() => {
            setReviewModalMode("upload");
            setReviewModalOpen(true);
          }}
          className="group flex w-full items-center justify-center px-4 py-3 text-xs font-normal normal-case transition-colors hover:bg-primary/5 text-muted-foreground hover:text-foreground"
        >
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Post a shot</span>
        </button>
      </div>
      </div>

      {/* Mobile Actions drawer — same content and styling as desktop rating card */}
      <Sheet open={actionsDrawerOpen} onOpenChange={setActionsDrawerOpen}>
        <SheetContent side="bottom" showDragHandle showCloseButton={false} className="gap-0 pb-8">
          <div className="divide-y divide-border/50 overflow-hidden rounded-[7px] border border-border/50 bg-card">
            <button
              type="button"
              onClick={() => closeDrawerThen(() => setTrackModalOpen(true))}
              className="group flex w-full items-center justify-center border-border/50 px-4 py-3 text-xs font-normal normal-case transition-colors hover:bg-primary/5 text-muted-foreground hover:text-foreground"
            >
              <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Log a roll</span>
            </button>
            <div
              className="px-4 py-3 text-center"
              onMouseEnter={() => setRatingRowHover(true)}
              onMouseLeave={() => setRatingRowHover(false)}
            >
              <div className="flex justify-center">
                <UserStarRating value={rating} onChange={handleRatingChange} rowHover={ratingRowHover} />
              </div>
              <p className="mt-2 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rate</p>
            </div>
            <button
              type="button"
              onClick={() => closeDrawerThen(() => { setReviewModalMode("review"); setReviewModalOpen(true); })}
              className="group flex w-full items-center justify-center px-4 py-3 text-xs font-normal normal-case transition-colors hover:bg-primary/5 text-muted-foreground hover:text-foreground"
            >
              <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Write review</span>
            </button>
            <button
              type="button"
              onClick={() => closeDrawerThen(() => { setReviewModalMode("upload"); setReviewModalOpen(true); })}
              className="group flex w-full items-center justify-center px-4 py-3 text-xs font-normal normal-case transition-colors hover:bg-primary/5 text-muted-foreground hover:text-foreground"
            >
              <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground">Post a shot</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={reviewDrawerOpen} onOpenChange={setReviewDrawerOpen}>
        <SheetContent side="bottom" showDragHandle showCloseButton={false} className="gap-0 pb-8">
          <SheetHeader className="pb-2">
            <SheetTitle>Rate &amp; review</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center gap-6 px-4 pt-2">
            <div className="flex flex-col items-center gap-2">
              <UserStarRating value={rating} onChange={handleRatingChange} rowHover={false} />
              <p className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Rate</p>
            </div>
            <button
              type="button"
              onClick={() => closeDrawerThen(() => { setReviewModalMode("review"); setReviewModalOpen(true); })}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[7px] bg-primary/10 py-3 text-base font-semibold text-foreground transition-colors hover:bg-primary/15"
            >
              <Pencil className="h-5 w-5 shrink-0" aria-hidden />
              Write a review
            </button>
          </div>
          <div className="mt-6 flex justify-center pb-2">
            <button
              type="button"
              onClick={() => setReviewDrawerOpen(false)}
              className="text-sm font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Close
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <TrackFilmModal
        open={trackModalOpen}
        onOpenChange={setTrackModalOpen}
        onSave={handleTrackSave}
        stock={{
          slug: stock.slug,
          name: stock.name,
          brand: stock.brand,
          format: stock.format ?? [],
          image_url: stock.image_url,
        }}
      />

      <AddReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        mode={reviewModalMode}
        slotsUsed={reviewModalMode === "upload" ? 1 : 0}
        initialRating={rating}
        stock={{
          slug: stock.slug,
          name: stock.name,
          brand: stock.brand,
          format: stock.format ?? [],
          image_url: stock.image_url,
        }}
        onSubmit={async (payload: AddReviewModalPayload) => {
          if (user) {
            const formData = new FormData();
            formData.set("film_stock_slug", slug);
            formData.set("mode", reviewModalMode);
            formData.set("rating", String(payload.rating));
            if (payload.reviewTitle) formData.set("review_title", payload.reviewTitle);
            if (payload.reviewText) formData.set("review_text", payload.reviewText);
            if (payload.camera) formData.set("camera", payload.camera);
            if (payload.lens) formData.set("lens", payload.lens);
            if (payload.developedAt) formData.set("developed_at", payload.developedAt);
            if (payload.caption) formData.set("caption", payload.caption);
            if (payload.shotIso) formData.set("shot_iso", payload.shotIso);
            if (payload.lab) formData.set("lab", payload.lab);
            if (payload.filter) formData.set("filter", payload.filter);
            if (payload.scanner) formData.set("scanner", payload.scanner);
            if (payload.format) formData.set("format", payload.format);
            if (payload.location) formData.set("location", payload.location);
            if (payload.iso) formData.set("iso", payload.iso);
            if (payload.pushPull) formData.set("push_pull", payload.pushPull);
            const usedPreUpload = reviewModalMode === "upload" && !!payload.uploadedImageUrl;
            if (usedPreUpload) {
              formData.set("image_url", payload.uploadedImageUrl!);
            } else {
              payload.files.forEach((file, i) => formData.append(`file_${i}`, file));
            }
            try {
              const res = await fetch("/api/user/reviews", {
                method: "POST",
                body: formData,
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) {
                showToastViaEvent(data.error || "Failed to submit");
                return;
              }
              const uploadSucceeded = data.uploaded > 0;
              if ((payload.files.length > 0 || payload.uploadedImageUrl) && uploadSucceeded) {
                window.dispatchEvent(new CustomEvent("film-upload-complete", { detail: { slug } }));
              }
              showToastViaEvent(
                reviewModalMode === "upload"
                  ? (payload.uploadedImageUrl || payload.files.length > 0 ? "Thanks! Your images have been uploaded." : "Done.")
                  : payload.files.length > 0
                    ? "Thanks! Your photos and review have been submitted."
                    : "Thanks! Your review has been submitted."
              );
              if (reviewModalMode === "upload" && (payload.uploadedImageUrl || payload.files.length > 0) && uploadSucceeded) {
                return { success: true };
              }
            } catch {
              showToastViaEvent("Failed to submit");
              return;
            }
          } else {
            if (payload.rating > 0) persistRating(slug, payload.rating);
            showToastViaEvent(
              reviewModalMode === "upload"
                ? (payload.files.length > 0 ? "Log in to save your uploads." : "Done.")
                : payload.files.length > 0
                  ? "Log in to save your photos and review."
                  : "Your rating was saved locally. Log in to save reviews and uploads."
            );
          }
        }}
      />
    </div>
  );
}

/* ─── Buy Right Pane ─── */
export function BuyRightPane({ stock }: HeroMockupProps) {
  const links = stock.purchase_links ?? [];
  if (links.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card">
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
export interface FilmStockStatsProp {
  avgRating: number | null;
  shotByCount: number;
  favouritesCount: number;
  shotsCount: number;
}

export function PageTitleHeader({
  stock,
  stats,
}: HeroMockupProps & { stats?: FilmStockStatsProp | null }) {
  const display = {
    avgRating: stats?.avgRating ?? null,
    shotByCount: stats?.shotByCount ?? 0,
    favouritesCount: stats?.favouritesCount ?? 0,
    shotsCount: stats?.shotsCount ?? 0,
  };

  return (
      /* HeaderContent: below md = column, title then stats, both center-aligned; md+ = row, wrap when narrow. */
      <div
        className="@container mb-0 flex min-w-0 flex-wrap flex-col gap-x-8 gap-y-5 md:flex-row items-center md:items-start @[28rem]:items-center"
        data-header-content
      >
        <div className="min-w-0 w-fit">
          <h1 className="w-fit font-advercase text-3xl font-bold tracking-tight sm:text-4xl md:text-left text-center">
            {stock.name}
          </h1>
        </div>

        {/* Quick Stats — below md: 3 equal columns so 5.0 is the true centre, other two either side; md+: flex row */}
        <div className="grid w-full max-w-sm grid-cols-3 gap-5 shrink-0 place-items-center md:max-w-none md:w-auto md:grid-cols-[auto_auto_auto] md:flex md:justify-start sm:gap-6">
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-foreground">{display.shotByCount}</span>
          </div>
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Shot It</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-1.5">
            <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-foreground">
              {display.avgRating != null ? display.avgRating.toFixed(1) : "—"}
            </span>
          </div>
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg. rating</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-1.5">
            <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-base font-semibold tracking-tight text-foreground">{display.shotsCount}</span>
          </div>
          <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Shots</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Specs Right Pane ─── */

const SPEC_ICONS: Record<string, React.ElementType> = {
  "Film Format": Aperture,
  "Format": Aperture,
  "Release Date": Calendar,
  "Film Colour & Type": Palette,
  "Film Type": Palette,
  "ISO": Gauge,
  "Grain": ScanLine,
  "Contrast": ContrastIcon,
  "Colour Balance": Thermometer,
  "Color Balance": Thermometer,
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
    <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card">
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
      <div className="overflow-hidden rounded-[7px] border border-border/50">
        <div className="border-b border-border/50 px-4 py-3">
          <p className="font-sans text-sm font-bold tracking-tight">Specs</p>
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
      <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card">
        <div className="pb-5">
          {specs.map((spec) => {
            const Icon = SPEC_ICONS[spec.label];
            return (
              <div
                key={spec.label}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30"
              >
                {Icon ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-muted text-muted-foreground text-xs font-medium">
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
    <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card p-4">
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
    <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card p-4">
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
    <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card">
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
    <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card p-4">
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
    <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card">
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
    <div className="mb-8 rounded-[7px] border border-border/50 bg-card p-4">
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
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer sponsored" className="font-sans inline-flex items-center gap-1.5 rounded-card border border-border bg-secondary/50 px-3.5 py-2 text-xs font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
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
    <button className="group flex flex-col items-center gap-2 rounded-[7px] border border-border/60 bg-card py-3 transition-all hover:border-primary/40 hover:bg-primary/5">
      <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
      <span className="font-sans text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{stock.name}</h1>
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

      <div className="mt-6 rounded-[7px] border border-border/50 bg-card p-5">
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
          <div className="overflow-hidden rounded-[7px] border border-border/50 bg-card">
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
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-advercase">
            {stock.name}
          </h1>

          <p className="mt-5 leading-relaxed text-muted-foreground">{stock.description}</p>
        </div>

        {/* Right: Community action card */}
        <div className="shrink-0 sm:w-52">
          <div className="rounded-[7px] border border-border/50 bg-card divide-y divide-border/50">
            <CommunityActionRow icon={CheckCircle2} label="I've Shot This" activeColor="emerald" />
            <CommunityActionRow icon={Film} label="Track" activeColor="blue" />
            <CommunityActionRow icon={CirclePlus} label="Shootlist" activeColor="primary" />

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
          <div className="mt-4 rounded-[7px] border border-border/50 bg-card px-4 py-3">
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

