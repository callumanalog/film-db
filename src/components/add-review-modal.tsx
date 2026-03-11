"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Star, Camera, XIcon, ImagePlus, ChevronDown } from "lucide-react";
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

const PUSH_PULL_OPTIONS = ["-2", "-1", "0", "+1", "+2", "+3"] as const;

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
}

interface AddReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: AddReviewModalPayload) => void;
  stock: TrackFilmModalStock;
  initialRating?: number;
  /** When 'upload', only show image upload + camera + additional details (no rating, review title, review body) */
  mode?: "review" | "upload";
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
}: AddReviewModalProps) {
  const [rating, setRating] = useState(initialRating);
  const [reviewText, setReviewText] = useState("");
  const [reviewTitle, setReviewTitle] = useState("");
  const [camera, setCamera] = useState("");
  const [format, setFormat] = useState("");
  const [location, setLocation] = useState("");
  const [iso, setIso] = useState("");
  const [pushPull, setPushPull] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatOptions = stock.format ?? [];

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPreviewUrls((urls) => {
        urls.forEach((u) => URL.revokeObjectURL(u));
        return [];
      });
      setRating(initialRating);
      setReviewText("");
      setReviewTitle("");
      setCamera("");
      setFormat("");
      setLocation("");
      setIso("");
      setPushPull("");
      setFiles([]);
      setDetailsOpen(false);
    }
    onOpenChange(next);
  };

  useEffect(() => {
    if (open) {
      setRating(initialRating);
      setReviewText("");
      setReviewTitle("");
      setCamera("");
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
    }
  }, [open, initialRating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      rating,
      reviewText,
      files,
      camera: camera || undefined,
      reviewTitle: reviewTitle || undefined,
      format: format || undefined,
      location: location || undefined,
      iso: iso || undefined,
      pushPull: pushPull || undefined,
    });
    handleOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const images = selected.filter((f) => f.type.startsWith("image/"));
    const next = [...files, ...images].slice(0, 10);
    setPreviewUrls((urls) => {
      urls.forEach((u) => URL.revokeObjectURL(u));
      return next.map((f) => URL.createObjectURL(f));
    });
    setFiles(next);
    e.target.value = "";
  };

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
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2",
            "overflow-hidden rounded-xl border border-border/50 bg-card shadow-lg flex flex-col",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "work-sans-content"
          )}
          aria-labelledby="add-review-title"
          aria-describedby="add-review-desc"
        >
          {/* Header: title + small image + close */}
          <div className="relative flex shrink-0 items-center gap-3 border-b border-border/50 px-6 py-4">
            <div className="flex min-h-10 min-w-10 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-muted/30">
              <StockImage stock={stock} size={40} />
            </div>
            <Dialog.Title
              id="add-review-title"
              className="flex-1 text-lg font-bold tracking-tight text-foreground min-w-0"
              style={{ fontFamily: "var(--font-work-sans), var(--font-sans), sans-serif" }}
            >
              {mode === "upload" ? "Upload images" : "Add review & photos"}
              <span className="block text-sm font-normal text-muted-foreground mt-0.5">{stock.name}</span>
            </Dialog.Title>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label="Close"
              onClick={() => handleOpenChange(false)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Full-width scrollable form */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">

                {mode === "review" && (
                  <>
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
                          "w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors",
                          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
                        )}
                      />
                    </div>
                  </>
                )}

                {/* Upload your scans — first in upload mode, after review fields in review mode */}
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
                      "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/60 bg-muted/30 py-8 transition-colors",
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
                          className="relative h-16 w-16 rounded-lg border border-border/50 bg-muted overflow-hidden"
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
                <div className="rounded-lg border border-border/50">
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
                  <Button type="submit">{mode === "upload" ? "Upload" : "Log"}</Button>
                </div>
              </form>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
