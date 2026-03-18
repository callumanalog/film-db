"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XIcon } from "lucide-react";

const TRACK_STATUSES = [
  "In Fridge",
  "In camera",
  "Awaiting development",
  "Developed",
] as const;

export interface TrackFilmModalStock {
  slug: string;
  name: string;
  brand: { name: string; slug: string };
  format: string[];
  image_url: string | null;
}

interface TrackFilmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: { format: string; status: string; expiryDate: string; notes: string }) => void;
  stock: TrackFilmModalStock;
  /** When set, pre-fill the status field when the modal opens (e.g. from mobile status drawer). */
  initialStatus?: string;
  /** When set, pre-fill the format field when the modal opens (e.g. from mobile format step). */
  initialFormat?: string;
}

function StockImage({ stock, size = 80 }: { stock: TrackFilmModalStock; size?: number }) {
  if (stock.image_url) {
    return (
      <Image
        src={stock.image_url}
        alt={stock.name}
        width={size}
        height={size}
        className="h-full w-full object-contain"
      />
    );
  }
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-card bg-muted">
      <Camera className="h-10 w-10 text-muted-foreground/40" />
    </div>
  );
}

export function TrackFilmModal({ open, onOpenChange, onSave, stock, initialStatus, initialFormat }: TrackFilmModalProps) {
  const [format, setFormat] = useState("");
  const [status, setStatus] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      if (initialStatus) setStatus(initialStatus);
      if (initialFormat) setFormat(initialFormat);
    }
  }, [open, initialStatus, initialFormat]);

  const formatOptions = stock.format ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ format, status, expiryDate, notes });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "overflow-hidden rounded-[7px] border border-border/50 bg-card shadow-lg",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          )}
          aria-labelledby="track-film-title"
          aria-describedby="track-film-desc"
        >
          <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-card border border-border/50 bg-muted">
                  <StockImage stock={stock} />
                </div>
                <div className="min-w-0">
                  <Dialog.Title
                    id="track-film-title"
                    className="text-lg font-bold tracking-tight text-foreground truncate"
                  >
                    {stock.name}
                  </Dialog.Title>
                  <Dialog.Description id="track-film-desc" className="text-sm text-muted-foreground mt-0.5">
                    Track this film stock
                  </Dialog.Description>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="track-format" className="mb-1.5 block text-sm font-medium text-foreground">
                  Format
                </label>
                <Select value={format} onValueChange={(v) => setFormat(v ?? "")} name="format">
                  <SelectTrigger id="track-format" className="w-full">
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

              <div>
                <label htmlFor="track-status" className="mb-1.5 block text-sm font-medium text-foreground">
                  Status
                </label>
                <Select value={status} onValueChange={(v) => setStatus(v ?? "")} name="status">
                  <SelectTrigger id="track-status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRACK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <TextField
                id="track-expiry"
                label="Expiry date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />

              <div>
                <label htmlFor="track-notes" className="mb-1.5 block text-sm font-medium text-foreground">
                  Notes
                </label>
                <textarea
                  id="track-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                  rows={3}
                  className={cn(
                    "w-full rounded-card border border-input bg-transparent px-2.5 py-2 text-sm transition-colors",
                    "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring"
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
