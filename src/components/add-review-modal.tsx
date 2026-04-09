"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  Star,
  StarHalf,
  Camera,
  XIcon,
  ImagePlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Loader2,
  Bold,
  Italic,
  Quote,
  Strikethrough,
  MapPin,
  Aperture,
  Building2,
  ScanLine,
  Gauge,
  Film,
  FlaskConical,
  CalendarDays,
  Tags,
} from "lucide-react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { topLeftNavChevronIconClassName, topLeftNavIconButtonClassName, topRightNavIconButtonClassName } from "@/lib/top-left-nav-icon";
import {
  mobileHeaderLeadingRowClassName,
  mobileHeaderSafeAreaStyle,
  mobileHeaderShellClassName,
  mobileHeaderTitleBlockClassName,
  mobileHeaderTitleClassName,
} from "@/lib/mobile-header";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScanReviewThumb } from "@/components/scan-review-thumb";
import { TextField } from "@/components/ui/text-field";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShotDateCalendarDrawerContent } from "@/components/shot-date-calendar-drawer-content";
import { ShareRollLocationSheet } from "@/components/share-roll-location-sheet";
import { ShareRollLensSheet } from "@/components/share-roll-lens-sheet";
import { ShareRollFormatSheet } from "@/components/share-roll-format-sheet";
import { ShareRollIsoSheet } from "@/components/share-roll-iso-sheet";
import type { LucideIcon } from "lucide-react";
import { nearestPresetIso } from "@/components/shot-iso-controls";
import { ShareRollCameraPicker } from "@/components/share-roll-camera-picker";
import { ShareRollLabPicker } from "@/components/share-roll-lab-picker";
import { ShareRollScannerPicker } from "@/components/share-roll-scanner-picker";
import { ShareRollTagsPicker } from "@/components/share-roll-tags-picker";
import { scanUploadDashedSurfaceClassName } from "@/components/share-roll-picker-primitives";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import {
  assertFileDecodesAsImage,
  prepareShareRollImageFile,
  type PreparedShareRollImage,
} from "@/lib/share-roll-image";
import { humanizeImageDecodeError, humanizeImagePrepareError } from "@/lib/share-roll-image-errors";
import { uploadPreparedShareRollScanToStorage, type ClientStoredScanRow } from "@/lib/user-reviews-client-submit";
import { getFilmStockFormatListForSlug } from "@/app/actions/get-film-stocks";
import { filmLabPublicLabel } from "@/lib/film-lab-queries";
import type { BestFor } from "@/lib/types";
import { BEST_FOR_LABELS } from "@/lib/types";
import { BEST_FOR_ICONS } from "@/components/best-for-section";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapPlaceholder from "@tiptap/extension-placeholder";
import { useAuth } from "@/context/auth-context";

export interface TrackFilmModalStock {
  slug: string;
  name: string;
  brand: { name: string; slug: string };
  format: string[];
  image_url: string | null;
  /** Box / native ISO when known — used as the default "Shot at ISO" stepper value. */
  iso?: number | null;
}

/** Dedupe while preserving order (matches film detail “Format” line). */
function uniqueFormatsInOrder(formats: string[] | undefined): string[] {
  if (!formats?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of formats) {
    const t = typeof f === "string" ? f.trim() : "";
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function defaultFormatSelection(formats: string[] | undefined): string {
  const list = uniqueFormatsInOrder(formats);
  const preferred = list.find((f) => f.replace(/\s+/g, "").toLowerCase() === "35mm");
  if (preferred) return preferred;
  return list[0] ?? "";
}

function defaultShotIsoForStock(stock: TrackFilmModalStock): string {
  if (stock.iso != null && Number.isFinite(stock.iso) && stock.iso > 0) {
    return String(nearestPresetIso(Math.round(stock.iso)));
  }
  return "400";
}

function formatTagsForMetadataRow(tagsValue: string): string {
  if (!tagsValue.trim()) return "";
  return tagsValue
    .split(",")
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, ""))
    .filter(Boolean)
    .map((tag) => `#${tag}`)
    .join(" ");
}

/** `YYYY-MM-DD` → readable label for metadata row (local timezone midday avoids DST edge cases). */
function formatShotDateRowDisplay(isoDate: string): string {
  const t = isoDate.trim();
  if (!t) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const d = new Date(`${t}T12:00:00`);
  if (Number.isNaN(d.getTime())) return t;
  try {
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return t;
  }
}

function step3PreviewGridClassName(previewCount: number): string {
  if (previewCount <= 2) return "grid-cols-2";
  if (previewCount === 3) return "grid-cols-3";
  if (previewCount === 4) return "grid-cols-4";
  return "grid-cols-5";
}

/** Title: bottom rule only (no top line); pairs with description having no borders so one seam between them. */
const step3ShareRollTitleBorderClassName =
  "border-[0.5px] border-x-0 border-t-0 border-b border-border/40 dark:border-white/15";

/** Hairlines: outer top/bottom + explicit line between each metadata row (`border-0` on rows would hide these). */
const step3MetadataListClassName = cn(
  "-mx-4 flex flex-col",
  "border-t-[0.5px] border-b-[0.5px] border-border/40 dark:border-white/15",
  "[&>button+button]:border-t-[0.5px] [&>button+button]:border-border/40 dark:[&>button+button]:border-white/15"
);

const step3MetadataNavRowClassName = cn(
  "flex h-[50px] min-h-[50px] w-full items-center gap-3 pl-4 pr-4 text-left transition-colors",
  "hover:bg-secondary/70 active:bg-secondary dark:hover:bg-secondary/50 dark:active:bg-secondary/70"
);

const step3MetadataStackedLabelClassName =
  "text-[10px] font-normal leading-tight text-muted-foreground";

const step3MetadataStackedRowClassName = cn(
  step3MetadataNavRowClassName,
  "h-auto min-h-[50px] items-center py-2.5"
);

function Step3MetadataNavRow({
  icon: Icon,
  placeholderLabel = "",
  value,
  onNavigate,
  /** Fixed label on the left; current value sits right-aligned next to the chevron (Instagram-style audience row). */
  fixedLeftLabel,
  /** Use tabular figures for the trailing value (e.g. ISO digits). */
  valueTabular,
  /** When false, empty value shows nothing instead of an em dash (e.g. Camera). */
  showDashWhenEmpty = true,
}: {
  icon: LucideIcon;
  placeholderLabel?: string;
  value: string;
  onNavigate: () => void;
  fixedLeftLabel?: string;
  valueTabular?: boolean;
  showDashWhenEmpty?: boolean;
}) {
  const trimmed = value.trim();
  const hasValue = trimmed.length > 0;

  const stackedValueClassName = cn(
    "truncate text-sm font-normal leading-tight text-foreground",
    valueTabular && "tabular-nums"
  );

  if (fixedLeftLabel) {
    const display = hasValue ? trimmed : showDashWhenEmpty ? "—" : "";

    if (hasValue) {
      return (
        <button type="button" className={step3MetadataStackedRowClassName} onClick={onNavigate}>
          <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
            <div className={step3MetadataStackedLabelClassName}>{fixedLeftLabel}</div>
            <div className={stackedValueClassName}>{trimmed}</div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
        </button>
      );
    }

    return (
      <button type="button" className={step3MetadataNavRowClassName} onClick={onNavigate}>
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="shrink-0 text-sm font-normal text-muted-foreground">{fixedLeftLabel}</span>
        <span className="min-w-0 flex-1" aria-hidden />
        <span
          className={cn(
            "max-w-[min(12rem,45%)] shrink-0 truncate text-right text-sm font-normal",
            hasValue ? "text-foreground" : "text-muted-foreground",
            valueTabular && "tabular-nums"
          )}
        >
          {display}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
      </button>
    );
  }

  if (hasValue && placeholderLabel) {
    return (
      <button type="button" className={step3MetadataStackedRowClassName} onClick={onNavigate}>
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
          <div className={step3MetadataStackedLabelClassName}>{placeholderLabel}</div>
          <div className={stackedValueClassName}>{trimmed}</div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
      </button>
    );
  }

  return (
    <button type="button" className={step3MetadataNavRowClassName} onClick={onNavigate}>
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm font-normal text-muted-foreground">
        {placeholderLabel}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
    </button>
  );
}

type Step3MetadataSubpage = "tags" | "camera" | "lab" | "scanner";

const STEP3_METADATA_SUBPAGE_LABELS: Record<Step3MetadataSubpage, string> = {
  tags: "Tags",
  camera: "Camera",
  lab: "Lab",
  scanner: "Scanner",
};

function Step3CompactNavBar({
  title,
  onBack,
  onClose,
  showClose = true,
}: {
  title: string;
  onBack: () => void;
  onClose?: () => void;
  /** When false, hides the X (e.g. metadata sub-drawer: use Back only). */
  showClose?: boolean;
}) {
  return (
    <header className={mobileHeaderShellClassName} style={mobileHeaderSafeAreaStyle}>
      <div className={mobileHeaderLeadingRowClassName}>
        <button
          type="button"
          onClick={onBack}
          className={cn(
            topLeftNavIconButtonClassName,
            "shrink-0 text-muted-foreground hover:text-foreground"
          )}
          aria-label="Back"
        >
          <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-left font-sans text-lg font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h1>
        {showClose && onClose ? (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              topRightNavIconButtonClassName,
              "shrink-0 text-muted-foreground hover:text-foreground"
            )}
            aria-label="Close"
          >
            <XIcon className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-[44px] shrink-0" aria-hidden />
        )}
      </div>
    </header>
  );
}

const BEST_FOR_OPTIONS: BestFor[] = [
  "general_purpose", "portrait", "street", "landscapes", "architecture", "documentary",
  "sports", "travel", "weddings", "studio", "bright_sun", "golden_hour", "low_light",
  "artificial_light", "experimental",
];

/** Lets React paint between sequential scan imports so progress UI updates. */
function yieldToNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export interface AddReviewModalPayload {
  rating: number;
  reviewText: string;
  /** Always `[]` from this modal; kept for typing only. Scans use `clientStoredScanImages`. */
  files: File[];
  camera?: string;
  reviewTitle?: string;
  bestFor?: BestFor[];
  format?: string;
  location?: string;
  iso?: string;
  lens?: string;
  developedAt?: string;
  caption?: string;
  /** `YYYY-MM-DD` from date picker; stored as `user_uploads.shot_date`. */
  shotDate?: string;
  /** Comma-separated; stored as `user_uploads.tags` (max 500 chars). */
  tags?: string;
  shotIso?: string;
  lab?: string;
  scanner?: string;
  /**
   * Share-roll step 2: scans already in Supabase Storage (public URLs). The only client image path for new content.
   */
  clientStoredScanImages?: { url: string; width: number; height: number }[];
  /** PATCH: update share-roll title + `user_uploads` metadata only (no new files). */
  shareRollMetadataOnly?: boolean;
}

/** Open share-roll step 3 to edit an existing roll (same `review_id` on all scans). */
export type EditShareRollSeed = {
  rollId?: string | null;
  reviewId: string;
  /** Present when the roll was grouped by batch in the feed; used to sync patches when `review_id` is missing on rows. */
  uploadBatchId?: string | null;
  imageUrls: string[];
  imageWidths: (number | null)[];
  imageHeights: (number | null)[];
  rollName: string;
  caption: string;
  camera: string;
  lens: string;
  location: string;
  shotDate: string;
  tags: string;
  lab: string;
  scanner: string;
  shotIso: string;
  selectedFormat: string;
};

/** Pre-fill when editing an existing review (text-only flow). */
export interface EditReviewSeed {
  id: string;
  rating: number;
  review_text: string | null;
  best_for: string[];
}

interface AddReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AddReviewModalPayload) => void | Promise<void | { success?: boolean }>;
  stock: TrackFilmModalStock;
  initialRating?: number;
  mode?: "review" | "upload";
  slotsUsed?: number;
  /** When set, modal opens in edit mode (same flow as create, pre-filled). */
  edit?: EditReviewSeed | null;
  /** When set with `mode="upload"`, opens directly on share-roll step 3 for metadata edits. */
  editShareRoll?: EditShareRollSeed | null;
  onBackToStockPicker?: () => void;
  /** While share-roll step 3 is submitting, overrides the default “Sharing…” / “Saving…” label (e.g. parent sets “Saving…” from `onProgress` right before `fetch`). */
  shareRollSubmitHint?: string | null;
  /** Raise sheet z-index above e.g. z-[100] full-screen lightbox. */
  stackAboveLightbox?: boolean;
}

function StockThumbnail({
  stock,
  size = "md",
}: {
  stock: TrackFilmModalStock;
  /** `sm` for step 3 share roll (less visual weight vs user scans). */
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? 48 : 64;
  if (stock.image_url) {
    return (
      <Image
        src={stock.image_url}
        alt={stock.name}
        width={px}
        height={px}
        sizes={`${px}px`}
        quality={90}
        className="h-full w-full object-contain"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <Camera
        className={cn(
          "text-muted-foreground/40",
          size === "sm" ? "h-5 w-5" : "h-6 w-6"
        )}
      />
    </div>
  );
}

function HalfStarRating({
  value,
  onChange,
  size = 32,
  readonly = false,
}: {
  value: number;
  onChange: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const halfVal = star - 0.5;
        const fullVal = star;
        const isFull = value >= fullVal;
        const isHalf = !isFull && value >= halfVal;

        const apply = (val: number) => onChange(value === val ? 0 : val);

        return (
          <div key={star} className="relative" style={{ width: size, height: size, padding: 2 }}>
            <div className="pointer-events-none relative" style={{ width: size - 4, height: size - 4 }}>
              <Star
                className={cn(
                  "transition-colors",
                  isFull ? "fill-primary text-primary" : "fill-none text-muted-foreground/25"
                )}
                style={{ width: size - 4, height: size - 4 }}
              />
              {isHalf && (
                <StarHalf
                  className="absolute inset-0 fill-primary text-primary"
                  style={{ width: size - 4, height: size - 4 }}
                />
              )}
            </div>
            {!readonly && (
              <>
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 w-1/2"
                  onClick={() => apply(halfVal)}
                  aria-label={`Rate ${halfVal} stars`}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 w-1/2"
                  onClick={() => apply(fullVal)}
                  aria-label={`Rate ${fullVal} star${fullVal > 1 ? "s" : ""}`}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function mapPreviewIndexAfterReorder(i: number, from: number, to: number): number {
  if (i === from) return to;
  if (from < to && i > from && i <= to) return i - 1;
  if (from > to && i >= to && i < from) return i + 1;
  return i;
}

function setScanIntrinsicAtIndex(
  i: number,
  w: number,
  h: number
): (prev: ({ w: number; h: number } | null)[]) => ({ w: number; h: number } | null)[] {
  return (sizes) => {
    const next = [...sizes];
    while (next.length <= i) next.push(null);
    next[i] = { w, h };
    return next;
  };
}

/** Step 3 grid: press-and-hold then drag to reorder (no handle icon). */
function Step3SortableScanCell({
  id,
  index,
  url,
  errorMessage,
  fileName,
  onTapPreview,
}: {
  id: string;
  index: number;
  url: string | null;
  errorMessage?: string | null;
  fileName?: string;
  onTapPreview: (index: number) => void;
}) {
  const failed = Boolean(errorMessage);
  const ready = Boolean(url) && !failed;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !ready,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative aspect-square min-w-0 w-full touch-none overflow-hidden rounded-[7px] border border-border/50 bg-muted/10 p-0 text-left ring-offset-background transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "z-50 opacity-95 shadow-lg",
        !ready && "opacity-100"
      )}
      onClick={() => {
        if (ready) onTapPreview(index);
      }}
      {...attributes}
      {...listeners}
      aria-label={
        failed
          ? `Scan ${index + 1} failed to add`
          : `Preview scan ${index + 1}. Press and hold to reorder.`
      }
    >
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-0.5 bg-destructive/5 p-1 text-center">
          <span className="text-[9px] font-semibold leading-tight text-destructive">Error</span>
          {fileName ? (
            <span className="line-clamp-1 w-full text-[8px] text-muted-foreground">{fileName}</span>
          ) : null}
          {errorMessage ? (
            <span className="line-clamp-3 w-full text-[7px] leading-snug text-muted-foreground" title={errorMessage}>
              {errorMessage}
            </span>
          ) : null}
        </div>
      ) : url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={url} alt="" className="pointer-events-none h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
        </div>
      )}
    </button>
  );
}

export function AddReviewModal({
  open,
  onOpenChange,
  onSubmit,
  stock,
  initialRating = 0,
  mode = "review",
  edit = null,
  editShareRoll = null,
  onBackToStockPicker,
  shareRollSubmitHint = null,
  stackAboveLightbox = false,
}: AddReviewModalProps) {
  const isEdit = !!edit;
  const isEditShareRoll = !!editShareRoll;
  const enteredViaUpload = mode === "upload" && !isEdit && !isEditShareRoll;
  /** Upload + edit-roll use step 2/3 UI; only pure review / text-review edit uses step 1. */
  const showFilmStockTextReview = !enteredViaUpload && !isEditShareRoll;
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(() =>
    isEditShareRoll ? 3 : enteredViaUpload ? 2 : 1
  );

  // Step 1 fields
  const [rating, setRating] = useState(initialRating);
  const [bestFor, setBestFor] = useState<BestFor[]>([]);
  const [camera, setCamera] = useState("");
  const [rollName, setRollName] = useState("");

  const REVIEW_MAX_LENGTH = 10_000;
  const CAPTION_MAX_LENGTH = 10000;
  const TAGS_MAX_LENGTH = 500;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        listItem: false,
        bulletList: false,
        orderedList: false,
      }),
      TiptapPlaceholder.configure({
        placeholder:
          "What was your experience with this stock? Include any shooting tips you may have for this stock.",
      }),
    ],
    editorProps: {
      attributes: {
        class: "review-editor min-h-[120px] px-3 py-2.5 text-sm focus:outline-none",
      },
    },
    content: "",
  });

  // Step 2 fields
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);
  /** naturalWidth / naturalHeight per scan index — used to match in-grid “add” tile aspect to the neighbor shot. */
  const [scanIntrinsicSizes, setScanIntrinsicSizes] = useState<
    ({ w: number; h: number } | null)[]
  >([]);
  /** Stable row ids for step 3 drag-reorder (aligned with files / previewUrls). */
  const [uploadScanOrderIds, setUploadScanOrderIds] = useState<string[]>([]);
  /** Per-slot decode/prepare failure message (aligned with `files` / `previewUrls`). */
  const [scanSlotErrors, setScanSlotErrors] = useState<(string | null)[]>([]);
  /** Per scan: public Storage row after step-2 upload (aligned with `files`). */
  const [storedScanRows, setStoredScanRows] = useState<(ClientStoredScanRow | null)[]>([]);
  const uploadScanOrderIdsRef = useRef<string[]>([]);
  /** Prevents reset when `resetAll` churns (e.g. inline `stock={{…}}` on parent re-renders during submit). */
  const createModalWasOpenRef = useRef(false);
  uploadScanOrderIdsRef.current = uploadScanOrderIds;
  const step3SortSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  /** Resolved via same loader as film detail page; avoids stale list/search payloads missing sheet sizes. */
  const [fetchedFormats, setFetchedFormats] = useState<string[] | null>(null);
  const stockFormatKey = JSON.stringify(stock.format ?? []);
  const formatOptions = useMemo(() => {
    const fromProps = stock.format ?? [];
    const source =
      fetchedFormats != null && fetchedFormats.length > 0 ? fetchedFormats : fromProps;
    return uniqueFormatsInOrder(source);
  }, [fetchedFormats, stockFormatKey]);

  const [selectedFormat, setSelectedFormat] = useState(() => defaultFormatSelection(stock.format));

  const [lens, setLens] = useState("");
  const [shotIso, setShotIso] = useState(() => defaultShotIsoForStock(stock));
  const [location, setLocation] = useState("");
  const [shotDate, setShotDate] = useState("");
  const [tags, setTags] = useState("");
  const metadataTagsValue = useMemo(() => formatTagsForMetadataRow(tags), [tags]);
  const [lab, setLab] = useState("");
  const [scanner, setScanner] = useState("");
  const [caption, setCaption] = useState("");
  /** Step 2 / 3: full-bleed preview when tapping a scan thumbnail. */
  const [step2ScanPreviewIndex, setStep2ScanPreviewIndex] = useState<number | null>(null);
  const [step3ImagePreviewIndex, setStep3ImagePreviewIndex] = useState<number | null>(null);
  const scanPreviewIndex = step2ScanPreviewIndex ?? step3ImagePreviewIndex;

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const step3CaptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [step3MetadataSubpage, setStep3MetadataSubpage] = useState<Step3MetadataSubpage | null>(null);
  const [dateShotSheetOpen, setDateShotSheetOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [lensSheetOpen, setLensSheetOpen] = useState(false);
  const [formatSheetOpen, setFormatSheetOpen] = useState(false);
  const [isoSheetOpen, setIsoSheetOpen] = useState(false);

  const MAX_SHOT_SIZE_BYTES = 50 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  const resetAll = useCallback(() => {
    setStep(isEditShareRoll ? 3 : enteredViaUpload ? 2 : 1);
    setRating(initialRating);
    editor?.commands.clearContent();
    setCamera("");
    setRollName("");
    setBestFor([]);
    setFiles([]);
    setScanIntrinsicSizes([]);
    setUploadScanOrderIds([]);
    setScanSlotErrors([]);
    setStoredScanRows([]);
    setPreviewUrls((urls) => {
      urls.forEach((u) => {
        if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      });
      return [];
    });
    setCaption("");
    setSelectedFormat(defaultFormatSelection(stock.format));
    setLens("");
    setShotIso(defaultShotIsoForStock(stock));
    setLocation("");
    setShotDate("");
    setTags("");
    setLab("");
    setScanner("");
    setStep2ScanPreviewIndex(null);
    setStep3ImagePreviewIndex(null);
    setIsUploading(false);
    setUploadError(null);
    setSubmitting(false);
    setStep3MetadataSubpage(null);
    setDateShotSheetOpen(false);
    setLocationSheetOpen(false);
    setLensSheetOpen(false);
    setFormatSheetOpen(false);
    setIsoSheetOpen(false);
  }, [enteredViaUpload, isEditShareRoll, initialRating, editor, stock]);

  useEffect(() => {
    if (!open) {
      setDateShotSheetOpen(false);
      setLocationSheetOpen(false);
      setLensSheetOpen(false);
      setFormatSheetOpen(false);
      setIsoSheetOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !stock.slug) {
      setFetchedFormats(null);
      return;
    }
    let cancelled = false;
    getFilmStockFormatListForSlug(stock.slug)
      .then((formats) => {
        if (!cancelled) setFetchedFormats(formats);
      })
      .catch(() => {
        if (!cancelled) setFetchedFormats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, stock.slug]);

  useEffect(() => {
    if (formatOptions.length === 0) return;
    setSelectedFormat((prev) =>
      prev && formatOptions.includes(prev) ? prev : defaultFormatSelection(formatOptions)
    );
  }, [formatOptions]);

  useEffect(() => {
    if (edit) {
      createModalWasOpenRef.current = open;
      return;
    }
    if (!open) {
      createModalWasOpenRef.current = false;
      return;
    }
    if (isEditShareRoll) {
      createModalWasOpenRef.current = true;
      return;
    }
    if (!createModalWasOpenRef.current) {
      resetAll();
    }
    createModalWasOpenRef.current = true;
  }, [open, edit, isEditShareRoll, resetAll]);

  useEffect(() => {
    if (!open || !editShareRoll) return;
    setStep(3);
    setRollName(editShareRoll.rollName);
    setCaption(editShareRoll.caption);
    setCamera(editShareRoll.camera);
    setLens(editShareRoll.lens);
    setLocation(editShareRoll.location);
    setShotDate(editShareRoll.shotDate);
    setTags(editShareRoll.tags);
    setLab(editShareRoll.lab);
    setScanner(editShareRoll.scanner);
    setShotIso(editShareRoll.shotIso);
    if (editShareRoll.selectedFormat.trim()) {
      setSelectedFormat(editShareRoll.selectedFormat);
    }
    setFiles([]);
    setPreviewUrls([...editShareRoll.imageUrls]);
    setUploadScanOrderIds(editShareRoll.imageUrls.map(() => crypto.randomUUID()));
    setScanIntrinsicSizes(
      editShareRoll.imageUrls.map((_, i) => {
        const w = editShareRoll.imageWidths[i] ?? null;
        const h = editShareRoll.imageHeights[i] ?? null;
        return w != null && h != null && w > 0 && h > 0 ? { w, h } : null;
      })
    );
    setStep2ScanPreviewIndex(null);
    setStep3ImagePreviewIndex(null);
    setStep3MetadataSubpage(null);
    setUploadError(null);
    setScanSlotErrors([]);
    setStoredScanRows([]);
    setIsUploading(false);
    setSubmitting(false);
  }, [open, editShareRoll]);

  useEffect(() => {
    if (!open || !edit) return;
    setStep(1);
    setRating(edit.rating > 0 ? Number(edit.rating) : 0);
    setBestFor((edit.best_for as BestFor[]) ?? []);
    setCamera("");
    setRollName("");
    setFiles([]);
    setScanIntrinsicSizes([]);
    setUploadScanOrderIds([]);
    setScanSlotErrors([]);
    setStoredScanRows([]);
    setPreviewUrls((urls) => {
      urls.forEach((u) => {
        if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      });
      return [];
    });
    setCaption("");
    setSelectedFormat(defaultFormatSelection(stock.format));
    setLens("");
    setShotIso(defaultShotIsoForStock(stock));
    setLocation("");
    setShotDate("");
    setTags("");
    setLab("");
    setScanner("");
    setStep2ScanPreviewIndex(null);
    setStep3ImagePreviewIndex(null);
    setIsUploading(false);
    setUploadError(null);
    setSubmitting(false);
    setStep3MetadataSubpage(null);
    setDateShotSheetOpen(false);
    setLocationSheetOpen(false);
    setLensSheetOpen(false);
    setFormatSheetOpen(false);
    setIsoSheetOpen(false);
  }, [open, edit?.id, edit, stock]);

  const syncStep3CaptionTextareaHeight = useCallback(() => {
    const el = step3CaptionTextareaRef.current;
    if (!el || typeof window === "undefined") return;
    el.style.height = "auto";
    const rootFontPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const minPx = rootFontPx * 4.75;
    el.style.height = `${Math.max(el.scrollHeight, minPx)}px`;
  }, []);

  useLayoutEffect(() => {
    if (!open || step !== 3 || (!enteredViaUpload && !isEditShareRoll)) return;
    syncStep3CaptionTextareaHeight();
  }, [open, enteredViaUpload, isEditShareRoll, step, caption, syncStep3CaptionTextareaHeight]);

  useEffect(() => {
    if (!open || !edit || !editor) return;
    const html = edit.review_text?.trim() ? edit.review_text : "";
    editor.commands.setContent(html, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `edit` fields covered by edit?.id / review_text
  }, [open, edit?.id, edit?.review_text, editor]);

  const handleClose = useCallback(() => {
    setStep2ScanPreviewIndex(null);
    setStep3ImagePreviewIndex(null);
    setStep3MetadataSubpage(null);
    setPreviewUrls((urls) => {
      urls.forEach((u) => {
        if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      });
      return [];
    });
    onOpenChange(false);
  }, [onOpenChange]);

  const editorTextLength = editor?.getText().length ?? 0;
  const editorHtml = editor?.getHTML() ?? "";
  const editorIsEmpty = !editor || editor.isEmpty;

  const buildPayload = (): AddReviewModalPayload => {
    const meta: Pick<
      AddReviewModalPayload,
      | "rating"
      | "reviewText"
      | "camera"
      | "reviewTitle"
      | "bestFor"
      | "format"
      | "location"
      | "shotDate"
      | "tags"
      | "lens"
      | "caption"
      | "shotIso"
      | "lab"
      | "scanner"
    > = {
      rating,
      reviewText: editorIsEmpty ? "" : editorHtml,
      camera: camera || undefined,
      reviewTitle: isEditShareRoll
        ? rollName.trim()
        : mode === "upload" && rollName.trim()
          ? rollName.trim()
          : undefined,
      bestFor: bestFor.length > 0 ? bestFor : undefined,
      format: selectedFormat || undefined,
      location: location || undefined,
      shotDate: shotDate.trim() ? shotDate.trim() : undefined,
      tags: tags.trim() ? tags.trim().slice(0, TAGS_MAX_LENGTH) : undefined,
      lens: lens || undefined,
      caption: caption.trim() ? caption.trim() : undefined,
      shotIso: shotIso || undefined,
      lab: lab || undefined,
      scanner: scanner || undefined,
    };

    if (isEditShareRoll) {
      const editStoredRows =
        editShareRoll?.imageUrls?.map((url, i) => ({
          url,
          width: editShareRoll.imageWidths[i] ?? 0,
          height: editShareRoll.imageHeights[i] ?? 0,
        })) ?? [];
      return {
        ...meta,
        files: [],
        clientStoredScanImages: editStoredRows.length > 0 ? editStoredRows : undefined,
        shareRollMetadataOnly: true,
      };
    }

    if (enteredViaUpload && files.length > 0) {
      const storedOk = files
        .map((_, i) => i)
        .filter((i) => storedScanRows[i] != null && !(scanSlotErrors[i]?.trim()))
        .map((i) => storedScanRows[i]!);
      return {
        ...meta,
        files: [],
        clientStoredScanImages: storedOk.length > 0 ? storedOk : undefined,
      };
    }

    return {
      ...meta,
      files: [],
      clientStoredScanImages: undefined,
    };
  };

  const handleLogSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await Promise.resolve(onSubmit(buildPayload()));
      if (result && typeof result === "object" && result.success === true) handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleBestFor = useCallback((tag: BestFor) => {
    setBestFor((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handlePostScans = async () => {
    setSubmitting(true);
    try {
      const result = await Promise.resolve(onSubmit(buildPayload()));
      if (result && typeof result === "object" && result.success === true) handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const processSelectedScanFiles = async (selected: File[]) => {
    const maxFiles = 10;
    const valid = selected.filter(
      (f) => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_SHOT_SIZE_BYTES
    );
    const invalidCount = selected.length - valid.length;
    const availableSlots = Math.max(0, maxFiles - files.length);
    const kept = valid.slice(0, availableSlots);
    const droppedForLimit = Math.max(0, valid.length - kept.length);

    if (kept.length === 0) {
      setUploadError(
        "No images were added — please use JPG, PNG or WebP files under 50MB."
      );
      return;
    }

    const batchStart = files.length;
    setIsUploading(true);
    setUploadError(null);

    setFiles((prev) => [...prev, ...kept]);
    setPreviewUrls((prev) => [...prev, ...kept.map(() => null)]);
    setScanSlotErrors((prev) => [...prev, ...kept.map(() => null)]);
    setStoredScanRows((prev) => [...prev, ...kept.map(() => null)]);
    setScanIntrinsicSizes((prev) => [...prev, ...kept.map(() => null)]);

    await yieldToNextPaint();

    try {
      for (let i = 0; i < kept.length; i++) {
        const f = kept[i]!;
        const idx = batchStart + i;

        try {
          await assertFileDecodesAsImage(f);
        } catch (err) {
          setScanSlotErrors((prev) => {
            const next = [...prev];
            next[idx] = humanizeImageDecodeError(err, f.name);
            return next;
          });
          continue;
        }

        let prepared: PreparedShareRollImage;
        try {
          prepared = await prepareShareRollImageFile(f);
        } catch (err) {
          setScanSlotErrors((prev) => {
            const next = [...prev];
            next[idx] = humanizeImagePrepareError(err, f.name);
            return next;
          });
          continue;
        }

        /** Preview the encoded blob (WebP/JPEG), not the raw `File` — some mobile browsers serve broken `blob:` URLs for certain originals after decode/canvas work. */
        const url = URL.createObjectURL(prepared.blob);
        setPreviewUrls((prev) => {
          const next = [...prev];
          next[idx] = url;
          return next;
        });

        try {
          const row = await uploadPreparedShareRollScanToStorage(stock.slug, prepared, idx + 1);
          setStoredScanRows((prev) => {
            const next = [...prev];
            next[idx] = row;
            return next;
          });
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : String(uploadErr);
          setPreviewUrls((prev) => {
            const next = [...prev];
            const u = next[idx];
            if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
            next[idx] = null;
            return next;
          });
          setStoredScanRows((prev) => {
            const next = [...prev];
            next[idx] = null;
            return next;
          });
          setScanSlotErrors((prev) => {
            const next = [...prev];
            next[idx] = msg;
            return next;
          });
        }
      }

      const summaryParts: string[] = [];
      if (invalidCount > 0) {
        summaryParts.push(
          invalidCount === 1
            ? "1 image couldn't be added — please use JPG, PNG or WebP files under 50MB."
            : `${invalidCount} images couldn't be added — please use JPG, PNG or WebP files under 50MB.`
        );
      }
      if (droppedForLimit > 0) {
        summaryParts.push(
          droppedForLimit === 1
            ? "1 image was skipped — you've reached the 10 scan limit for this roll."
            : `${droppedForLimit} images were skipped — you've reached the 10 scan limit for this roll.`
        );
      }

      if (summaryParts.length > 0) {
        setUploadError(summaryParts.join(" "));
      } else {
        setUploadError(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;
    void processSelectedScanFiles(selected);
  };

  const handleStep3DragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = uploadScanOrderIdsRef.current;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setUploadScanOrderIds(arrayMove(ids, oldIndex, newIndex));
    setFiles((f) => arrayMove(f, oldIndex, newIndex));
    setPreviewUrls((u) => arrayMove(u, oldIndex, newIndex));
    setScanIntrinsicSizes((s) => arrayMove(s, oldIndex, newIndex));
    setStoredScanRows((r) => arrayMove(r, oldIndex, newIndex));
    setScanSlotErrors((e) => arrayMove(e, oldIndex, newIndex));
    setStep3ImagePreviewIndex((prev) =>
      prev === null ? null : mapPreviewIndexAfterReorder(prev, oldIndex, newIndex)
    );
    setStep2ScanPreviewIndex((prev) =>
      prev === null ? null : mapPreviewIndexAfterReorder(prev, oldIndex, newIndex)
    );
  }, []);

  const removeFile = (index: number) => {
    setStep2ScanPreviewIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
    setStep3ImagePreviewIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
    setPreviewUrls((urls) => {
      const u = urls[index];
      if (u?.startsWith("blob:")) URL.revokeObjectURL(u);
      return urls.filter((_, i) => i !== index);
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setScanIntrinsicSizes((prev) => prev.filter((_, i) => i !== index));
    setStoredScanRows((prev) => prev.filter((_, i) => i !== index));
    setScanSlotErrors((prev) => prev.filter((_, i) => i !== index));
    setUploadScanOrderIds((prev) => prev.filter((_, i) => i !== index));
  };

  /** Next slot: even index → left column, odd → right (same as row-major grid order). */
  const scanAddTileAspectRatio = useMemo(() => {
    if (files.length === 0 || files.length >= 10) return "3 / 2";
    if (files.length % 2 === 0) {
      // Add tile starts a new row on the left; landscape placeholder.
      return "3 / 2";
    }
    // Add tile stacks under the previous item in the right column — match that shot, not the last upload overall.
    const neighborIdx = files.length >= 2 ? files.length - 2 : 0;
    const d = scanIntrinsicSizes[neighborIdx];
    return d && d.w > 0 && d.h > 0 ? `${d.w} / ${d.h}` : "3 / 2";
  }, [files.length, scanIntrinsicSizes]);

  useEffect(() => {
    if (step !== 2) setStep2ScanPreviewIndex(null);
    if (step !== 3) {
      setStep3ImagePreviewIndex(null);
      setStep3MetadataSubpage(null);
      setLocationSheetOpen(false);
      setLensSheetOpen(false);
    }
  }, [step]);

  useEffect(() => {
    if (scanPreviewIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setStep2ScanPreviewIndex(null);
        setStep3ImagePreviewIndex(null);
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [scanPreviewIndex]);

  useLayoutEffect(() => {
    if (files.length === 0) {
      if (!isEditShareRoll || previewUrls.length === 0) {
        setUploadScanOrderIds([]);
      }
      return;
    }
    setUploadScanOrderIds((prev) => {
      if (prev.length === files.length) return prev;
      if (prev.length < files.length) {
        const n = files.length - prev.length;
        return [...prev, ...Array.from({ length: n }, () => crypto.randomUUID())];
      }
      return prev.slice(0, files.length);
    });
  }, [files.length, isEditShareRoll, previewUrls.length]);

  useLayoutEffect(() => {
    setScanIntrinsicSizes((s) => (s.length > files.length ? s.slice(0, files.length) : s));
  }, [files.length]);

  const hasReviewContent =
    rating > 0 || !editorIsEmpty || bestFor.length > 0;
  /** Create requires rating, text, or “best for”; edit allows save even when cleared. */
  const canSubmitTextReview = isEdit || hasReviewContent;

  const hasAnyFailedScanSlot = files.some((_, i) => Boolean(scanSlotErrors[i]?.trim()));

  /** Share-roll step 2: still decoding, preparing, or uploading to Storage. */
  const hasPendingShareRollWork =
    enteredViaUpload &&
    files.length > 0 &&
    files.some((_, i) => {
      if (scanSlotErrors[i]?.trim()) return false;
      return previewUrls[i] == null || storedScanRows[i] == null;
    });

  const hasPendingScanSlots = hasPendingShareRollWork;

  const hasAtLeastOneReadyScan = enteredViaUpload
    ? files.some((_, i) => storedScanRows[i] != null && !(scanSlotErrors[i]?.trim()))
    : files.some((_, i) => previewUrls[i] != null && !(scanSlotErrors[i]?.trim())) ||
      (isEditShareRoll && previewUrls.some((u) => u != null));

  const canAdvanceUploadFlow =
    hasAtLeastOneReadyScan &&
    !hasPendingScanSlots &&
    !isUploading &&
    !hasAnyFailedScanSlot;
  const canPostShareRollScans =
    !isUploading &&
    hasAtLeastOneReadyScan &&
    !hasPendingScanSlots &&
    !hasAnyFailedScanSlot;

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName={
          stackAboveLightbox
            ? "!z-[105] bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
            : undefined
        }
        className={cn(
          "!h-[100dvh] !max-h-[100dvh] !rounded-none gap-0 p-0",
          stackAboveLightbox && "!z-[110]"
        )}
      >
        <SheetTitle className="sr-only">
          {showFilmStockTextReview
            ? isEdit
              ? `Edit review — ${stock.name}`
              : `Review ${stock.name}`
            : isEditShareRoll
              ? `Edit roll — ${stock.name}`
              : step === 2
                ? `Add a roll — ${stock.name}`
                : `Share your roll — ${stock.name}`}
        </SheetTitle>

        {showFilmStockTextReview ? (
          /* ──────────── STEP 1: REVIEW ──────────── */
          <div className="flex h-full flex-col">
            {/* Top bar */}
            <header
              className={`shrink-0 border-b border-border/40 ${mobileHeaderShellClassName}`}
              style={mobileHeaderSafeAreaStyle}
            >
              <div className={`relative ${mobileHeaderLeadingRowClassName}`}>
                <button
                  type="button"
                  onClick={handleClose}
                  className={cn("absolute right-4 top-1/2 -translate-y-1/2 sm:right-6", topRightNavIconButtonClassName, "text-muted-foreground hover:text-foreground")}
                  aria-label="Close"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <div className={mobileHeaderTitleBlockClassName}>
                <h1 className={mobileHeaderTitleClassName}>
                  {isEdit ? "Edit review" : "Review film stock"}
                </h1>
              </div>
            </header>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-white">
              <div className="px-4 py-5 space-y-6">
                {/* Stock context */}
                <div className="flex items-center gap-3">
                  <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[7px] border border-border/50">
                    <StockThumbnail stock={stock} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{stock.name}</p>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <HalfStarRating value={rating} onChange={setRating} size={36} />
                </div>

                {/* Review text with formatting toolbar */}
                <div className="overflow-hidden rounded-[7px] border border-border/50 bg-background transition-colors focus-within:border-primary">
                  <div className="flex items-center gap-0.5 border-b border-border/30 px-2 py-1.5">
                    {([
                      { icon: Bold, label: "Bold", active: editor?.isActive("bold"), action: () => editor?.chain().focus().toggleBold().run() },
                      { icon: Italic, label: "Italic", active: editor?.isActive("italic"), action: () => editor?.chain().focus().toggleItalic().run() },
                      { icon: Quote, label: "Quote", active: editor?.isActive("blockquote"), action: () => editor?.chain().focus().toggleBlockquote().run() },
                      { icon: Strikethrough, label: "Strikethrough", active: editor?.isActive("strike"), action: () => editor?.chain().focus().toggleStrike().run() },
                    ] as const).map(({ icon: Icon, label, active, action }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={action}
                        className={cn(
                          "rounded p-1.5 transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                        )}
                        aria-label={label}
                      >
                        <Icon className="h-4 w-4" strokeWidth={2.5} />
                      </button>
                    ))}
                    <span className="ml-auto text-[11px] tabular-nums text-muted-foreground/60">
                      {editorTextLength.toLocaleString()}/{REVIEW_MAX_LENGTH.toLocaleString()}
                    </span>
                  </div>
                  <EditorContent editor={editor} />
                </div>

                {/* Best for tag picker */}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">What is this stock best for?</p>
                  <div className="flex flex-wrap gap-2">
                    {BEST_FOR_OPTIONS.map((tag) => {
                      const Icon = BEST_FOR_ICONS[tag];
                      const selected = bestFor.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleBestFor(tag)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-[7px] border px-3 py-1.5 text-xs font-medium transition-colors",
                            selected
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border/50 bg-background text-foreground/70 hover:border-primary/30 hover:bg-primary/5"
                          )}
                        >
                          <Icon className="size-3.5" aria-hidden />
                          {BEST_FOR_LABELS[tag]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: submit text-only review */}
            <div className="shrink-0 border-t border-border/40 px-4 py-4">
              <button
                type="button"
                onClick={handleLogSubmit}
                disabled={submitting || !canSubmitTextReview}
                className="flex w-full items-center justify-center rounded-[7px] bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                {submitting ? "Saving..." : isEdit ? "Save changes" : "Submit review"}
              </button>
            </div>
          </div>
        ) : step === 2 ? (
          /* ──────────── STEP 2: ADD SCANS ──────────── */
          <div className="flex h-full flex-col">
            <header
              className={mobileHeaderShellClassName}
              style={mobileHeaderSafeAreaStyle}
            >
              <div className={mobileHeaderLeadingRowClassName}>
                <button
                  type="button"
                  onClick={() => {
                    if (onBackToStockPicker) {
                      onBackToStockPicker();
                      return;
                    }
                    handleClose();
                  }}
                  className={cn(
                    topLeftNavIconButtonClassName,
                    "shrink-0 text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Back"
                >
                  <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
                </button>
                <h1 className="min-w-0 flex-1 truncate font-sans text-lg font-semibold leading-tight tracking-tight text-foreground">
                  Upload your scans
                </h1>
              </div>
            </header>

            {/* Scrollable content */}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 bg-white px-4 pb-5 pt-0">

                {/* Stock context */}
                <div className="flex items-center gap-0 py-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-white">
                    <StockThumbnail stock={stock} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-base font-semibold text-foreground">{stock.name}</p>
                  </div>
                </div>

                {/* Upload zone */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                  />

                  {files.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className={cn(
                        scanUploadDashedSurfaceClassName,
                        "flex w-full flex-col items-center justify-center gap-3 py-12 disabled:opacity-50"
                      )}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
                          <span className="text-center text-sm font-medium text-muted-foreground">
                            Adding scans…
                          </span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-10 w-10 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Upload up to 10 scans</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div>
                      {/* Two flex columns (not CSS Grid rows): avoids huge gaps when one side is much taller. */}
                      <div className="flex gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          {files.map((file, i) =>
                            i % 2 === 0 ? (
                              <ScanReviewThumb
                                key={uploadScanOrderIds[i] ?? `${file.name}-${i}`}
                                url={previewUrls[i] ?? null}
                                fileName={file.name}
                                errorMessage={scanSlotErrors[i] ?? null}
                                onRemove={() => removeFile(i)}
                                onOpenPreview={() => {
                                  setStep3ImagePreviewIndex(null);
                                  setStep2ScanPreviewIndex(i);
                                }}
                                onIntrinsicSize={(w, h) => {
                                  setScanIntrinsicSizes(setScanIntrinsicAtIndex(i, w, h));
                                }}
                              />
                            ) : null
                          )}
                          {files.length < 10 && files.length % 2 === 0 && (
                            <div className="min-w-0 w-full">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={cn(
                                  scanUploadDashedSurfaceClassName,
                                  "flex w-full touch-manipulation items-center justify-center disabled:opacity-50"
                                )}
                                style={{ aspectRatio: scanAddTileAspectRatio }}
                                aria-label="Add more scans from this roll"
                              >
                                {isUploading ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                                ) : (
                                  <Plus className="h-8 w-8 text-muted-foreground" strokeWidth={2} aria-hidden />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          {files.map((file, i) =>
                            i % 2 === 1 ? (
                              <ScanReviewThumb
                                key={uploadScanOrderIds[i] ?? `${file.name}-${i}`}
                                url={previewUrls[i] ?? null}
                                fileName={file.name}
                                errorMessage={scanSlotErrors[i] ?? null}
                                onRemove={() => removeFile(i)}
                                onOpenPreview={() => {
                                  setStep3ImagePreviewIndex(null);
                                  setStep2ScanPreviewIndex(i);
                                }}
                                onIntrinsicSize={(w, h) => {
                                  setScanIntrinsicSizes(setScanIntrinsicAtIndex(i, w, h));
                                }}
                              />
                            ) : null
                          )}
                          {files.length < 10 && files.length % 2 === 1 && (
                            <div className="min-w-0 w-full">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={cn(
                                  scanUploadDashedSurfaceClassName,
                                  "flex w-full touch-manipulation items-center justify-center disabled:opacity-50"
                                )}
                                style={{ aspectRatio: scanAddTileAspectRatio }}
                                aria-label="Add more scans from this roll"
                              >
                                {isUploading ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
                                ) : (
                                  <Plus className="h-8 w-8 text-muted-foreground" strokeWidth={2} aria-hidden />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <p className="mt-2 whitespace-pre-line text-xs text-destructive" role="alert">
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom actions — share-roll step 2 only */}
            {canAdvanceUploadFlow && (
              <div className="mobile-safe-bottom-footer shrink-0 px-4 py-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={submitting || !canAdvanceUploadFlow}
                  className="flex h-[52px] w-full items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-40"
                >
                  {submitting ? "Saving..." : isUploading ? "Adding scans…" : "Next"}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ──────────── STEP 3: FINAL DETAILS (UPLOAD FLOW) ──────────── */
          <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-hidden">
              <div
                className={cn(
                  "flex h-full w-[200%] transition-transform duration-300 ease-out motion-reduce:transition-none",
                  step3MetadataSubpage ? "-translate-x-1/2" : "translate-x-0"
                )}
              >
                <div className="flex h-full min-h-0 w-1/2 min-w-[50%] flex-col">
                  <Step3CompactNavBar
                    title={isEditShareRoll ? "Edit roll" : "Share your roll"}
                    onBack={isEditShareRoll ? handleClose : () => setStep(2)}
                    onClose={handleClose}
                  />
                  <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                    <div className="space-y-3 px-4 pb-5 pt-0">
                      <div className="pt-3">
                        <div className="flex items-center gap-0">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white">
                            <StockThumbnail stock={stock} size="sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-sans text-sm font-medium text-foreground">{stock.name}</p>
                          </div>
                        </div>
                        {isEditShareRoll && previewUrls.length > 0 ? (
                          <div className="mt-5 w-full">
                            <div className={cn("grid gap-2", step3PreviewGridClassName(previewUrls.length))}>
                              {previewUrls.map((url, i) =>
                                url ? (
                                  <button
                                    key={`${url}-${i}`}
                                    type="button"
                                    onClick={() => {
                                      setStep2ScanPreviewIndex(null);
                                      setStep3ImagePreviewIndex(i);
                                    }}
                                    className="relative aspect-square min-w-0 w-full overflow-hidden rounded-[7px] border border-border/50 bg-muted/10 p-0 text-left ring-offset-background hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label={`Preview scan ${i + 1}`}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={url}
                                      alt=""
                                      className="pointer-events-none h-full w-full object-cover"
                                      draggable={false}
                                    />
                                  </button>
                                ) : null
                              )}
                            </div>
                          </div>
                        ) : files.length > 0 && uploadScanOrderIds.length === files.length ? (
                          <div className="mt-5 w-full">
                            <DndContext
                              sensors={step3SortSensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleStep3DragEnd}
                            >
                              <SortableContext items={uploadScanOrderIds} strategy={rectSortingStrategy}>
                                <div className={cn("grid gap-2", step3PreviewGridClassName(uploadScanOrderIds.length))}>
                                  {uploadScanOrderIds.map((sortId, i) => (
                                    <Step3SortableScanCell
                                      key={sortId}
                                      id={sortId}
                                      index={i}
                                      url={previewUrls[i] ?? null}
                                      errorMessage={scanSlotErrors[i] ?? null}
                                      fileName={files[i]?.name}
                                      onTapPreview={(idx) => {
                                        setStep2ScanPreviewIndex(null);
                                        setStep3ImagePreviewIndex(idx);
                                      }}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-0">
                        <div className="-mx-4">
                          <label htmlFor="roll-name" className="sr-only">
                            Title
                          </label>
                          <Input
                            id="roll-name"
                            type="text"
                            value={rollName}
                            onChange={(e) => setRollName(e.target.value)}
                            placeholder="Title"
                            autoComplete="off"
                            className={cn(
                              step3ShareRollTitleBorderClassName,
                              "min-h-11 min-w-0 w-full rounded-none bg-transparent py-2.5 pl-4 pr-4 shadow-none",
                              "text-sm font-normal text-foreground placeholder:text-muted-foreground",
                              "outline-none focus-visible:border-foreground/35 focus-visible:outline-none focus-visible:ring-0 dark:bg-transparent dark:focus-visible:border-foreground/40"
                            )}
                          />
                        </div>
                        <div className="-mx-4">
                          <label htmlFor="share-scans-caption" className="sr-only">
                            Description
                          </label>
                          <textarea
                            ref={step3CaptionTextareaRef}
                            id="share-scans-caption"
                            value={caption}
                            maxLength={CAPTION_MAX_LENGTH}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Description"
                            rows={1}
                            className={cn(
                              "border-0",
                              "min-h-[4.75rem] min-w-0 w-full resize-none overflow-hidden rounded-none bg-transparent py-2.5 pl-4 pr-4 shadow-none",
                              "text-sm font-normal text-foreground placeholder:text-muted-foreground",
                              "outline-none focus-visible:border-foreground/35 focus-visible:outline-none focus-visible:ring-0 dark:bg-transparent dark:focus-visible:border-foreground/40"
                            )}
                          />
                        </div>
                      </div>

                      <div className={step3MetadataListClassName}>
                        <Step3MetadataNavRow
                          icon={CalendarDays}
                          placeholderLabel="Date shot"
                          value={formatShotDateRowDisplay(shotDate)}
                          onNavigate={() => setDateShotSheetOpen(true)}
                        />
                        <Step3MetadataNavRow
                          icon={MapPin}
                          placeholderLabel="Location"
                          value={location}
                          onNavigate={() => setLocationSheetOpen(true)}
                        />
                        <Step3MetadataNavRow
                          icon={Camera}
                          fixedLeftLabel="Camera"
                          value={camera}
                          showDashWhenEmpty={false}
                          onNavigate={() => setStep3MetadataSubpage("camera")}
                        />
                        <Step3MetadataNavRow
                          icon={Aperture}
                          placeholderLabel="Lens"
                          value={lens}
                          onNavigate={() => setLensSheetOpen(true)}
                        />
                        {formatOptions.length > 0 ? (
                          <Step3MetadataNavRow
                            icon={Film}
                            fixedLeftLabel="Format"
                            value={selectedFormat}
                            onNavigate={() => setFormatSheetOpen(true)}
                          />
                        ) : null}
                        <Step3MetadataNavRow
                          icon={Gauge}
                          fixedLeftLabel="ISO"
                          value={shotIso}
                          valueTabular
                          onNavigate={() => setIsoSheetOpen(true)}
                        />
                        <Step3MetadataNavRow
                          icon={FlaskConical}
                          placeholderLabel="Lab"
                          value={filmLabPublicLabel(lab)}
                          onNavigate={() => setStep3MetadataSubpage("lab")}
                        />
                        <Step3MetadataNavRow
                          icon={ScanLine}
                          placeholderLabel="Scanner"
                          value={scanner}
                          onNavigate={() => setStep3MetadataSubpage("scanner")}
                        />
                        <Step3MetadataNavRow
                          icon={Tags}
                          placeholderLabel="Tags"
                          value={metadataTagsValue}
                          onNavigate={() => setStep3MetadataSubpage("tags")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="flex h-full min-h-0 w-1/2 min-w-[50%] flex-col bg-white dark:bg-background"
                  inert={step3MetadataSubpage === null}
                >
                  <Step3CompactNavBar
                    title={
                      step3MetadataSubpage
                        ? STEP3_METADATA_SUBPAGE_LABELS[step3MetadataSubpage]
                        : ""
                    }
                    onBack={() => setStep3MetadataSubpage(null)}
                    showClose={false}
                  />
                  <div
                    className={cn(
                      "min-h-0 flex-1 px-4 pb-4 pt-4",
                      step3MetadataSubpage === "camera" ||
                      step3MetadataSubpage === "lab" ||
                      step3MetadataSubpage === "scanner" ||
                      step3MetadataSubpage === "tags"
                        ? "flex flex-col overflow-hidden"
                        : "no-scrollbar overflow-y-auto"
                    )}
                  >
                    {step3MetadataSubpage === "tags" ? (
                      <ShareRollTagsPicker tags={tags} onTagsChange={setTags} maxLength={TAGS_MAX_LENGTH} />
                    ) : null}
                    {step3MetadataSubpage === "camera" ? (
                      <ShareRollCameraPicker
                        camera={camera}
                        onCameraChange={setCamera}
                        onPicked={() => setStep3MetadataSubpage(null)}
                        userId={user?.id ?? null}
                      />
                    ) : null}
                    {step3MetadataSubpage === "lab" ? (
                      <ShareRollLabPicker
                        lab={lab}
                        onLabChange={setLab}
                        onPicked={() => setStep3MetadataSubpage(null)}
                        userId={user?.id ?? null}
                      />
                    ) : null}
                    {step3MetadataSubpage === "scanner" ? (
                      <ShareRollScannerPicker
                        scanner={scanner}
                        onScannerChange={setScanner}
                        onPicked={() => setStep3MetadataSubpage(null)}
                        userId={user?.id ?? null}
                      />
                    ) : null}
                  </div>
                  {step3MetadataSubpage !== "camera" &&
                  step3MetadataSubpage !== "lab" &&
                  step3MetadataSubpage !== "scanner" ? (
                    <div className="mobile-safe-bottom-footer shrink-0 px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setStep3MetadataSubpage(null)}
                        className="flex h-[52px] w-full items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-black/90"
                      >
                        Save
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {!step3MetadataSubpage ? (
              <div className="mobile-safe-bottom-footer shrink-0 px-4 py-4">
                <button
                  type="button"
                  onClick={handlePostScans}
                  disabled={submitting || !canPostShareRollScans}
                  className="flex h-[52px] w-full items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-40"
                >
                  {submitting
                    ? shareRollSubmitHint?.trim() || (isEditShareRoll ? "Saving…" : "Sharing…")
                    : isEditShareRoll
                      ? "Save roll"
                      : "Share roll"}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>

    <Sheet
      open={open && dateShotSheetOpen}
      modal={true}
      onOpenChange={(next) => {
        if (!open) return;
        setDateShotSheetOpen(next);
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="!z-[115] bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
        className={cn(
          // Intrinsic height from drawer content (tight month view); cap viewport. Year grid sets its own min height inside.
          "!z-[120] flex min-h-0 flex-col gap-0 overflow-hidden border-0 p-0 shadow-2xl data-[side=bottom]:h-auto data-[side=bottom]:max-h-[65dvh]",
          "rounded-t-[20px] bg-background"
        )}
      >
        {open && dateShotSheetOpen ? (
          <ShotDateCalendarDrawerContent
            shotDate={shotDate}
            onShotDateChange={setShotDate}
            onRequestClose={() => setDateShotSheetOpen(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>

    <ShareRollLocationSheet
      open={open && locationSheetOpen}
      onOpenChange={(next) => {
        if (!open) return;
        setLocationSheetOpen(next);
      }}
      value={location}
      onChange={setLocation}
      userId={user?.id ?? null}
    />

    <ShareRollLensSheet
      open={open && lensSheetOpen}
      onOpenChange={(next) => {
        if (!open) return;
        setLensSheetOpen(next);
      }}
      value={lens}
      onChange={setLens}
      userId={user?.id ?? null}
    />

    <ShareRollFormatSheet
      open={open && formatSheetOpen && formatOptions.length > 0}
      onOpenChange={(next) => {
        if (!open) return;
        setFormatSheetOpen(next);
      }}
      options={formatOptions}
      value={selectedFormat}
      onChange={setSelectedFormat}
    />

    <ShareRollIsoSheet
      open={open && isoSheetOpen}
      onOpenChange={(next) => {
        if (!open) return;
        setIsoSheetOpen(next);
      }}
      value={shotIso}
      onChange={setShotIso}
    />

    {typeof document !== "undefined" &&
      (enteredViaUpload || isEditShareRoll) &&
      scanPreviewIndex !== null &&
      typeof previewUrls[scanPreviewIndex] === "string" &&
      previewUrls[scanPreviewIndex] &&
      createPortal(
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-zinc-950"
          role="dialog"
          aria-modal="true"
          aria-label="Preview"
        >
          <header className="shrink-0" style={mobileHeaderSafeAreaStyle}>
            <div className={mobileHeaderLeadingRowClassName}>
              <button
                type="button"
                onClick={() => {
                  setStep2ScanPreviewIndex(null);
                  setStep3ImagePreviewIndex(null);
                }}
                className={cn(
                  topLeftNavIconButtonClassName,
                  "shrink-0 text-muted-foreground hover:text-foreground"
                )}
                aria-label="Back"
              >
                <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
              </button>
              <h1 className="min-w-0 flex-1 truncate font-sans text-lg font-semibold leading-tight tracking-tight text-foreground">
                Preview
              </h1>
            </div>
          </header>
          <div className="flex min-h-0 flex-1 w-full items-center justify-center px-0 pb-[env(safe-area-inset-bottom)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrls[scanPreviewIndex]!}
              alt=""
              className="max-h-full w-full object-contain"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
