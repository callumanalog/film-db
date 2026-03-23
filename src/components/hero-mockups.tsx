"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
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
  ListPlus,
  CircleCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";
import { QuickActions } from "@/components/community-section";
import { AddReviewModal } from "@/components/add-review-modal";
import { InCameraDrawer } from "@/components/in-camera-drawer";
import { showToastViaEvent } from "@/components/toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUserActions } from "@/context/user-actions-context";
import { useFilmMobileTab, type FilmMobileTab } from "@/context/film-mobile-tab-context";
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
  priority = false,
}: {
  stock: HeroMockupProps["stock"];
  size?: number;
  width?: number;
  height?: number;
  priority?: boolean;
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
        priority={priority}
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
  starSize = "default",
}: {
  value: number;
  onChange: (value: number) => void;
  /** When set, clear (X) is shown when this is true and value > 0 (e.g. hover from parent row). */
  rowHover?: boolean;
  /** Star size: default 24px, sm 20px, xs 18px */
  starSize?: "default" | "sm" | "xs";
}) {
  const [hover, setHover] = useState(0);
  const [starsHover, setStarsHover] = useState(false);
  const sizeClass =
    starSize === "xs" ? "h-[18px] w-[18px]" : starSize === "sm" ? "h-5 w-5" : "h-6 w-6";

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
              className={`relative cursor-pointer ${sizeClass}`}
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
              <Star className={`absolute inset-0 fill-none stroke-[1.5] text-muted-foreground/50 ${sizeClass}`} />
              {full && (
                <Star className={`absolute inset-0 fill-primary text-primary ${sizeClass}`} />
              )}
              {half && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className={`${sizeClass} fill-primary text-primary`} />
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

/* ─── Mobile film detail hero ─── */

/**
 * Mobile film hero: sits below the header (no overlap). Unified carousel: slide 1 = stock can,
 * then community landscape shots. With no stock URL and no community, shows placeholder can only.
 */
export function FilmDetailMobileStickyBanner({
  stock,
}: Pick<HeroMockupProps, "stock">) {
  const { slug } = stock;
  const isWide = slug === "cinestill-800t";

  return (
    <div
      className={cn(
        "md:hidden sticky z-0 w-full max-w-none shrink-0 self-start",
        "border-b border-border/40 bg-white dark:bg-white"
      )}
      style={{ top: "calc(52px + env(safe-area-inset-top, 0px))" }}
    >
      <div className="relative w-full overflow-hidden">
        {stock.discontinued && (
          <span
            className="absolute left-3 top-3 z-20 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            aria-hidden
          >
            Discontinued
          </span>
        )}
        <div className="flex h-[220px] w-full shrink-0 items-center justify-center px-4 py-8">
          <div className={isWide ? "h-40 w-48 shrink-0" : "h-48 w-40 shrink-0"}>
            <FilmImage
              stock={stock}
              size={192}
              priority
              {...(isWide ? { width: 192, height: 160 } : {})}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const MOBILE_TABS: { id: FilmMobileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "scans", label: "Scans" },
  { id: "reviews", label: "Reviews" },
  { id: "lists", label: "Lists" },
];

const HEADER_HEIGHT = 52;

function FilmMobileTabBar() {
  const ctx = useFilmMobileTab();
  const navRef = useRef<HTMLElement>(null);
  if (!ctx) return null;
  const { activeTab, setActiveTab } = ctx;

  const handleTabClick = (tab: FilmMobileTab) => {
    setActiveTab(tab);
    if (tab !== "overview" && navRef.current) {
      const top = navRef.current.getBoundingClientRect().top + window.scrollY - HEADER_HEIGHT;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <nav ref={navRef} className="mt-8 w-full border-b border-border/50" aria-label="Film detail tabs">
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${MOBILE_TABS.length}, minmax(0, 1fr))` }}
      >
        {MOBILE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTabClick(t.id)}
            className={`relative py-3 text-center text-sm font-semibold transition-colors ${
              t.id === activeTab
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.id === activeTab && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

/**
 * Mobile title / meta / Shot It row + modals. Render inside the same sheet container as overview (film page).
 * Horizontal padding comes from the parent `max-w-6xl` wrapper.
 */
export function FilmDetailMobileToolbar({
  stock,
  stats,
}: HeroMockupProps & {
  stats?: FilmStockStatsProp | null;
}) {
  const { slug } = stock;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ctx = useMobileHeaderTitle();

  const {
    favouriteSlugs,
    toggleFavourite,
    inCameraSlugs,
    toggleInCamera,
    setRating: persistRating,
    ratings,
    shotSlugs,
    toggleShot,
  } = useUserActions();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<"review" | "upload">("review");
  const [inCameraDrawerOpen, setInCameraDrawerOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMoreSheetOpen(true);
    window.addEventListener("film-detail-more", handler);
    return () => window.removeEventListener("film-detail-more", handler);
  }, []);

  const didHandleUploadIntent = useRef(false);
  useEffect(() => {
    if (searchParams.get("action") !== "upload" || didHandleUploadIntent.current) return;
    didHandleUploadIntent.current = true;
    if (!user) {
      const returnPath = pathname ?? "/";
      const nextUrl = returnPath + (returnPath.includes("?") ? "&" : "?") + "action=upload";
      router.push(`/auth/sign-in?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    setReviewModalMode("upload");
    setReviewModalOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname ?? "/", { scroll: false });
  }, [user, searchParams, pathname, router]);

  const isFavourite = favouriteSlugs.includes(slug);
  const isInCamera = inCameraSlugs.includes(slug);
  const isShot = shotSlugs.includes(slug);
  const rating = ratings[slug] ?? 0;

  /** Mobile Shot It pill: off → mark shot + open review; on → unmark only (no sheet). */
  const handleShotItTogglePressed = (nextPressed: boolean) => {
    if (!nextPressed) {
      if (isShot) {
        toggleShot(slug);
        showToastViaEvent("Removed from stocks you've shot");
      }
      return;
    }
    if (!isShot) {
      toggleShot(slug);
      showToastViaEvent("Marked as shot");
    }
    setReviewModalMode("review");
    setReviewModalOpen(true);
  };

  const handleInCameraToggle = () => {
    if (isInCamera) {
      toggleInCamera(slug);
      showToastViaEvent("Removed from in camera");
    } else {
      setInCameraDrawerOpen(true);
    }
  };

  useEffect(() => {
    const el = titleRef.current;
    if (!el || !ctx) return;
    const observer = new IntersectionObserver(
      ([entry]) => ctx.setTitleScrolledPast(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ctx]);

  return (
    <>
      <div className="md:hidden bg-[#ffffff]">
        <h1
          ref={titleRef}
          className="text-left font-sans text-2xl font-bold leading-tight tracking-tight text-foreground"
        >
          {stock.name}
        </h1>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-relaxed text-muted-foreground">
          <span className="inline-flex shrink-0 items-center gap-1">
            <Star
              className="size-[1em] shrink-0 fill-amber-400 text-amber-400"
              aria-hidden
            />
            {stats?.avgRating != null ? (
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 font-semibold tabular-nums text-foreground underline decoration-muted-foreground/55 underline-offset-2 hover:text-primary hover:decoration-primary/80"
                aria-label="View reviews"
                onClick={() => {
                  /* TODO: navigate to reviews section */
                }}
              >
                {stats.avgRating.toFixed(1)}
              </button>
            ) : (
              <span className="tabular-nums">—</span>
            )}
          </span>
          <span className="shrink-0 select-none text-foreground" aria-hidden>
            ·
          </span>
          <span className="min-w-0 shrink-0 text-foreground">{stock.typeLabel}</span>
          <span className="shrink-0 select-none text-foreground" aria-hidden>
            ·
          </span>
          <span className="min-w-0 shrink-0 tabular-nums text-foreground">
            ISO {stock.iso != null ? stock.iso : "—"}
          </span>
          <span className="shrink-0 select-none text-foreground" aria-hidden>
            ·
          </span>
          <span className="min-w-0 max-w-full text-foreground">
            {(stock.format ?? []).length > 0 ? (stock.format ?? []).join(", ") : "—"}
          </span>
        </div>

        <div className="mt-5 w-full">
          <div className="grid w-full min-w-0 grid-cols-2 gap-2">
            <Toggle
              pressed={isShot}
              onPressedChange={(nextPressed) => {
                if (nextPressed) {
                  if (!isShot) {
                    toggleShot(slug);
                    showToastViaEvent("Marked as shot");
                  }
                  setMoreSheetOpen(true);
                } else {
                  toggleShot(slug);
                  showToastViaEvent("Removed from stocks you've shot");
                }
              }}
              className={cn(
                "!flex !min-w-0 !w-full !items-center !justify-center !gap-2 !rounded-full !border !text-sm !font-medium !transition-colors !h-11 !px-3 !bg-white hover:!bg-neutral-50 aria-pressed:!bg-white data-[state=on]:!bg-white !text-muted-foreground hover:!text-primary",
                isShot
                  ? "!border-primary aria-pressed:!border-primary"
                  : "!border-border/60 hover:!border-foreground/30"
              )}
            >
              {isShot ? (
                <span
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary"
                  aria-hidden
                >
                  <Check className="size-3 text-white" strokeWidth={3} />
                </span>
              ) : (
                <CircleCheck
                  className="size-5 shrink-0 text-muted-foreground group-hover/toggle:text-primary"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              Shot It
            </Toggle>
            <Toggle
              pressed={isFavourite}
              onPressedChange={() => {
                const { added } = toggleFavourite(slug);
                showToastViaEvent(added ? "Added to Shootlist" : "Removed from Shootlist");
              }}
              className={cn(
                "!flex !min-w-0 !w-full !items-center !justify-center !gap-2 !rounded-full !border !text-sm !font-medium !transition-colors !h-11 !px-3 !bg-white hover:!bg-neutral-50 aria-pressed:!bg-white data-[state=on]:!bg-white !text-muted-foreground hover:!text-primary",
                isFavourite
                  ? "!border-primary aria-pressed:!border-primary"
                  : "!border-border/60 hover:!border-foreground/30"
              )}
            >
              {isFavourite ? (
                <span
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary"
                  aria-hidden
                >
                  <Plus className="size-3 text-white" strokeWidth={3} />
                </span>
              ) : (
                <CirclePlus
                  className="size-5 shrink-0 text-muted-foreground group-hover/toggle:text-primary"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              Shootlist
            </Toggle>
          </div>
        </div>
        <FilmMobileTabBar />
      </div>

      <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="gap-0 px-0 pb-8">
          <SheetTitle className="sr-only">{stock.name} actions</SheetTitle>

          {/* Action icons row */}
          <div className="grid grid-cols-2 divide-x divide-border/40 pb-5 pt-4">
            <button
              type="button"
              className="flex flex-col items-center gap-1.5 py-1"
              onClick={() => {
                if (isShot) {
                  toggleShot(slug);
                  showToastViaEvent("Removed from stocks you've shot");
                } else {
                  toggleShot(slug);
                  showToastViaEvent("Marked as shot");
                }
              }}
            >
              {isShot ? (
                <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Check className="h-4 w-4 text-white" strokeWidth={3} />
                </span>
              ) : (
                <CircleCheck className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
              )}
              <span className="text-xs font-medium text-foreground">Shot It</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-1.5 py-1"
              onClick={() => {
                const { added } = toggleFavourite(slug);
                showToastViaEvent(added ? "Added to Shootlist" : "Removed from Shootlist");
              }}
            >
              {isFavourite ? (
                <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <Plus className="h-4 w-4 text-white" strokeWidth={3} />
                </span>
              ) : (
                <CirclePlus className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
              )}
              <span className="text-xs font-medium text-foreground">Shootlist</span>
            </button>
          </div>

          {/* Star rating */}
          <div className="border-t border-border/40 px-6 py-4">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const halfVal = star - 0.5;
                  const fullVal = star;
                  const isFull = rating >= fullVal;
                  const isHalf = !isFull && rating >= halfVal;

                  const applyRating = (val: number) => {
                    const newRating = rating === val ? 0 : val;
                    persistRating(slug, newRating);
                    if (newRating > 0) {
                      const label = Number.isInteger(newRating) ? `${newRating}` : `${newRating}`;
                      showToastViaEvent(`Rated ${label} star${newRating > 1 ? "s" : ""}`);
                    } else {
                      showToastViaEvent("Rating cleared");
                    }
                  };

                  return (
                    <div key={star} className="relative h-8 w-8 p-0.5">
                      {/* Visual star */}
                      <div className="pointer-events-none relative h-7 w-7">
                        <Star className={cn(
                          "h-7 w-7 transition-colors",
                          isFull ? "fill-primary text-primary" : "fill-none text-muted-foreground/30"
                        )} />
                        {isHalf && (
                          <StarHalf className="absolute inset-0 h-7 w-7 fill-primary text-primary" />
                        )}
                      </div>
                      {/* Left half tap target */}
                      <button
                        type="button"
                        className="absolute inset-y-0 left-0 w-1/2"
                        onClick={() => applyRating(halfVal)}
                        aria-label={`Rate ${halfVal} stars`}
                      />
                      {/* Right half tap target */}
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 w-1/2"
                        onClick={() => applyRating(fullVal)}
                        aria-label={`Rate ${fullVal} star${fullVal > 1 ? "s" : ""}`}
                      />
                    </div>
                  );
                })}
              </div>
              <span className="text-xs text-muted-foreground">Your rating</span>
            </div>
          </div>

          {/* Action list */}
          <div className="border-t border-border/40">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              onClick={() => {
                setMoreSheetOpen(false);
                setReviewModalMode("review");
                setReviewModalOpen(true);
              }}
            >
              <Pencil className="h-5 w-5 text-muted-foreground" />
              Write a review...
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              onClick={() => {
                setMoreSheetOpen(false);
                setReviewModalMode("upload");
                setReviewModalOpen(true);
              }}
            >
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              Add scans...
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              onClick={() => {
                setMoreSheetOpen(false);
                handleInCameraToggle();
              }}
            >
              <Camera className="h-5 w-5 text-muted-foreground" />
              {isInCamera ? "Remove from In Camera..." : "Mark as In Camera..."}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              onClick={() => {
                setMoreSheetOpen(false);
                showToastViaEvent("Add to list coming soon");
              }}
            >
              <ListPlus className="h-5 w-5 text-muted-foreground" />
              Add to lists...
            </button>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={() => setMoreSheetOpen(false)}
            className="mx-4 mt-2 w-[calc(100%-2rem)] border-t border-border/40 pt-3 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Close
          </button>
        </SheetContent>
      </Sheet>

      <InCameraDrawer
        open={inCameraDrawerOpen}
        onOpenChange={setInCameraDrawerOpen}
        stockName={stock.name}
        stockFormats={stock.format ?? []}
        onSave={(metadata) => {
          toggleInCamera(slug, metadata);
          setInCameraDrawerOpen(false);
          showToastViaEvent("Marked as in camera");
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
            if (payload.shootingTip) formData.set("shooting_tip", payload.shootingTip);
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
            if (payload.bestFor?.length) formData.set("best_for", JSON.stringify(payload.bestFor));
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
              if (data.reviewSaved) {
                window.dispatchEvent(new CustomEvent("review-submitted", { detail: { slug } }));
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
    </>
  );
}

/* ─── Sticky Left Pane ─── */

export function StickyLeftPane({
  stock,
  stats,
}: HeroMockupProps & { stats?: FilmStockStatsProp | null }) {
  const { slug } = stock;
  const {
    favouriteSlugs,
    toggleFavourite,
    inCameraSlugs,
    toggleInCamera,
    setRating: persistRating,
    ratings,
    shotSlugs,
    toggleShot,
  } = useUserActions();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewModalMode, setReviewModalMode] = useState<"review" | "upload">("review");
  const [inCameraDrawerOpen, setInCameraDrawerOpen] = useState(false);

  // Intent continuity: ?action=upload opens upload modal directly
  const didHandleUploadIntent = useRef(false);
  useEffect(() => {
    if (searchParams.get("action") !== "upload" || didHandleUploadIntent.current) return;
    didHandleUploadIntent.current = true;
    if (!user) {
      const returnPath = pathname ?? "/";
      const nextUrl = returnPath + (returnPath.includes("?") ? "&" : "?") + "action=upload";
      router.push(`/auth/sign-in?next=${encodeURIComponent(nextUrl)}`);
      return;
    }
    setReviewModalMode("upload");
    setReviewModalOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("action");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname ?? "/", { scroll: false });
  }, [user, searchParams, pathname, router]);

  const isFavourite = favouriteSlugs.includes(slug);
  const isInCamera = inCameraSlugs.includes(slug);
  const isShot = shotSlugs.includes(slug);
  const rating = ratings[slug] ?? 0;

  const handleRatingChange = (value: number) => {
    persistRating(slug, value);
    if (value > 0 && !shotSlugs.includes(slug)) {
      toggleShot(slug);
      showToastViaEvent("Added to stocks you've shot");
    }
  };

  const display = {
    avgRating: stats?.avgRating ?? null,
    shotByCount: stats?.shotByCount ?? 0,
    shotsCount: stats?.shotsCount ?? 0,
  };

  const handleShotIt = () => {
    if (!isShot) {
      toggleShot(slug);
      showToastViaEvent("Marked as shot");
    }
    setReviewModalMode("review");
    setReviewModalOpen(true);
  };

  const handleInCameraToggle = () => {
    if (isInCamera) {
      toggleInCamera(slug);
      showToastViaEvent("Removed from in camera");
    } else {
      setInCameraDrawerOpen(true);
    }
  };

  return (
    <div className="w-full min-w-0 flex flex-col md:w-56 md:min-w-[14rem] md:shrink-0 md:self-start md:overflow-visible">
      <div className="grid grid-cols-1 gap-4">
      <div className="flex min-w-0 flex-col gap-3">
      <div className="relative mx-auto hidden w-full min-w-0 max-w-sm overflow-hidden rounded-[7px] border border-border/50 bg-white md:mx-0 md:block md:max-w-none md:w-full">
        {/* Image — desktop only */}
        <div className="relative hidden md:block">
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
                priority
                {...(slug === "cinestill-800t" ? { width: 192, height: 160 } : {})}
              />
            </div>
          </div>
        </div>

        {/* Stats row — mobile version is in MobileFilmActionRow area */}
        <div className="hidden md:grid grid-cols-3 gap-2 border-t border-border/50 bg-card px-3 py-3">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="text-base font-semibold tracking-tight text-foreground">{display.shotByCount}</span>
            </div>
            <span className="mt-0.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Shot It</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-1.5">
              <Star className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
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

        {/* Action buttons — hidden on mobile (shown in MobileFilmActions) */}
        <div className="hidden md:block border-t border-border/50 bg-card px-3 py-3">
          {/* Tier 1: Shootlist + In Camera toggles */}
          <div className="grid w-full grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const { added } = toggleFavourite(slug);
                showToastViaEvent(added ? "Added to Shootlist" : "Removed from Shootlist");
              }}
              aria-pressed={isFavourite}
              className={`flex min-w-0 w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                isFavourite
                  ? "border-primary bg-transparent text-muted-foreground hover:bg-muted/40"
                  : "border-border/60 bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {isFavourite ? (
                <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Plus className="size-2 text-white" strokeWidth={3} />
                </span>
              ) : (
                <CirclePlus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
              )}
              Shootlist
            </button>
            <button
              type="button"
              onClick={handleInCameraToggle}
              aria-pressed={isInCamera}
              className={`flex min-w-0 w-full items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                isInCamera
                  ? "border-blue-500 bg-blue-500/10 text-blue-600"
                  : "border-border/60 bg-card text-muted-foreground hover:border-blue-400/40 hover:text-foreground"
              }`}
            >
              <Camera className={`h-3.5 w-3.5 shrink-0 ${isInCamera ? "text-blue-500" : ""}`} aria-hidden />
              In camera
            </button>
          </div>

          {/* Tier 2: Shot It CTA */}
          <button
            type="button"
            onClick={handleShotIt}
            className={`mt-2.5 flex w-full items-center justify-center gap-2 border-2 py-3 text-sm font-semibold transition-colors ${
              isShot
                ? "border-primary bg-transparent text-muted-foreground hover:bg-muted/40"
                : "border-transparent bg-foreground text-background hover:bg-foreground/90"
            } rounded-[7px]`}
          >
            {isShot ? (
              <>
                <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Check className="size-2.5 text-white" strokeWidth={3} />
                </span>
                Shot — Add review or shots
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 shrink-0 text-background" aria-hidden />
                Shot it
              </>
            )}
          </button>
        </div>
      </div>

      </div>
      </div>

      <InCameraDrawer
        open={inCameraDrawerOpen}
        onOpenChange={setInCameraDrawerOpen}
        stockName={stock.name}
        stockFormats={stock.format ?? []}
        onSave={(metadata) => {
          toggleInCamera(slug, metadata);
          setInCameraDrawerOpen(false);
          showToastViaEvent("Marked as in camera");
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
            if (payload.shootingTip) formData.set("shooting_tip", payload.shootingTip);
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
            if (payload.bestFor?.length) formData.set("best_for", JSON.stringify(payload.bestFor));
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
              if (data.reviewSaved) {
                window.dispatchEvent(new CustomEvent("review-submitted", { detail: { slug } }));
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
}: HeroMockupProps & { stats?: FilmStockStatsProp | null }) {
  const { slug } = stock;
  const { shotSlugs, setRating: persistRating, ratings, toggleShot } = useUserActions();
  const rating = ratings[slug] ?? 0;
  const isShot = shotSlugs.includes(slug);
  const [ratingRowHover, setRatingRowHover] = useState(false);

  const handleRatingChange = (value: number) => {
    persistRating(slug, value);
    if (value > 0 && !isShot) {
      toggleShot(slug);
      showToastViaEvent("Added to stocks you've shot");
    }
  };

  const typeLabel = stock.typeLabel ?? "—";
  const isoStr = stock.iso != null ? `ISO ${stock.iso}` : "ISO —";
  const formatStr = (stock.format ?? []).join(", ") || "—";
  const metaLine = `${typeLabel} | ${isoStr} | ${formatStr}`;

  return (
      <div
        className="@container mb-0 flex min-w-0 flex-wrap flex-col gap-x-8 gap-y-5 md:flex-row items-center md:items-start @[28rem]:items-center pt-6"
        data-header-content
      >
        <div className="min-w-0 w-fit flex flex-col items-center md:items-start gap-2">
          <h1 className="w-fit font-sans text-3xl font-bold tracking-tight sm:text-4xl md:text-left text-center">
            {stock.name}
          </h1>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {metaLine}
          </p>
          {rating > 0 && (
            <div
              className="flex flex-col items-center md:items-start"
              onMouseEnter={() => setRatingRowHover(true)}
              onMouseLeave={() => setRatingRowHover(false)}
            >
              <UserStarRating value={rating} onChange={handleRatingChange} rowHover={ratingRowHover} starSize="xs" />
            </div>
          )}
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
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-sans">
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

