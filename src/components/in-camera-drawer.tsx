"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface InCameraDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockName: string;
  stockFormats: string[];
  onSave: (metadata: { camera?: string; format?: string }) => void;
}

export function InCameraDrawer({ open, onOpenChange, stockName, stockFormats, onSave }: InCameraDrawerProps) {
  const [camera, setCamera] = useState("");
  const [format, setFormat] = useState(stockFormats[0] ?? "");

  const handleSave = () => {
    onSave({ camera: camera.trim() || undefined, format: format || undefined });
    setCamera("");
    setFormat(stockFormats[0] ?? "");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-0 pb-8">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            In Camera
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Mark {stockName} as currently loaded. Add optional details.
          </p>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div>
            <label htmlFor="ic-camera" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Camera (optional)
            </label>
            <input
              id="ic-camera"
              type="text"
              value={camera}
              onChange={(e) => setCamera(e.target.value)}
              placeholder="e.g. Canon AE-1"
              className="mt-1.5 w-full rounded-[7px] border border-border/50 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {stockFormats.length > 1 && (
            <div>
              <label htmlFor="ic-format" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Format
              </label>
              <select
                id="ic-format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="mt-1.5 w-full rounded-[7px] border border-border/50 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {stockFormats.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-[7px] bg-foreground py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-[7px] border border-border/50 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50"
            >
              Cancel
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
