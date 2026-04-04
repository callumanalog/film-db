"use client";

import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  type CSSProperties,
  type SyntheticEvent,
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
  Filter as FilterIcon,
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
import { TextField } from "@/components/ui/text-field";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { ShotDateCalendarDrawerContent } from "@/components/shot-date-calendar-drawer-content";
import { ShareRollLocationSheet } from "@/components/share-roll-location-sheet";
import { ShareRollFormatSheet } from "@/components/share-roll-format-sheet";
import { ShareRollIsoSheet } from "@/components/share-roll-iso-sheet";
import type { LucideIcon } from "lucide-react";
import { nearestPresetIso, ShotIsoStepper } from "@/components/shot-iso-controls";
import { ShareRollCameraPicker } from "@/components/share-roll-camera-picker";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getFilmStockFormatListForSlug } from "@/app/actions/get-film-stocks";
import type { BestFor } from "@/lib/types";
import { BEST_FOR_LABELS } from "@/lib/types";
import { BEST_FOR_ICONS } from "@/components/best-for-section";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapPlaceholder from "@tiptap/extension-placeholder";

interface TrackFilmModalStock {
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

type Step3MetadataSubpage = "tags" | "camera" | "lens" | "processing";

const STEP3_METADATA_SUBPAGE_LABELS: Record<Step3MetadataSubpage, string> = {
  tags: "Tags",
  camera: "Camera",
  lens: "Lens",
  processing: "Processing",
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

export interface AddReviewModalPayload {
  rating: number;
  reviewText: string;
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
  filter?: string;
  scanner?: string;
  uploadedImageUrl?: string;
  uploadedStoragePath?: string;
}

/** Pre-fill when editing an existing review (step 1 + existing scan URLs on step 2). */
export interface EditReviewSeed {
  id: string;
  rating: number;
  review_text: string | null;
  best_for: string[];
  existingScanUrls: string[];
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
  onBackToStockPicker?: () => void;
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
        className="h-full w-full object-cover"
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

/** Dashed “upload” look shared by empty state and in-grid add tile. */
const scanUploadDashedSurfaceClassName = cn(
  "rounded-[7px] border-2 border-dashed border-border/60 bg-muted/20 transition-colors",
  "hover:border-primary/40 hover:bg-primary/5 active:bg-primary/10"
);

function ScanReviewThumb({
  url,
  onRemove,
  onOpenPreview,
  onIntrinsicSize,
}: {
  url: string;
  onRemove: () => void;
  onOpenPreview: () => void;
  onIntrinsicSize?: (width: number, height: number) => void;
}) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    setDims(null);
  }, [url]);

  const frameStyle: CSSProperties | undefined = dims
    ? { aspectRatio: `${dims.w} / ${dims.h}` }
    : { minHeight: "6rem" };

  const handleImgLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth < 1 || naturalHeight < 1) return;
    setDims({ w: naturalWidth, h: naturalHeight });
    onIntrinsicSize?.(naturalWidth, naturalHeight);
  };

  return (
    <div className="relative min-w-0 self-start">
      <div className="relative w-full overflow-hidden" style={frameStyle}>
        <button
          type="button"
          onClick={onOpenPreview}
          className="relative block h-full min-h-0 w-full touch-manipulation"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="h-full w-full object-contain"
            draggable={false}
            onLoad={handleImgLoad}
          />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          aria-label="Remove scan"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function mapPreviewIndexAfterReorder(i: number, from: number, to: number): number {
  if (i === from) return to;
  if (from < to && i > from && i <= to) return i - 1;
  if (from > to && i >= to && i < from) return i + 1;
  return i;
}

/** Step 3 grid: press-and-hold then drag to reorder (no handle icon). */
function Step3SortableScanCell({
  id,
  index,
  url,
  onTapPreview,
}: {
  id: string;
  index: number;
  url: string;
  onTapPreview: (index: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
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
        isDragging && "z-50 opacity-95 shadow-lg"
      )}
      onClick={() => onTapPreview(index)}
      {...attributes}
      {...listeners}
      aria-label={`Preview scan ${index + 1}. Press and hold to reorder.`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="pointer-events-none h-full w-full object-cover" draggable={false} />
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
  onBackToStockPicker,
}: AddReviewModalProps) {
  const isEdit = !!edit;
  const enteredViaUpload = mode === "upload" && !isEdit;
  const [step, setStep] = useState<1 | 2 | 3>(enteredViaUpload ? 2 : 1);

  // Step 1 fields
  const [rating, setRating] = useState(initialRating);
  const [bestFor, setBestFor] = useState<BestFor[]>([]);
  const [camera, setCamera] = useState("");
  const [rollName, setRollName] = useState("");

  const REVIEW_MAX_LENGTH = 10_000;
  const CAPTION_MAX_LENGTH = 500;
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
  const [existingScanUrls, setExistingScanUrls] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  /** naturalWidth / naturalHeight per scan index — used to match in-grid “add” tile aspect to the neighbor shot. */
  const [scanIntrinsicSizes, setScanIntrinsicSizes] = useState<
    ({ w: number; h: number } | null)[]
  >([]);
  /** Stable row ids for step 3 drag-reorder (aligned with files / previewUrls). */
  const [uploadScanOrderIds, setUploadScanOrderIds] = useState<string[]>([]);
  const uploadScanOrderIdsRef = useRef<string[]>([]);
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
  const [lab, setLab] = useState("");
  const [filter, setFilter] = useState("");
  const [scanner, setScanner] = useState("");
  const [caption, setCaption] = useState("");
  const [shootingOpen, setShootingOpen] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
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
  const [formatSheetOpen, setFormatSheetOpen] = useState(false);
  const [isoSheetOpen, setIsoSheetOpen] = useState(false);

  const MAX_SHOT_SIZE_BYTES = 50 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  const resetAll = useCallback(() => {
    setStep(enteredViaUpload ? 2 : 1);
    setRating(initialRating);
    editor?.commands.clearContent();
    setCamera("");
    setRollName("");
    setBestFor([]);
    setExistingScanUrls([]);
    setFiles([]);
    setScanIntrinsicSizes([]);
    setUploadScanOrderIds([]);
    setPreviewUrls((urls) => {
      urls.forEach((u) => URL.revokeObjectURL(u));
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
    setFilter("");
    setScanner("");
    setShootingOpen(false);
    setProcessingOpen(false);
    setStep2ScanPreviewIndex(null);
    setStep3ImagePreviewIndex(null);
    setIsUploading(false);
    setUploadError(null);
    setSubmitting(false);
    setStep3MetadataSubpage(null);
    setDateShotSheetOpen(false);
    setLocationSheetOpen(false);
    setFormatSheetOpen(false);
    setIsoSheetOpen(false);
  }, [enteredViaUpload, initialRating, editor, stock]);

  useEffect(() => {
    if (!open) {
      setDateShotSheetOpen(false);
      setLocationSheetOpen(false);
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

  const step3ProcessingSummary = useMemo(
    () => [lab.trim(), scanner.trim()].filter(Boolean).join(" · "),
    [lab, scanner]
  );

  useEffect(() => {
    if (!open || edit) return;
    resetAll();
  }, [open, edit?.id, resetAll, edit]);

  useEffect(() => {
    if (!open || !edit) return;
    setStep(1);
    setRating(edit.rating > 0 ? Number(edit.rating) : 0);
    setBestFor((edit.best_for as BestFor[]) ?? []);
    setCamera("");
    setRollName("");
    setExistingScanUrls(edit.existingScanUrls ?? []);
    setFiles([]);
    setScanIntrinsicSizes([]);
    setUploadScanOrderIds([]);
    setPreviewUrls((urls) => {
      urls.forEach((u) => URL.revokeObjectURL(u));
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
    setFilter("");
    setScanner("");
    setShootingOpen(false);
    setProcessingOpen(false);
    setStep2ScanPreviewIndex(null);
    setStep3ImagePreviewIndex(null);
    setIsUploading(false);
    setUploadError(null);
    setSubmitting(false);
    setStep3MetadataSubpage(null);
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
    if (!open || !enteredViaUpload || step !== 3) return;
    syncStep3CaptionTextareaHeight();
  }, [open, enteredViaUpload, step, caption, syncStep3CaptionTextareaHeight]);

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
      urls.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    onOpenChange(false);
  }, [onOpenChange]);

  const editorTextLength = editor?.getText().length ?? 0;
  const editorHtml = editor?.getHTML() ?? "";
  const editorIsEmpty = !editor || editor.isEmpty;

  const buildPayload = (): AddReviewModalPayload => ({
    rating,
    reviewText: editorIsEmpty ? "" : editorHtml,
    files,
    camera: camera || undefined,
    reviewTitle: mode === "upload" && rollName.trim() ? rollName.trim() : undefined,
    bestFor: bestFor.length > 0 ? bestFor : undefined,
    format: selectedFormat || undefined,
    location: location || undefined,
    shotDate: shotDate.trim() ? shotDate.trim() : undefined,
    tags: tags.trim() ? tags.trim().slice(0, TAGS_MAX_LENGTH) : undefined,
    lens: lens || undefined,
    caption: caption.trim() ? caption.trim() : undefined,
    shotIso: shotIso || undefined,
    lab: lab || undefined,
    filter: filter || undefined,
    scanner: scanner || undefined,
  });

  const handleLogSubmit = async () => {
    setSubmitting(true);
    try {
      await Promise.resolve(onSubmit(buildPayload()));
      handleClose();
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
      await Promise.resolve(onSubmit(buildPayload()));
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;

    const maxFiles = 10;
    const valid = selected.filter(
      (f) => ALLOWED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_SHOT_SIZE_BYTES
    );
    const invalidCount = selected.length - valid.length;
    const availableSlots = Math.max(0, maxFiles - files.length);
    const kept = valid.slice(0, availableSlots);
    const droppedForLimit = Math.max(0, valid.length - kept.length);

    if (kept.length === 0) {
      setUploadError("No files were added. Use PNG, JPG, or WebP under 50MB.");
      return;
    }

    const next = [...files, ...kept];
    if (invalidCount > 0 || droppedForLimit > 0) {
      const parts: string[] = [];
      if (invalidCount > 0) parts.push(`${invalidCount} invalid file${invalidCount > 1 ? "s were" : " was"} skipped`);
      if (droppedForLimit > 0) parts.push(`${droppedForLimit} file${droppedForLimit > 1 ? "s were" : " was"} skipped (10 max)`);
      setUploadError(parts.join(". ") + ".");
    } else {
      setUploadError(null);
    }
    setPreviewUrls((urls) => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      return next.map((f) => URL.createObjectURL(f));
    });
    setFiles(next);
    setScanIntrinsicSizes(next.map(() => null));
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
      URL.revokeObjectURL(urls[index]);
      return urls.filter((_, i) => i !== index);
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setScanIntrinsicSizes((prev) => prev.filter((_, i) => i !== index));
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
      setUploadScanOrderIds([]);
      return;
    }
    setUploadScanOrderIds((prev) =>
      prev.length === files.length ? prev : files.map(() => crypto.randomUUID())
    );
  }, [files]);

  const hasReviewContent =
    rating > 0 || !editorIsEmpty || bestFor.length > 0;
  /** Edit flow always allows save from step 2 (including clearing fields). */
  const canSubmitScansStep = isEdit || hasReviewContent || files.length > 0;
  const canAdvanceUploadFlow = files.length > 0;

  return (
    <>
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="!h-[100dvh] !max-h-[100dvh] !rounded-none gap-0 p-0"
      >
        <SheetTitle className="sr-only">
          {step === 1
            ? isEdit
              ? `Edit review — ${stock.name}`
              : `Review ${stock.name}`
            : step === 2
              ? enteredViaUpload
                ? `Add a roll — ${stock.name}`
                : `Add scans — ${stock.name}`
              : enteredViaUpload
                ? `Share your roll — ${stock.name}`
                : `Post scans — ${stock.name}`}
        </SheetTitle>

        {step === 1 ? (
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

            {/* Bottom: Next */}
            <div className="shrink-0 border-t border-border/40 px-4 py-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex w-full items-center justify-center rounded-[7px] bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Next
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
                    if (enteredViaUpload && onBackToStockPicker) {
                      onBackToStockPicker();
                      return;
                    }
                    if (enteredViaUpload) {
                      handleClose();
                      return;
                    }
                    setStep(1);
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
                <div className="flex items-center gap-3 py-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-white">
                    <StockThumbnail stock={stock} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-sans text-base font-semibold text-foreground">{stock.name}</p>
                  </div>
                </div>

                {/* Review summary */}
                {!enteredViaUpload && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full rounded-[7px] border border-border/50 bg-secondary/30 px-3 py-3 text-left transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between">
                      <HalfStarRating value={rating} onChange={() => {}} size={16} readonly />
                      <span className="text-xs font-medium text-primary">Edit</span>
                    </div>
                    {editor?.getText().trim() && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-foreground/80">
                        {editor.getText()}
                      </p>
                    )}
                    {bestFor.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {bestFor.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary"
                          >
                            {BEST_FOR_LABELS[tag]}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                )}

                {/* Upload zone */}
                <div>
                  {existingScanUrls.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Existing scans
                      </p>
                      <div
                        className={cn(
                          "flex gap-2 overflow-x-auto pb-1",
                          "snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        )}
                      >
                        {existingScanUrls.map((url, i) => (
                          <div
                            key={`${url}-${i}`}
                            className="snap-start shrink-0 overflow-hidden rounded-[7px] border border-border/50 bg-muted ring-offset-background"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt=""
                              className="block h-[7rem] w-[7rem] object-cover sm:h-[7.5rem] sm:w-[7.5rem]"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Add more scans below. Existing images stay on your review.
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                  />

                  {files.length === 0 ? (
                    existingScanUrls.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          scanUploadDashedSurfaceClassName,
                          "flex w-full flex-col items-center justify-center gap-2 py-8"
                        )}
                      >
                        <Plus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          {enteredViaUpload ? "Add more scans from this roll" : "Add more scans"}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          scanUploadDashedSurfaceClassName,
                          "flex w-full flex-col items-center justify-center gap-3 py-12"
                        )}
                      >
                        <Plus className="h-10 w-10 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Upload up to 10 scans</span>
                      </button>
                    )
                  ) : (
                    <div>
                      {/* Two flex columns (not CSS Grid rows): avoids huge gaps when one side is much taller. */}
                      <div className="flex gap-2">
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          {files.map((file, i) =>
                            i % 2 === 0 ? (
                              <ScanReviewThumb
                                key={previewUrls[i] ?? `${file.name}-${i}`}
                                url={previewUrls[i] ?? ""}
                                onRemove={() => removeFile(i)}
                                onOpenPreview={() => {
                                  setStep3ImagePreviewIndex(null);
                                  setStep2ScanPreviewIndex(i);
                                }}
                                onIntrinsicSize={(w, h) => {
                                  setScanIntrinsicSizes((sizes) => {
                                    const next = files.map((_, idx) => sizes[idx] ?? null);
                                    next[i] = { w, h };
                                    return next;
                                  });
                                }}
                              />
                            ) : null
                          )}
                          {files.length < 10 && files.length % 2 === 0 && (
                            <div className="min-w-0 w-full">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                  scanUploadDashedSurfaceClassName,
                                  "flex w-full touch-manipulation items-center justify-center"
                                )}
                                style={{ aspectRatio: scanAddTileAspectRatio }}
                                aria-label={
                                  enteredViaUpload ? "Add more scans from this roll" : "Add more scans"
                                }
                              >
                                <Plus className="h-8 w-8 text-muted-foreground" strokeWidth={2} aria-hidden />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          {files.map((file, i) =>
                            i % 2 === 1 ? (
                              <ScanReviewThumb
                                key={previewUrls[i] ?? `${file.name}-${i}`}
                                url={previewUrls[i] ?? ""}
                                onRemove={() => removeFile(i)}
                                onOpenPreview={() => {
                                  setStep3ImagePreviewIndex(null);
                                  setStep2ScanPreviewIndex(i);
                                }}
                                onIntrinsicSize={(w, h) => {
                                  setScanIntrinsicSizes((sizes) => {
                                    const next = files.map((_, idx) => sizes[idx] ?? null);
                                    next[i] = { w, h };
                                    return next;
                                  });
                                }}
                              />
                            ) : null
                          )}
                          {files.length < 10 && files.length % 2 === 1 && (
                            <div className="min-w-0 w-full">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className={cn(
                                  scanUploadDashedSurfaceClassName,
                                  "flex w-full touch-manipulation items-center justify-center"
                                )}
                                style={{ aspectRatio: scanAddTileAspectRatio }}
                                aria-label={
                                  enteredViaUpload ? "Add more scans from this roll" : "Add more scans"
                                }
                              >
                                <Plus className="h-8 w-8 text-muted-foreground" strokeWidth={2} aria-hidden />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <p className="mt-2 text-xs text-destructive" role="alert">{uploadError}</p>
                  )}
                </div>

                {/* Metadata fields for regular review flow */}
                {!enteredViaUpload && files.length > 0 && (
                  <div className="space-y-4">
                    {/* Collapsible: Shooting details */}
                    <div className="overflow-hidden rounded-[7px] border border-border/50">
                      <button
                        type="button"
                        onClick={() => setShootingOpen((v) => !v)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/30"
                      >
                        Add shooting details
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", shootingOpen && "rotate-90")} />
                      </button>
                      {shootingOpen && (
                        <div className="space-y-3 border-t border-border/40 px-3 py-3">
                          <div className="grid grid-cols-2 gap-3">
                            <TextField
                              id="scan-camera"
                              label="Camera"
                              type="text"
                              value={camera}
                              onChange={(e) => setCamera(e.target.value)}
                              placeholder="e.g. Canon AE-1"
                            />
                            <TextField
                              id="scan-lens"
                              label="Lens"
                              type="text"
                              value={lens}
                              onChange={(e) => setLens(e.target.value)}
                              placeholder="e.g. 50mm f/1.4"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="min-w-0">
                              <label id="scan-iso-label" className="mb-1 block text-field-label">
                                Shot at ISO
                              </label>
                              <ShotIsoStepper aria-labelledby="scan-iso-label" value={shotIso} onChange={setShotIso} />
                            </div>
                            <TextField
                              id="scan-filter"
                              label="Filter"
                              type="text"
                              value={filter}
                              onChange={(e) => setFilter(e.target.value)}
                              placeholder="e.g. None, 81A"
                            />
                          </div>
                          <TextField
                            id="scan-location"
                            label="Location"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. London, UK"
                          />
                          <div>
                            <p className="mb-1 block text-xs font-medium text-muted-foreground">Format</p>
                            <div className="flex flex-wrap gap-1.5">
                              {formatOptions.map((fmt) => (
                                <button
                                  key={fmt}
                                  type="button"
                                  onClick={() => setSelectedFormat(fmt)}
                                  className={cn(
                                    "rounded-[7px] border px-3 py-1.5 text-xs font-medium transition-colors",
                                    selectedFormat === fmt
                                      ? "border-primary/40 bg-primary/10 text-primary"
                                      : "border-border/50 bg-background text-foreground/70 hover:border-primary/30 hover:bg-primary/5"
                                  )}
                                >
                                  {fmt}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Collapsible: Processing details */}
                    <div className="overflow-hidden rounded-[7px] border border-border/50">
                      <button
                        type="button"
                        onClick={() => setProcessingOpen((v) => !v)}
                        className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary/30"
                      >
                        Add processing details
                        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", processingOpen && "rotate-90")} />
                      </button>
                      {processingOpen && (
                        <div className="space-y-3 border-t border-border/40 px-3 py-3">
                          <div className="grid grid-cols-2 gap-3">
                            <TextField
                              id="scan-lab"
                              label="Lab / Processing"
                              type="text"
                              value={lab}
                              onChange={(e) => setLab(e.target.value)}
                              placeholder="e.g. Home dev"
                            />
                            <TextField
                              id="scan-scanner"
                              label="Scanner"
                              type="text"
                              value={scanner}
                              onChange={(e) => setScanner(e.target.value)}
                              placeholder="e.g. Epson V600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            {(enteredViaUpload ? canAdvanceUploadFlow : canSubmitScansStep) && (
              <div className="mobile-safe-bottom-footer shrink-0 px-4 py-4">
                <button
                  type="button"
                  onClick={enteredViaUpload ? () => setStep(3) : handlePostScans}
                  disabled={submitting || (enteredViaUpload ? !canAdvanceUploadFlow : !canSubmitScansStep)}
                  className={cn(
                    "flex h-[52px] w-full items-center justify-center text-sm font-semibold transition-colors disabled:opacity-40",
                    enteredViaUpload
                      ? "rounded-full bg-black text-white hover:bg-black/90"
                      : "rounded-[7px] bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {submitting ? "Saving..." : enteredViaUpload ? "Next" : isEdit ? "Save changes" : "Submit review"}
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
                    title="Share your roll"
                    onBack={() => setStep(2)}
                    onClose={handleClose}
                  />
                  <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
                    <div className="space-y-3 px-4 pb-5 pt-0">
                      <div className="pt-3">
                        <div className="flex items-center gap-2">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-white">
                            <StockThumbnail stock={stock} size="sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-sans text-sm font-medium text-foreground">{stock.name}</p>
                          </div>
                        </div>
                        {files.length > 0 && uploadScanOrderIds.length === files.length && (
                          <div className="mt-5 w-full">
                            <DndContext
                              sensors={step3SortSensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleStep3DragEnd}
                            >
                              <SortableContext items={uploadScanOrderIds} strategy={rectSortingStrategy}>
                                <div className="grid grid-cols-5 gap-2">
                                  {uploadScanOrderIds.map((sortId, i) => (
                                    <Step3SortableScanCell
                                      key={sortId}
                                      id={sortId}
                                      index={i}
                                      url={previewUrls[i] ?? ""}
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
                        )}
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
                          icon={Tags}
                          placeholderLabel="Tags"
                          value={tags}
                          onNavigate={() => setStep3MetadataSubpage("tags")}
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
                          onNavigate={() => setStep3MetadataSubpage("lens")}
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
                          placeholderLabel="Processing"
                          value={step3ProcessingSummary}
                          onNavigate={() => setStep3MetadataSubpage("processing")}
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
                      step3MetadataSubpage === "camera"
                        ? "flex flex-col overflow-hidden"
                        : "no-scrollbar overflow-y-auto"
                    )}
                  >
                    {step3MetadataSubpage === "tags" ? (
                      <TextField
                        id="step3-inline-tags"
                        label="Tags"
                        type="text"
                        value={tags}
                        maxLength={TAGS_MAX_LENGTH}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="Comma-separated, e.g. street, summer, Paris"
                      />
                    ) : null}
                    {step3MetadataSubpage === "camera" ? (
                      <ShareRollCameraPicker
                        camera={camera}
                        onCameraChange={setCamera}
                        onPicked={() => setStep3MetadataSubpage(null)}
                      />
                    ) : null}
                    {step3MetadataSubpage === "lens" ? (
                      <div className="space-y-4">
                        <TextField
                          id="step3-inline-lens"
                          label="Lens"
                          type="text"
                          value={lens}
                          onChange={(e) => setLens(e.target.value)}
                          placeholder="e.g. 50mm f/1.8"
                        />
                        <TextField
                          id="step3-inline-filter"
                          label="Filter"
                          type="text"
                          value={filter}
                          onChange={(e) => setFilter(e.target.value)}
                          placeholder="e.g. Yellow #8"
                        />
                      </div>
                    ) : null}
                    {step3MetadataSubpage === "processing" ? (
                      <div className="space-y-4">
                        <TextField
                          id="step3-inline-lab"
                          label="Lab / Processing"
                          type="text"
                          value={lab}
                          onChange={(e) => setLab(e.target.value)}
                          placeholder="e.g. Home dev"
                        />
                        <TextField
                          id="step3-inline-scanner"
                          label="Scanner"
                          type="text"
                          value={scanner}
                          onChange={(e) => setScanner(e.target.value)}
                          placeholder="e.g. Epson V600"
                        />
                      </div>
                    ) : null}
                  </div>
                  {step3MetadataSubpage !== "camera" ? (
                    <div className="mobile-safe-bottom-footer shrink-0 px-4 py-4">
                      <button
                        type="button"
                        onClick={() => setStep3MetadataSubpage(null)}
                        className="flex h-[52px] w-full items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-black/90"
                      >
                        Done
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
                  disabled={submitting || !files.length}
                  className="flex h-[52px] w-full items-center justify-center rounded-full bg-black text-sm font-semibold text-white transition-colors hover:bg-black/90 disabled:opacity-40"
                >
                  {submitting ? "Sharing..." : "Share roll"}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>

    <Sheet
      open={open && dateShotSheetOpen}
      modal="trap-focus"
      onOpenChange={(next) => {
        if (!open) return;
        setDateShotSheetOpen(next);
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="!z-[105] bg-black/50 supports-backdrop-filter:backdrop-blur-sm"
        className={cn(
          // Intrinsic height from drawer content (tight month view); cap viewport. Year grid sets its own min height inside.
          "!z-[110] flex min-h-0 flex-col gap-0 overflow-hidden border-0 p-0 shadow-2xl data-[side=bottom]:h-auto data-[side=bottom]:max-h-[65dvh]",
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
      scanPreviewIndex !== null &&
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
              src={previewUrls[scanPreviewIndex]}
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
