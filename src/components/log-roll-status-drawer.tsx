"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Refrigerator,
  Camera,
  FlaskConical,
  Minus,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExposuresRulerPicker } from "@/components/exposures-ruler-picker";
import { ExpiryDateMaskedInput } from "@/components/expiry-date-masked-input";

const STATUSES: { id: string; label: string; phase: string; icon: LucideIcon }[] = [
  { id: "in_fridge", label: "In Fridge", phase: "INVENTORY", icon: Refrigerator },
  { id: "in_camera", label: "In Camera", phase: "currently shooting", icon: Camera },
  { id: "awaiting_dev", label: "Processing", phase: "awaiting results", icon: FlaskConical },
];

const FORMAT_EXPOSURE_DEFAULTS: Record<string, number> = {
  "35mm": 36,
  "120": 12,
  "4x5": 2,
  "8x10": 1,
};

function getDefaultExposuresForFormat(format: string): number {
  return FORMAT_EXPOSURE_DEFAULTS[format] ?? 1;
}

export interface LogRollStatusDrawerStock {
  slug: string;
  name: string;
  format?: string[];
  image_url?: string | null;
}

export interface LogRollSavePayload {
  statusId: string;
  format: string;
  exposures: number;
  expiry: string;
  quantity: number;
  camera?: string;
  lens?: string;
  shotIso?: string;
  notes?: string;
  lab?: string;
  dateLoaded?: string;
}

interface LogRollStatusDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: LogRollStatusDrawerStock;
  onSave: (payload: LogRollSavePayload) => void;
}

export function LogRollStatusDrawer({
  open,
  onOpenChange,
  stock,
  onSave,
}: LogRollStatusDrawerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [vaultFormat, setVaultFormat] = useState<string>("");
  const [vaultExposures, setVaultExposures] = useState<number>(36);
  const [vaultExpiry, setVaultExpiry] = useState<string>("");
  const [vaultQuantity, setVaultQuantity] = useState<number>(1);

  const [camera, setCamera] = useState("");
  const [lens, setLens] = useState("");
  const [shotIso, setShotIso] = useState("");
  const [notes, setNotes] = useState("");
  const [lab, setLab] = useState("");
  const [dateLoaded, setDateLoaded] = useState("");

  const formatOptions = stock.format ?? [];

  const expiryMonth = vaultExpiry.slice(0, 2);
  const expiryYear = vaultExpiry.slice(2, 6);

  const resetForm = () => {
    setSelectedId(null);
    const firstFormat = (stock.format ?? [])[0] ?? "";
    setVaultFormat(firstFormat);
    setVaultExposures(getDefaultExposuresForFormat(firstFormat));
    setVaultExpiry("");
    setVaultQuantity(1);
    setCamera("");
    setLens("");
    setShotIso("");
    setNotes("");
    setLab("");
    setDateLoaded("");
  };

  useEffect(() => {
    if (open) {
      const firstFormat = (stock.format ?? [])[0] ?? "";
      setVaultFormat(firstFormat);
      setVaultExposures(getDefaultExposuresForFormat(firstFormat));
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stock.format]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const formatStr = `${vaultFormat}-${vaultExposures}`;
    onSave({
      statusId: selectedId,
      format: formatStr,
      exposures: vaultExposures,
      expiry: vaultExpiry ? `${expiryMonth} / ${expiryYear}`.trim() : "",
      quantity: vaultQuantity,
      camera: camera || undefined,
      lens: lens || undefined,
      shotIso: shotIso || undefined,
      notes: notes || undefined,
      lab: lab || undefined,
      dateLoaded: dateLoaded || undefined,
    });
  };

  const showExtendedFields = selectedId === "in_camera" || selectedId === "awaiting_dev";
  const dateLabel = selectedId === "awaiting_dev" ? "Date sent to lab" : "Date loaded";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showDragHandle
        showCloseButton={true}
        className="flex max-h-[90dvh] flex-col gap-0 bg-white p-0"
      >
        <SheetHeader className="flex items-center gap-3 border-b border-slate-200 px-4 pb-4 pt-2 mb-0">
          {stock.image_url ? (
            <Image
              src={stock.image_url}
              alt=""
              width={80}
              height={56}
              className="h-14 w-20 shrink-0 object-contain"
            />
          ) : (
            <div className="flex h-14 w-20 shrink-0 items-center justify-center text-slate-300">
              <Camera className="h-7 w-7" strokeWidth={1.5} />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center text-center">
            <SheetTitle
              className="text-base font-semibold tracking-tight text-foreground [font-family:var(--font-playfair),serif]"
            >
              {stock.name}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <form
            className="flex flex-col gap-5 px-4 pt-4 pb-8"
            onSubmit={handleSubmit}
          >
            {/* Status tiles */}
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map(({ id, label, phase, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedId(id)}
                  className={cn(
                    "flex h-[100px] flex-col items-center justify-center rounded-[7px] border p-3 text-center transition-all active:scale-[0.98]",
                    selectedId === id
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-slate-100 bg-background hover:border-slate-200"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <h5 className="mt-1.5 font-sans text-[13px] font-medium leading-snug text-foreground">{label}</h5>
                  <p className="text-[8px] uppercase tracking-tighter text-muted-foreground">{phase}</p>
                </button>
              ))}
            </div>

            {selectedId && (
              <div className="flex flex-col gap-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
                {/* Format */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">
                    Format
                  </label>
                  <div className="flex w-full overflow-hidden rounded-[7px] border border-slate-200 bg-background p-0.5">
                    {formatOptions.length > 0 ? (
                      formatOptions.map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => {
                            setVaultFormat(fmt);
                            setVaultExposures(getDefaultExposuresForFormat(fmt));
                          }}
                          className={cn(
                            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                            vaultFormat === fmt
                              ? "rounded-md bg-white text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {fmt}
                        </button>
                      ))
                    ) : (
                      <span className="px-4 py-2 text-sm text-muted-foreground">No formats</span>
                    )}
                  </div>
                </div>

                {/* Expiry + Quantity */}
                <div className="grid grid-cols-[2fr_1fr] gap-4">
                  <div className="flex min-w-0 flex-col">
                    <label
                      htmlFor="log-roll-expiry"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      Expiry date <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <ExpiryDateMaskedInput
                      id="log-roll-expiry"
                      value={vaultExpiry}
                      onChange={setVaultExpiry}
                      placeholder="MM / YYYY"
                      className="h-11"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <label
                      htmlFor="log-roll-quantity"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      Quantity
                    </label>
                    <div
                      id="log-roll-quantity"
                      className="inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-[7px] border border-slate-200 bg-background px-2"
                    >
                      <button
                        type="button"
                        onClick={() => setVaultQuantity((q) => Math.max(1, q - 1))}
                        className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-6 flex-1 py-2 text-center font-sans font-medium tabular-nums text-ui md:text-sm text-foreground">
                        {vaultQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVaultQuantity((q) => q + 1)}
                        className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Exposures */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Exposures
                  </label>
                  <div className="px-5">
                    <ExposuresRulerPicker
                      value={vaultExposures}
                      onChange={setVaultExposures}
                    />
                  </div>
                </div>

                {/* Extended fields for In Camera / Processing */}
                {showExtendedFields && (
                  <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 animate-in fade-in-0 duration-150">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="log-roll-camera" className="mb-1.5 block text-sm font-medium text-foreground">
                          Camera
                        </label>
                        <input
                          id="log-roll-camera"
                          type="text"
                          value={camera}
                          onChange={(e) => setCamera(e.target.value)}
                          placeholder="e.g. Canon AE-1"
                          className="h-11 w-full rounded-[7px] border border-slate-200 bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                      </div>
                      <div>
                        <label htmlFor="log-roll-lens" className="mb-1.5 block text-sm font-medium text-foreground">
                          Lens
                        </label>
                        <input
                          id="log-roll-lens"
                          type="text"
                          value={lens}
                          onChange={(e) => setLens(e.target.value)}
                          placeholder="e.g. 50mm f/1.4"
                          className="h-11 w-full rounded-[7px] border border-slate-200 bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="log-roll-shot-iso" className="mb-1.5 block text-sm font-medium text-foreground">
                          Shot ISO
                        </label>
                        <input
                          id="log-roll-shot-iso"
                          type="text"
                          inputMode="numeric"
                          value={shotIso}
                          onChange={(e) => setShotIso(e.target.value)}
                          placeholder="e.g. 1600"
                          className="h-11 w-full rounded-[7px] border border-slate-200 bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                      </div>
                      <div>
                        <label htmlFor="log-roll-date-loaded" className="mb-1.5 block text-sm font-medium text-foreground">
                          {dateLabel}
                        </label>
                        <input
                          id="log-roll-date-loaded"
                          type="date"
                          value={dateLoaded}
                          onChange={(e) => setDateLoaded(e.target.value)}
                          className="h-11 w-full rounded-[7px] border border-slate-200 bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                      </div>
                    </div>

                    {selectedId === "awaiting_dev" && (
                      <div>
                        <label htmlFor="log-roll-lab" className="mb-1.5 block text-sm font-medium text-foreground">
                          Lab
                        </label>
                        <input
                          id="log-roll-lab"
                          type="text"
                          value={lab}
                          onChange={(e) => setLab(e.target.value)}
                          placeholder="e.g. The Darkroom"
                          className="h-11 w-full rounded-[7px] border border-slate-200 bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="log-roll-notes" className="mb-1.5 block text-sm font-medium text-foreground">
                        Notes <span className="text-muted-foreground">(Optional)</span>
                      </label>
                      <textarea
                        id="log-roll-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any notes about this roll..."
                        rows={2}
                        className="w-full rounded-[7px] border border-slate-200 bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="default"
                  size="cta"
                  className="w-full rounded-xl font-bold"
                >
                  Save
                </Button>
              </div>
            )}
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
