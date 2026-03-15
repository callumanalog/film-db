"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Refrigerator,
  Camera,
  FlaskConical,
  CircleCheck,
  ChevronLeft,
  Minus,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ExposuresRulerPicker } from "@/components/exposures-ruler-picker";

const STATUSES: { id: string; label: string; phase: string; icon: LucideIcon }[] = [
  { id: "in_fridge", label: "In Fridge", phase: "INVENTORY", icon: Refrigerator },
  { id: "in_camera", label: "In Camera", phase: "currently shooting", icon: Camera },
  { id: "awaiting_dev", label: "Processing", phase: "awaiting results", icon: FlaskConical },
  { id: "at_lab", label: "Scanned", phase: "completed roll", icon: CircleCheck },
];

/** Default exposure count when a format is selected. */
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

export interface InFridgePayload {
  expiry: string;
  quantity: number;
}

interface LogRollStatusDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: LogRollStatusDrawerStock;
  onContinue: (statusId: string, format?: string, payload?: InFridgePayload) => void;
}

export function LogRollStatusDrawer({
  open,
  onOpenChange,
  stock,
  onContinue,
}: LogRollStatusDrawerProps) {
  const [step, setStep] = useState<"status" | "format">("status");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // In Fridge step 2 form state
  const [vaultFormat, setVaultFormat] = useState<string>(() => (stock.format ?? [])[0] ?? "");
  const [vaultExposures, setVaultExposures] = useState<number>(36);
  const [vaultExpiry, setVaultExpiry] = useState<string>("");
  const [vaultQuantity, setVaultQuantity] = useState<number>(1);

  const formatOptions = stock.format ?? [];

  useEffect(() => {
    if (open) {
      const firstFormat = (stock.format ?? [])[0] ?? "";
      setVaultFormat(firstFormat);
      setVaultExposures(getDefaultExposuresForFormat(firstFormat));
    } else {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
      setStep("status");
      setSelectedId(null);
      setSelectedFormat("");
      const firstFormat = (stock.format ?? [])[0] ?? "";
      setVaultFormat(firstFormat);
      setVaultExposures(getDefaultExposuresForFormat(firstFormat));
      setVaultExpiry("");
      setVaultQuantity(1);
    }
  }, [open, stock.format]);

  const handleTileClick = (id: string) => {
    setSelectedId(id);
    setSelectedFormat("");
    if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      setStep("format");
    }, 800);
  };

  const handleBack = () => {
    setStep("status");
    setSelectedId(null);
    setSelectedFormat("");
    const firstFormat = (stock.format ?? [])[0] ?? "";
    setVaultFormat(firstFormat);
    setVaultExposures(getDefaultExposuresForFormat(firstFormat));
    setVaultExpiry("");
    setVaultQuantity(1);
  };

  const handleDone = () => {
    if (!selectedId) return;
    onContinue(selectedId, selectedFormat || undefined);
    onOpenChange(false);
    setSelectedId(null);
    setSelectedFormat("");
    const firstFormat = (stock.format ?? [])[0] ?? "";
    setVaultFormat(firstFormat);
    setVaultExposures(getDefaultExposuresForFormat(firstFormat));
    setVaultExpiry("");
    setVaultQuantity(1);
    setStep("status");
  };

  const handleInFridgeSubmit = () => {
    const formatStr = `${vaultFormat}-${vaultExposures}`;
    onContinue("in_fridge", formatStr, { expiry: vaultExpiry, quantity: vaultQuantity });
    onOpenChange(false);
    setSelectedId(null);
    setSelectedFormat("");
    const firstFormat = (stock.format ?? [])[0] ?? "";
    setVaultFormat(firstFormat);
    setVaultExposures(getDefaultExposuresForFormat(firstFormat));
    setVaultExpiry("");
    setVaultQuantity(1);
    setStep("status");
  };

  const selectedStatusLabel = STATUSES.find((s) => s.id === selectedId)?.label ?? "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showDragHandle
        showCloseButton={true}
        className="flex max-h-[90dvh] flex-col gap-0 bg-white p-0"
      >
        {/* Back button: same size/color as close (absolute top-3 left-4), icon only */}
        {step === "format" ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute left-3 top-3 z-10"
            onClick={handleBack}
            aria-label="Back to status"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        ) : null}
        {/* Permanent header: identity + contextual dek */}
        <SheetHeader className="flex items-center gap-3 border-b border-slate-200 px-4 pb-4 pt-2 mb-4">
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
              className={cn(
                "text-base font-semibold tracking-tight text-foreground [font-family:var(--font-playfair),serif]"
              )}
            >
              {stock.name}
            </SheetTitle>
            {step === "status" ? (
              <p className="mt-1 font-sans text-ui font-medium tracking-tight text-muted-foreground">
                Select the status of your roll
              </p>
            ) : selectedId ? (
              (() => {
                const s = STATUSES.find((x) => x.id === selectedId);
                if (!s) return null;
                const Icon = s.icon;
                return (
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-background px-3 py-1">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {s.label}
                    </span>
                  </div>
                );
              })()
            ) : null}
          </div>
        </SheetHeader>

        {/* Step content: contextual dek + body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-8">
          {step === "status" ? (
            <div
              key="status"
              className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
            >
              <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(({ id, label, phase, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTileClick(id)}
                  className={cn(
                    "flex h-[120px] flex-col items-center justify-center rounded-[7px] border p-4 text-center transition-all active:scale-[0.98]",
                    selectedId === id
                      ? "border-primary bg-primary/10 ring-1 ring-primary"
                      : "border-slate-100 bg-background hover:border-slate-200"
                  )}
                >
                  <Icon className="h-6 w-6 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <h5 className="mt-2 font-sans text-ui font-medium leading-snug text-foreground">{label}</h5>
                  <p className="text-[8px] uppercase tracking-tighter text-muted-foreground">{phase}</p>
                </button>
              ))}
              </div>
            </div>
          ) : selectedId === "in_fridge" ? (
            <div
              key="in-fridge"
              className="animate-in fade-in-0 slide-in-from-right-10 duration-200"
            >
              <form
                className="mt-6 space-y-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInFridgeSubmit();
                }}
              >
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
                <div className="grid grid-cols-[1fr_auto] gap-4">
                  <div>
                    <label
                      htmlFor="log-roll-expiry"
                      className="mb-2 block text-sm font-medium text-foreground"
                    >
                      Expiry <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      id="log-roll-expiry"
                      type="text"
                      inputMode="numeric"
                      placeholder="MM / YYYY"
                      value={vaultExpiry}
                      onChange={(e) => setVaultExpiry(e.target.value)}
                      className="w-full rounded-[7px] border border-slate-200 bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Quantity
                    </label>
                    <div className="inline-flex items-center overflow-hidden rounded-[7px] border border-slate-200 bg-background">
                      <button
                        type="button"
                        onClick={() => setVaultQuantity((q) => Math.max(1, q - 1))}
                        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2rem] py-2 text-center font-medium tabular-nums">
                        {vaultQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setVaultQuantity((q) => q + 1)}
                        className="flex h-10 w-10 items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                      Exposures
                    </label>
                    <ExposuresRulerPicker
                      value={vaultExposures}
                      onChange={setVaultExposures}
                    />
                  </div>
                <Button
                  type="submit"
                  variant="default"
                  size="cta"
                  className="w-full rounded-xl font-bold"
                >
                  Save
                </Button>
              </form>
            </div>
          ) : (
            <div
              key="format"
              className="animate-in fade-in-0 slide-in-from-right-10 duration-200"
            >
              <div className="flex flex-1 flex-col gap-4">
                <p className="text-xs text-muted-foreground">Status: {selectedStatusLabel}</p>
                <div>
                  <label
                    htmlFor="log-roll-format"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Format
                  </label>
                  <Select value={selectedFormat} onValueChange={(v) => setSelectedFormat(v ?? "")}>
                    <SelectTrigger id="log-roll-format" className="w-full">
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
                <Button
                  type="button"
                  variant="secondary"
                  size="cta"
                  className="mt-4 w-full"
                  onClick={handleDone}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
