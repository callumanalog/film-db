"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Star, StarHalf, Camera, XIcon, ImagePlus, ChevronLeft, ChevronRight, Plus, Loader2, Bold, Italic, Quote, Strikethrough } from "lucide-react";
import { cn } from "@/lib/utils";
import { TextField } from "@/components/ui/text-field";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
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
}

function StockThumbnail({ stock }: { stock: TrackFilmModalStock }) {
  if (stock.image_url) {
    return (
      <Image
        src={stock.image_url}
        alt={stock.name}
        width={64}
        height={64}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/30">
      <Camera className="h-6 w-6 text-muted-foreground/40" />
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

export function AddReviewModal({
  open,
  onOpenChange,
  onSubmit,
  stock,
  initialRating = 0,
  mode = "review",
  edit = null,
}: AddReviewModalProps) {
  const isEdit = !!edit;
  const enteredViaUpload = mode === "upload" && !isEdit;
  const [step, setStep] = useState<1 | 2 | 3>(enteredViaUpload ? 2 : 1);

  // Step 1 fields
  const [rating, setRating] = useState(initialRating);
  const [bestFor, setBestFor] = useState<BestFor[]>([]);
  const [camera, setCamera] = useState("");

  const REVIEW_MAX_LENGTH = 10_000;

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
  const [caption, setCaption] = useState("");
  const [selectedFormat, setSelectedFormat] = useState(stock.format.length === 1 ? stock.format[0] : "");
  const [lens, setLens] = useState("");
  const [shotIso, setShotIso] = useState("");
  const [location, setLocation] = useState("");
  const [lab, setLab] = useState("");
  const [filter, setFilter] = useState("");
  const [scanner, setScanner] = useState("");
  const [shootingOpen, setShootingOpen] = useState(false);
  const [processingOpen, setProcessingOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SHOT_SIZE_BYTES = 50 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  const resetAll = useCallback(() => {
    setStep(enteredViaUpload ? 2 : 1);
    setRating(initialRating);
    editor?.commands.clearContent();
    setCamera("");
    setBestFor([]);
    setExistingScanUrls([]);
    setFiles([]);
    setPreviewUrls((urls) => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setCaption("");
    setSelectedFormat(stock.format.length === 1 ? stock.format[0] : "");
    setLens("");
    setShotIso("");
    setLocation("");
    setLab("");
    setFilter("");
    setScanner("");
    setShootingOpen(false);
    setProcessingOpen(false);
    setIsUploading(false);
    setUploadError(null);
    setSubmitting(false);
  }, [enteredViaUpload, initialRating, editor, stock.format]);

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
    setExistingScanUrls(edit.existingScanUrls ?? []);
    setFiles([]);
    setPreviewUrls((urls) => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      return [];
    });
    setCaption("");
    setSelectedFormat(stock.format.length === 1 ? stock.format[0] : "");
    setLens("");
    setShotIso("");
    setLocation("");
    setLab("");
    setFilter("");
    setScanner("");
    setShootingOpen(false);
    setProcessingOpen(false);
    setCurrentSlide(0);
    setIsUploading(false);
    setUploadError(null);
    setSubmitting(false);
  }, [open, edit?.id, edit, stock.format]);

  useEffect(() => {
    if (!open || !edit || !editor) return;
    const html = edit.review_text?.trim() ? edit.review_text : "";
    editor.commands.setContent(html, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `edit` fields covered by edit?.id / review_text
  }, [open, edit?.id, edit?.review_text, editor]);

  const handleClose = useCallback(() => {
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
    reviewTitle: undefined,
    bestFor: bestFor.length > 0 ? bestFor : undefined,
    format: selectedFormat || undefined,
    location: location || undefined,
    lens: lens || undefined,
    caption: caption || undefined,
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
  };

  const removeFile = (index: number) => {
    setPreviewUrls((urls) => {
      URL.revokeObjectURL(urls[index]);
      return urls.filter((_, i) => i !== index);
    });
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (currentSlide >= next.length) setCurrentSlide(Math.max(0, next.length - 1));
      return next;
    });
  };

  const scrollToSlide = useCallback((index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const slideWidth = el.offsetWidth;
    el.scrollTo({ left: slideWidth * index, behavior: "smooth" });
  }, []);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setCurrentSlide(index);
  }, []);

  const hasReviewContent =
    rating > 0 || !editorIsEmpty || bestFor.length > 0;
  /** Edit flow always allows save from step 2 (including clearing fields). */
  const canSubmitScansStep = isEdit || hasReviewContent || files.length > 0;
  const canAdvanceUploadFlow = files.length > 0;

  return (
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
              ? `Add scans — ${stock.name}`
              : `Post scans — ${stock.name}`}
        </SheetTitle>

        {step === 1 ? (
          /* ──────────── STEP 1: REVIEW ──────────── */
          <div className="flex h-full flex-col">
            {/* Top bar */}
            <div className="relative flex shrink-0 items-center justify-center border-b border-border/40 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                {isEdit ? "Edit review" : "Review film stock"}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
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
            {/* Top bar */}
            <div className="relative flex shrink-0 items-center justify-center border-b border-border/40 px-4 py-3">
              {!enteredViaUpload && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="absolute left-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <span className="text-sm font-semibold text-foreground">
                {enteredViaUpload ? "Review uploads" : "Add scans"}
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="px-4 py-5 space-y-5">
                {/* Stock context */}
                <div className="flex items-center gap-3">
                  <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[7px] border border-border/50">
                    <StockThumbnail stock={stock} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{stock.name}</p>
                  </div>
                </div>

                {enteredViaUpload && (
                  <div className="rounded-[7px] border border-border/50 bg-muted/20 px-3 py-2.5">
                    <p className="text-sm font-medium text-foreground">Add scans</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Upload your scans of {stock.name}. Review them here before adding details.
                    </p>
                  </div>
                )}

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
                        Your scans
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
                          "flex w-full flex-col items-center justify-center gap-2 rounded-[7px] border-2 border-dashed border-border/60 bg-muted/20 py-8 transition-colors",
                          "hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        <Plus className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Add more scans</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "flex w-full flex-col items-center justify-center gap-3 rounded-[7px] border-2 border-dashed border-border/60 bg-muted/20 py-12 transition-colors",
                          "hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        <Plus className="h-10 w-10 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Add scans</span>
                        <span className="px-6 text-center text-xs text-muted-foreground/60">
                          Upload your scans of {stock.name} to share with the community
                        </span>
                      </button>
                    )
                  ) : (
                    <div>
                      <div
                        ref={carouselRef}
                        onScroll={handleCarouselScroll}
                        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
                      >
                        {files.map((file, i) => (
                          <div
                            key={`${file.name}-${i}`}
                            className="relative w-full shrink-0 snap-center"
                          >
                            <div className="overflow-hidden rounded-[7px] border border-border/50">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={previewUrls[i]}
                                alt=""
                                className="h-auto w-full object-contain"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                              aria-label="Remove"
                            >
                              <XIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Carousel indicators + add more */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {files.map((_, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => scrollToSlide(i)}
                              className={cn(
                                "h-1.5 rounded-full transition-all",
                                i === currentSlide
                                  ? "w-4 bg-primary"
                                  : "w-1.5 bg-muted-foreground/30"
                              )}
                              aria-label={`Go to image ${i + 1}`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {files.length} of 10
                          </span>
                          {files.length < 10 && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-1 rounded-[7px] border border-border/50 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add
                            </button>
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
                            <TextField
                              id="scan-iso"
                              label="Shot at ISO"
                              type="text"
                              value={shotIso}
                              onChange={(e) => setShotIso(e.target.value)}
                              placeholder="e.g. 400"
                            />
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
                              {stock.format.map((fmt) => (
                                <button
                                  key={fmt}
                                  type="button"
                                  onClick={() => setSelectedFormat(selectedFormat === fmt ? "" : fmt)}
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

            {/* Bottom: Submit */}
            <div className="shrink-0 border-t border-border/40 px-4 py-4">
              <button
                type="button"
                onClick={enteredViaUpload ? () => setStep(3) : handlePostScans}
                disabled={submitting || (enteredViaUpload ? !canAdvanceUploadFlow : !canSubmitScansStep)}
                className="flex w-full items-center justify-center rounded-[7px] bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                {submitting ? "Saving..." : enteredViaUpload ? "Next" : isEdit ? "Save changes" : "Submit review"}
              </button>
            </div>
          </div>
        ) : (
          /* ──────────── STEP 3: FINAL DETAILS (UPLOAD FLOW) ──────────── */
          <div className="flex h-full flex-col">
            <div className="relative flex shrink-0 items-center justify-center border-b border-border/40 px-4 py-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="absolute left-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-semibold text-foreground">New post</span>
              <button
                type="button"
                onClick={handleClose}
                className="absolute right-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-5 px-4 py-5">
                {files.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {files.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[7px] border border-border/50 bg-muted/10"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrls[i]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <TextField
                  id="scan-caption"
                  label="Caption"
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                />

                <div className="space-y-4">
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
                            id="scan-camera-final"
                            label="Camera"
                            type="text"
                            value={camera}
                            onChange={(e) => setCamera(e.target.value)}
                            placeholder="e.g. Canon AE-1"
                          />
                          <TextField
                            id="scan-lens-final"
                            label="Lens"
                            type="text"
                            value={lens}
                            onChange={(e) => setLens(e.target.value)}
                            placeholder="e.g. 50mm f/1.4"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <TextField
                            id="scan-iso-final"
                            label="Shot at ISO"
                            type="text"
                            value={shotIso}
                            onChange={(e) => setShotIso(e.target.value)}
                            placeholder="e.g. 400"
                          />
                          <TextField
                            id="scan-filter-final"
                            label="Filter"
                            type="text"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="e.g. None, 81A"
                          />
                        </div>
                        <TextField
                          id="scan-location-final"
                          label="Location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. London, UK"
                        />
                        <div>
                          <p className="mb-1 block text-xs font-medium text-muted-foreground">Format</p>
                          <div className="flex flex-wrap gap-1.5">
                            {stock.format.map((fmt) => (
                              <button
                                key={fmt}
                                type="button"
                                onClick={() => setSelectedFormat(selectedFormat === fmt ? "" : fmt)}
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
                            id="scan-lab-final"
                            label="Lab / Processing"
                            type="text"
                            value={lab}
                            onChange={(e) => setLab(e.target.value)}
                            placeholder="e.g. Home dev"
                          />
                          <TextField
                            id="scan-scanner-final"
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
              </div>
            </div>

            <div className="shrink-0 border-t border-border/40 px-4 py-4">
              <button
                type="button"
                onClick={handlePostScans}
                disabled={submitting || !files.length}
                className="flex w-full items-center justify-center rounded-[7px] bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
              >
                {submitting ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
