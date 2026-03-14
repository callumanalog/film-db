"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Star, Camera, XIcon, ImagePlus, ChevronDown, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TrackFilmModalStock } from "@/components/track-film-modal";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const PUSH_PULL_OPTIONS = ["-2", "-1", "0", "+1", "+2", "+3"] as const;

const SLOTS_PER_STOCK = 3;

/** Subtle film-grain SVG pattern for darkroom aesthetic */
function FilmGrainPattern({ className }: { className?: string }) {
  return (
    <svg className={cn("absolute inset-0 h-full w-full opacity-[0.04] mix-blend-multiply", className)} aria-hidden>
      <filter id="post-shot-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#post-shot-grain)" />
    </svg>
  );
}

/** L-shaped crop marks for the four corners (viewfinder/darkroom style) */
function CropMarks({ className }: { className?: string }) {
  const corner = "absolute w-4 h-4 border-muted-foreground/40 border-solid";
  return (
    <>
      <span className={cn(corner, "left-0 top-0 border-r-2 border-b-2 rounded-tl", className)} aria-hidden />
      <span className={cn(corner, "right-0 top-0 border-l-2 border-b-2 rounded-tr", className)} aria-hidden />
      <span className={cn(corner, "left-0 bottom-0 border-r-2 border-t-2 rounded-bl", className)} aria-hidden />
      <span className={cn(corner, "right-0 bottom-0 border-l-2 border-t-2 rounded-br", className)} aria-hidden />
    </>
  );
}

/** Minimal border-bottom-only input style for curation station */
const underlineInputClass =
  "w-full border-0 border-b border-border bg-transparent px-0 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary transition-colors";

function StockImage({ stock, size = 240 }: { stock: TrackFilmModalStock; size?: number }) {
  if (stock.image_url) {
    return (
      <Image
        src={stock.image_url}
        alt={stock.name}
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center border border-border/30 bg-muted/30">
      <Camera className="h-14 w-14 text-muted-foreground/40" />
    </div>
  );
}

/** Interactive half-star rating for the modal */
function ModalStarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  function getValueFromEvent(e: React.MouseEvent<HTMLDivElement>, starIndex: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isLeft = x < rect.width / 2;
    return starIndex + (isLeft ? 0.5 : 1);
  }

  return (
    <div
      className="flex justify-start gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const full = display >= i + 1;
        const half = !full && display >= i + 0.5;
        return (
          <div
            key={i}
            className="relative h-8 w-8 cursor-pointer"
            onMouseMove={(e) => setHover(getValueFromEvent(e, i))}
            onClick={(e) => {
              const val = getValueFromEvent(e, i);
              onChange(val === value ? 0 : val);
            }}
          >
            <Star className="absolute inset-0 h-8 w-8 text-muted-foreground/20" />
            {full && <Star className="absolute inset-0 h-8 w-8 fill-primary text-primary" />}
            {half && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className="h-8 w-8 fill-primary text-primary" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export interface AddReviewModalPayload {
  rating: number;
  reviewText: string;
  files: File[];
  camera?: string;
  reviewTitle?: string;
  format?: string;
  location?: string;
  iso?: string;
  pushPull?: string;
  /** Upload mode */
  lens?: string;
  developedAt?: string;
  caption?: string;
  shotIso?: string;
  lab?: string;
  filter?: string;
  scanner?: string;
  /** Pre-upload: URL and path from immediate upload (no second upload on submit) */
  uploadedImageUrl?: string;
  uploadedStoragePath?: string;
}

interface AddReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** May return { success: true } in upload mode to show success state instead of closing */
  onSubmit: (payload: AddReviewModalPayload) => void | Promise<void | { success?: boolean }>;
  stock: TrackFilmModalStock;
  initialRating?: number;
  /** When 'upload', only show image upload + camera + additional details (no rating, review title, review body) */
  mode?: "review" | "upload";
  /** Number of slots already used for this stock (upload mode). Used for "X of 3 slots used" and limit. */
  slotsUsed?: number;
}

/**
 * Modal for adding a review: layout inspired by review/log release modals —
 * image on left, title styling on right, then rating and form fields.
 */
export function AddReviewModal({
  open,
  onOpenChange,
  onSubmit,
  stock,
  initialRating = 0,
  mode = "review",
  slotsUsed = 0,
}: AddReviewModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [reviewText, setReviewText] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [camera, setCamera] = useState("");
  const [lens, setLens] = useState("");
  const [developedAt, setDevelopedAt] = useState("");
  const [caption, setCaption] = useState("");
  const [shotIso, setShotIso] = useState("");
  const [lab, setLab] = useState("");
  const [filter, setFilter] = useState("");
  const [scanner, setScanner] = useState("");
  const [format, setFormat] = useState("");
  const [location, setLocation] = useState("");
  const [iso, setIso] = useState("");
  const [pushPull, setPushPull] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [uploadDetailsOpen, setUploadDetailsOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadedStoragePath, setUploadedStoragePath] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null); // blob URL while uploading
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_SHOT_SIZE_BYTES = 50 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  const formatOptions = stock.format ?? [];

  const cleanupOrphan = useCallback(async (storagePath: string) => {
    try {
      await fetch("/api/user/reviews/orphan-shot", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storage_path: storagePath }),
      });
    } catch {
      // Best-effort cleanup; orphan may remain
    }
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        if (mode === "upload" && uploadedStoragePath) {
          cleanupOrphan(uploadedStoragePath);
        }
        setPreviewUrls((urls) => {
          urls.forEach((u) => URL.revokeObjectURL(u));
          return [];
        });
        setRating(initialRating);
        setReviewText("");
        setReviewTitle("");
        setCamera("");
        setLens("");
        setDevelopedAt("");
        setCaption("");
        setShotIso("");
        setLab("");
        setFilter("");
        setScanner("");
        setFormat("");
        setLocation("");
        setIso("");
        setPushPull("");
        setFiles([]);
        setDetailsOpen(false);
        setUploadDetailsOpen(false);
        setUploadSuccess(false);
        setUploadedImageUrl(null);
        setUploadedStoragePath(null);
        setIsUploading(false);
        setUploadError(null);
        setUploadPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      }
      onOpenChange(next);
    },
    [mode, uploadedStoragePath, cleanupOrphan, onOpenChange]
  );

  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setReviewText("");
      setReviewTitle("");
      setCamera("");
      setLens("");
      setDevelopedAt("");
      setCaption("");
      setShotIso("");
      setLab("");
      setFilter("");
      setScanner("");
      setFormat("");
      setLocation("");
      setIso("");
      setPushPull("");
      setFiles([]);
      setPreviewUrls((urls) => {
        urls.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
      setDetailsOpen(false);
      setUploadDetailsOpen(false);
      setUploadSuccess(false);
      setUploadedImageUrl(null);
      setUploadedStoragePath(null);
      setIsUploading(false);
      setUploadError(null);
    }
  }, [open, initialRating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AddReviewModalPayload = {
      rating,
      reviewText,
      files: mode === "upload" ? [] : files,
      camera: camera || undefined,
      reviewTitle: reviewTitle || undefined,
      format: format || undefined,
      location: location || undefined,
      iso: iso || undefined,
      pushPull: pushPull || undefined,
      lens: lens || undefined,
      developedAt: developedAt || lab || undefined,
      caption: caption || undefined,
      shotIso: shotIso || undefined,
      lab: lab || undefined,
      filter: filter || undefined,
      scanner: scanner || undefined,
    };
    if (mode === "upload") {
      payload.uploadedImageUrl = uploadedImageUrl ?? undefined;
      payload.uploadedStoragePath = uploadedStoragePath ?? undefined;
    }
    const result = await Promise.resolve(onSubmit(payload));
    if (mode === "upload" && (result as { success?: boolean } | void)?.success) {
      setUploadSuccess(true);
      setFiles([]);
      setPreviewUrls((urls) => {
        urls.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
      setUploadedImageUrl(null);
      setUploadedStoragePath(null);
    } else {
      handleOpenChange(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;

    if (mode === "upload") {
      const file = selected[0];
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setUploadError("Invalid file type. Use PNG, JPG, or WebP.");
        return;
      }
      if (file.size > MAX_SHOT_SIZE_BYTES) {
        setUploadError("File too large. Max 50MB.");
        return;
      }
      setUploadError(null);
      const blobUrl = URL.createObjectURL(file);
      setUploadPreviewUrl(blobUrl);
      setIsUploading(true);
      try {
        const supabase = createSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setUploadError("You must be signed in to upload.");
          return;
        }
        const slug = stock.slug.trim();
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const safeExt = ["png", "jpeg", "jpg", "webp"].includes(ext) ? ext : "jpg";
        const path = `${user.id}/${slug}/${Date.now()}.${safeExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("user-uploads")
          .upload(path, file, { upsert: false });
        if (uploadError) {
          const message =
            uploadError.message === "The resource already exists"
              ? "File with this name already exists. Try again."
              : uploadError.message || "Upload failed. Try again.";
          setUploadError(message);
          return;
        }
        const { data: urlData } = supabase.storage.from("user-uploads").getPublicUrl(uploadData.path);
        setUploadedImageUrl(urlData.publicUrl);
        setUploadedStoragePath(uploadData.path);
      } catch {
        setUploadError("Upload failed. Try again.");
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(blobUrl);
        setUploadPreviewUrl(null);
      }
      return;
    }

    const images = selected.filter((f) => f.type.startsWith("image/"));
    const maxFiles = 10;
    const next = [...files, ...images].slice(0, maxFiles);
    setPreviewUrls((urls) => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      return next.map((f) => URL.createObjectURL(f));
    });
    setFiles(next);
  };

  const removeUploadedImage = useCallback(() => {
    const path = uploadedStoragePath;
    setUploadedImageUrl(null);
    setUploadedStoragePath(null);
    setUploadError(null);
    if (path) cleanupOrphan(path);
  }, [uploadedStoragePath, cleanupOrphan]);

  const removeFile = (index: number) => {
    setPreviewUrls((urls) => {
      URL.revokeObjectURL(urls[index]);
      return urls.filter((_, i) => i !== index);
    });
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {mode === "upload" ? (
          <>
            {/* Sheet backdrop: blur main content to pull focus to the sheet */}
            <Dialog.Backdrop
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[4px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
              aria-hidden
            />
            {/* Half-width slide-over sheet: 50vw desktop, 100vw mobile */}
            <Dialog.Popup
              className={cn(
                "fixed inset-y-0 right-0 z-50 h-full w-[100vw] md:w-[50vw] flex flex-col bg-card shadow-xl border-l border-border/50 work-sans-content",
                "data-open:animate-in data-open:slide-in-from-right-10 data-open:fade-in-0 data-closed:animate-out data-closed:slide-out-to-right-10 data-closed:fade-out-0"
              )}
              aria-labelledby="add-review-title"
              aria-describedby="add-review-desc"
            >
              {uploadSuccess ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
                  <p className="text-xl font-semibold text-foreground font-work-sans" style={{ fontFamily: "var(--font-work-sans), var(--font-sans), sans-serif" }}>
                    Your frame is live.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-md"
                      onClick={() => {
                        setUploadSuccess(false);
                        setCamera("");
                        setLens("");
                        setLab("");
                        setPushPull("");
                        setCaption("");
                        setShotIso("");
                        setFilter("");
                        setScanner("");
                        setUploadDetailsOpen(false);
                      }}
                    >
                      Post Another
                    </Button>
                    <Button type="button" size="sm" className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" onClick={() => handleOpenChange(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex h-full flex-col min-h-0">
                  {!uploadedImageUrl ? (
                    /* Step 1: Upload takes majority of screen */
                    <div className="flex flex-col min-h-0 flex-1 gap-5">
                      <div className="shrink-0 flex flex-col items-center text-center px-5 pt-[100px] pb-0">
                        <div className="flex h-40 w-40 shrink-0 overflow-hidden rounded-[7px] border border-border/50 bg-muted/30">
                          <StockImage stock={stock} size={160} />
                        </div>
                        <Dialog.Title
                          id="add-review-title"
                          className="mt-3 text-base font-bold tracking-tight text-foreground font-work-sans"
                          render={(props) => (
                            <div
                              {...props}
                              role="heading"
                              aria-level={2}
                              className={cn(props.className, "text-base font-bold tracking-tight text-foreground font-work-sans")}
                              style={{ ...props.style, fontFamily: "var(--font-work-sans), var(--font-sans), sans-serif" }}
                            />
                          )}
                        >
                          Post your {stock.name} shot
                        </Dialog.Title>
                        <p id="add-review-desc" className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: "var(--font-work-sans), var(--font-sans), sans-serif" }}>
                          Select your favorite frame from a roll—quality over quantity.
                        </p>
                      </div>
                      <div className="flex-1 min-h-0 h-[261px] flex items-start justify-center px-5 pt-0 pb-2">
                        <div className="w-full max-w-[400px] flex flex-col items-center">
                          <div
                            className={cn(
                              "relative w-full aspect-[3/2] rounded-[7px] overflow-hidden",
                              "border-2 border-dashed border-border bg-muted/20"
                            )}
                          >
                            <FilmGrainPattern />
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              className="sr-only"
                              id="add-review-photos"
                              onChange={handleFileChange}
                            />
                            {isUploading ? (
                              <div className="absolute inset-0 z-10 flex items-center justify-center">
                                {uploadPreviewUrl && (
                                  <>
                                    <img
                                      src={uploadPreviewUrl}
                                      alt=""
                                      className="absolute inset-0 h-full w-full object-cover rounded-[7px]"
                                      aria-hidden
                                    />
                                    <div
                                      className="absolute inset-0 rounded-[7px] bg-gradient-to-t from-black/50 via-black/20 to-transparent"
                                      aria-hidden
                                    />
                                  </>
                                )}
                                <Loader2 className="relative h-8 w-8 animate-spin text-white drop-shadow-sm" aria-hidden />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-[7px]"
                              >
                                <Plus className="h-12 w-12 text-muted-foreground" aria-hidden />
                                <span className="text-sm font-medium text-muted-foreground">Add shot</span>
                              </button>
                            )}
                          </div>
                          {uploadError ? (
                            <p className="mt-3 text-center text-xs text-destructive" role="alert">
                              {uploadError}
                            </p>
                          ) : (
                            <p className="mt-3 text-center text-xs text-muted-foreground">
                              Max 50MB. PNG, JPG, or WebP.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Step 2: Metadata fields (current layout) */
                    <>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="w-full border-b border-border/50">
                    {/* Image preview: small, flexible aspect */}
                    <div className="px-5 pt-[50px] pb-4 flex flex-col items-center">
                      <div className="relative max-w-[360px] rounded-[7px] overflow-hidden w-fit border-0">
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={uploadedImageUrl}
                            alt=""
                            className="max-w-[360px] max-h-[240px] w-auto h-auto object-contain block rounded-[7px]"
                          />
                          <button
                            type="button"
                            onClick={removeUploadedImage}
                            className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label="Remove photo"
                          >
                            <XIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form: caption first, then camera and rest */}
                    <div className="px-5 py-4 space-y-5">
                      <div>
                        <label htmlFor="upload-caption-sheet" className="mb-1 block text-xs font-medium text-muted-foreground">Caption</label>
                        <textarea
                          id="upload-caption-sheet"
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Tell the story behind this frame..."
                          rows={3}
                          className="w-full rounded-card border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary"
                        />
                      </div>
                      <div className="flex flex-row gap-3 items-end">
                        <div className="flex-1 min-w-0">
                          <label htmlFor="upload-camera-sheet" className="mb-1 block text-xs font-medium text-muted-foreground">Camera</label>
                          <input
                            id="upload-camera-sheet"
                            type="text"
                            value={camera}
                            onChange={(e) => setCamera(e.target.value)}
                            placeholder="Search cameras"
                            className="w-full rounded-card border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary"
                          />
                        </div>
                        <div className="w-24 shrink-0">
                          <label htmlFor="upload-shot-iso-sheet" className="mb-1 block text-xs font-medium text-muted-foreground">Shot at ISO</label>
                          <input
                            id="upload-shot-iso-sheet"
                            type="text"
                            value={shotIso}
                            onChange={(e) => setShotIso(e.target.value)}
                            placeholder="e.g. 400"
                            className="w-full rounded-card border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setUploadDetailsOpen((o) => !o)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/50",
                            uploadDetailsOpen && "bg-muted/50"
                          )}
                          aria-expanded={uploadDetailsOpen}
                        >
                          <Plus className={cn("h-3.5 w-3.5 transition-transform", uploadDetailsOpen && "rotate-45")} />
                          Additional details
                        </button>
                        {uploadDetailsOpen && (
                          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3">
                            <div className="min-w-0">
                              <label htmlFor="upload-lens-sheet" className="mb-1 block text-xs font-medium text-muted-foreground">Lens</label>
                              <input id="upload-lens-sheet" type="text" value={lens} onChange={(e) => setLens(e.target.value)} placeholder="e.g. 50mm f/1.4" className="w-full rounded-card border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary" />
                            </div>
                            <div className="min-w-0">
                              <label htmlFor="upload-lab-sheet" className="mb-1 block text-xs font-medium text-muted-foreground">Lab / Processing</label>
                              <input id="upload-lab-sheet" type="text" value={lab} onChange={(e) => setLab(e.target.value)} placeholder="e.g. Home dev" className="w-full rounded-card border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary" />
                            </div>
                            <div className="min-w-0">
                              <label htmlFor="upload-push-pull-sheet" className="mb-1 block text-xs font-medium text-muted-foreground">Push/Pull</label>
                              <input id="upload-push-pull-sheet" type="text" value={pushPull} onChange={(e) => setPushPull(e.target.value)} placeholder="e.g. +1" className="w-full rounded-card border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary" />
                            </div>
                            <div className="min-w-0">
                              <label htmlFor="upload-filter-sheet" className="mb-1 block text-xs font-medium text-muted-foreground">Filter</label>
                              <input id="upload-filter-sheet" type="text" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="e.g. None, 81A" className="w-full rounded-card border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary" />
                            </div>
                            <div className="min-w-0">
                              <label htmlFor="upload-scanner-sheet" className="mb-1 block text-xs font-medium text-muted-foreground">Scanner</label>
                              <input id="upload-scanner-sheet" type="text" value={scanner} onChange={(e) => setScanner(e.target.value)} placeholder="e.g. Epson V600" className="w-full rounded-card border border-border/60 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-primary" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fixed CTA at bottom (step 2 only) */}
                  <div className="sticky bottom-0 shrink-0 border-t border-border/40 bg-background px-5 py-4">
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        Cancel
                      </button>
                      <Button
                        type="submit"
                        size="default"
                        className="w-full sm:w-auto rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        disabled={isUploading || !uploadedImageUrl}
                      >
                        Post to Gallery
                      </Button>
                    </div>
                  </div>
                    </>
                  )}
                </form>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 top-3 z-10 shrink-0 rounded-md"
                aria-label="Close"
                onClick={() => handleOpenChange(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </Dialog.Popup>
          </>
        ) : (
          <>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
            <Dialog.Popup
              className={cn(
                "fixed left-1/2 top-1/2 z-50 w-full max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2",
                "overflow-hidden rounded-[7px] border border-border/50 bg-card shadow-lg flex flex-col",
                "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                "work-sans-content"
              )}
              aria-labelledby="add-review-title"
              aria-describedby="add-review-desc"
            >
              <div className="relative flex shrink-0 items-center justify-end border-b border-border/50 px-4 py-3">
                <Button type="button" variant="ghost" size="icon-sm" className="shrink-0" aria-label="Close" onClick={() => handleOpenChange(false)}>
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
                {mode === "review" && (
                  <>
                    {/* Review mode: title in content for consistency */}
                    <Dialog.Title
                      id="add-review-title"
                      className="text-lg font-bold tracking-tight text-foreground font-work-sans"
                      render={(props) => (
                        <div
                          {...props}
                          role="heading"
                          aria-level={2}
                          className={cn(props.className, "text-lg font-bold tracking-tight text-foreground font-work-sans")}
                          style={{ ...props.style, fontFamily: "var(--font-work-sans), var(--font-sans), ui-sans-serif, system-ui, sans-serif" }}
                        />
                      )}
                    >
                      Add review & photos
                      <span className="block text-sm font-normal text-muted-foreground mt-0.5 font-work-sans" style={{ fontFamily: "var(--font-work-sans), var(--font-sans), ui-sans-serif, system-ui, sans-serif" }}>{stock.name}</span>
                    </Dialog.Title>
                    {/* 1. Rating */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Rating</label>
                      <ModalStarRating value={rating} onChange={setRating} />
                    </div>
                    {/* 2. Review title */}
                    <div>
                      <label htmlFor="add-review-title-field" className="mb-1.5 block text-sm font-medium text-foreground">
                        Review title
                      </label>
                      <Input
                        id="add-review-title-field"
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        placeholder="Optional title for your review"
                        className="w-full"
                      />
                    </div>
                    {/* 3. Review body */}
                    <div>
                      <label htmlFor="add-review-text" className="mb-1.5 block text-sm font-medium text-foreground">
                        Review <span className="font-normal text-muted-foreground">(optional)</span>
                      </label>
                      <textarea
                        id="add-review-text"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="What do you think? How did this film perform?"
                        rows={4}
                        className={cn(
                          "w-full rounded-card border border-input bg-transparent px-2.5 py-2 text-sm transition-colors",
                          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
                        )}
                      />
                    </div>
                  </>
                )}

                {mode === "review" && (
                  <>
                {/* Upload your scans — review mode only */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Upload your scans
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    id="add-review-photos"
                    onChange={handleFileChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-2 rounded-[7px] border-2 border-dashed border-border/60 bg-muted/30 py-8 transition-colors",
                      "hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    )}
                  >
                    <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden />
                    <span className="text-sm font-medium text-muted-foreground">Add scans</span>
                  </button>
                  {files.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {files.map((file, i) => (
                        <div
                          key={`${file.name}-${i}`}
                          className="relative h-16 w-16 rounded-card border border-border/50 bg-muted overflow-hidden"
                        >
                          <img
                            src={previewUrls[i]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="absolute right-0.5 top-0.5 rounded bg-black/60 p-0.5 text-white hover:bg-black/80"
                            aria-label="Remove photo"
                          >
                            <XIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Camera */}
                <div>
                  <label htmlFor="add-review-camera" className="mb-1.5 block text-sm font-medium text-foreground">
                    Camera
                  </label>
                  <Input
                    id="add-review-camera"
                    type="text"
                    value={camera}
                    onChange={(e) => setCamera(e.target.value)}
                    placeholder="e.g. Canon AE-1"
                    className="w-full"
                  />
                </div>

                {/* 6. Additional details — collapsed accordion */}
                <div className="rounded-card border border-border/50">
                  <button
                    type="button"
                    onClick={() => setDetailsOpen((o) => !o)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/30"
                    aria-expanded={detailsOpen}
                  >
                    Additional details
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", detailsOpen && "rotate-180")}
                    />
                  </button>
                  {detailsOpen && (
                    <div className="border-t border-border/50 p-4 space-y-3">
                      {formatOptions.length > 0 && (
                        <div>
                          <label htmlFor="add-review-format" className="mb-1 block text-xs font-medium text-muted-foreground">
                            Format
                          </label>
                          <Select value={format} onValueChange={(v) => setFormat(v ?? "")} name="format">
                            <SelectTrigger id="add-review-format" className="w-full">
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              {formatOptions.map((f) => (
                                <SelectItem key={f} value={f}>
                                  {f}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <label htmlFor="add-review-location" className="mb-1 block text-xs font-medium text-muted-foreground">
                          Location
                        </label>
                        <Input
                          id="add-review-location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Where did you shoot?"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="add-review-iso" className="mb-1 block text-xs font-medium text-muted-foreground">
                          ISO
                        </label>
                        <Input
                          id="add-review-iso"
                          type="text"
                          value={iso}
                          onChange={(e) => setIso(e.target.value)}
                          placeholder="e.g. 800"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="add-review-push-pull" className="mb-1 block text-xs font-medium text-muted-foreground">
                          Push/Pull
                        </label>
                        <Select value={pushPull} onValueChange={(v) => setPushPull(v ?? "")} name="pushPull">
                          <SelectTrigger id="add-review-push-pull" className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {PUSH_PULL_OPTIONS.map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 border-t border-border/50 pt-4">
                  <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Log</Button>
                </div>
              </>
                )}
              </form>
          </div>
        </Dialog.Popup>
          </>
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
}
