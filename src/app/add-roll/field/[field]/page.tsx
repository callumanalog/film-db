"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  addRollRouteFieldDraftKey,
  defaultAddRollMetadataDraft,
  isAddRollFieldKey,
  markAddRollMetadataSynced,
  readAddRollMetadataDraft,
  writeAddRollMetadataDraftFull,
  type AddRollFieldKey,
  type AddRollMetadataDraft,
} from "@/lib/add-roll-metadata-storage";
import { Input } from "@/components/ui/input";
import { ShotIsoStepperWithInput } from "@/components/shot-iso-controls";
import { cn } from "@/lib/utils";
import {
  mobileHeaderLeadingRowClassName,
  mobileHeaderSafeAreaStyle,
  mobileHeaderShellClassName,
  mobileHeaderTitleBlockClassName,
  mobileHeaderTitleClassName,
} from "@/lib/mobile-header";
import { topLeftNavChevronIconClassName, topLeftNavIconButtonClassName } from "@/lib/top-left-nav-icon";

const FIELD_LABELS: Record<AddRollFieldKey, string> = {
  camera: "Camera",
  location: "Location",
  lens: "Lens",
  filter: "Filter",
  lab: "Lab",
  scanner: "Scanner",
  iso: "Shot at ISO",
  format: "Format",
};

const FIELD_PLACEHOLDERS: Partial<Record<AddRollFieldKey, string>> = {
  camera: "e.g. Canon AE-1",
  location: "e.g. Wellington",
  lens: "e.g. 50mm f/1.8",
  filter: "e.g. Yellow #8",
  lab: "e.g. Home dev, The Lab",
  scanner: "e.g. Epson V600",
};

function GenericTextFieldEditor({
  field,
  title,
  placeholder,
}: {
  field: AddRollFieldKey;
  title: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [baseDraft, setBaseDraft] = useState<AddRollMetadataDraft | null>(null);

  const draftKey = addRollRouteFieldDraftKey(field);

  useEffect(() => {
    const d = readAddRollMetadataDraft() ?? defaultAddRollMetadataDraft();
    setBaseDraft(d);
    setValue(String(d[draftKey] ?? ""));
  }, [draftKey, field]);

  const save = useCallback(() => {
    if (!baseDraft) return;
    const next: AddRollMetadataDraft = { ...baseDraft, [draftKey]: value } as AddRollMetadataDraft;
    writeAddRollMetadataDraftFull(next);
    markAddRollMetadataSynced();
    router.back();
  }, [baseDraft, draftKey, value, router]);

  const canSave = useMemo(() => baseDraft !== null, [baseDraft]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className={mobileHeaderShellClassName} style={mobileHeaderSafeAreaStyle}>
        <div className={mobileHeaderLeadingRowClassName}>
          <button
            type="button"
            onClick={() => router.back()}
            className={cn(
              topLeftNavIconButtonClassName,
              "shrink-0 text-muted-foreground hover:text-foreground"
            )}
            aria-label="Back"
          >
            <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
          </button>
          <div className={mobileHeaderTitleBlockClassName}>
            <h1 className={mobileHeaderTitleClassName}>{title}</h1>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+12px))] pt-4">
        <label htmlFor={`add-roll-field-${field}`} className="sr-only">
          {title}
        </label>
        <Input
          id={`add-roll-field-${field}`}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full"
          autoFocus
        />
        <div className="mt-6">
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="flex h-11 w-full items-center justify-center rounded-[7px] bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function IsoFieldEditor() {
  const router = useRouter();
  const [shotIso, setShotIso] = useState("");
  const [baseDraft, setBaseDraft] = useState<AddRollMetadataDraft | null>(null);

  useEffect(() => {
    const d = readAddRollMetadataDraft() ?? defaultAddRollMetadataDraft();
    setBaseDraft(d);
    setShotIso(d.shotIso);
  }, []);

  const save = useCallback(() => {
    if (!baseDraft) return;
    const next: AddRollMetadataDraft = { ...baseDraft, shotIso };
    writeAddRollMetadataDraftFull(next);
    markAddRollMetadataSynced();
    router.back();
  }, [baseDraft, shotIso, router]);

  const title = FIELD_LABELS.iso;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className={mobileHeaderShellClassName} style={mobileHeaderSafeAreaStyle}>
        <div className={mobileHeaderLeadingRowClassName}>
          <button
            type="button"
            onClick={() => router.back()}
            className={cn(
              topLeftNavIconButtonClassName,
              "shrink-0 text-muted-foreground hover:text-foreground"
            )}
            aria-label="Back"
          >
            <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
          </button>
          <div className={mobileHeaderTitleBlockClassName}>
            <h1 className={mobileHeaderTitleClassName}>{title}</h1>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+12px))] pt-4">
        <label id="add-roll-iso-label" className="mb-2 block text-sm font-medium text-foreground">
          {title}
        </label>
        <ShotIsoStepperWithInput
          id="add-roll-shot-iso"
          aria-labelledby="add-roll-iso-label"
          value={shotIso}
          onChange={setShotIso}
        />
        <div className="mt-6">
          <button
            type="button"
            onClick={save}
            disabled={baseDraft === null}
            className="flex h-11 w-full items-center justify-center rounded-[7px] bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function FormatFieldEditor() {
  const router = useRouter();
  const [selectedFormat, setSelectedFormat] = useState("");
  const [baseDraft, setBaseDraft] = useState<AddRollMetadataDraft | null>(null);

  useEffect(() => {
    const d = readAddRollMetadataDraft() ?? defaultAddRollMetadataDraft();
    setBaseDraft(d);
    setSelectedFormat(d.selectedFormat);
  }, []);

  const options = baseDraft?.formatOptions ?? [];

  const save = useCallback(() => {
    if (!baseDraft) return;
    const next: AddRollMetadataDraft = { ...baseDraft, selectedFormat };
    writeAddRollMetadataDraftFull(next);
    markAddRollMetadataSynced();
    router.back();
  }, [baseDraft, selectedFormat, router]);

  const title = FIELD_LABELS.format;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className={mobileHeaderShellClassName} style={mobileHeaderSafeAreaStyle}>
        <div className={mobileHeaderLeadingRowClassName}>
          <button
            type="button"
            onClick={() => router.back()}
            className={cn(
              topLeftNavIconButtonClassName,
              "shrink-0 text-muted-foreground hover:text-foreground"
            )}
            aria-label="Back"
          >
            <ChevronLeft className={topLeftNavChevronIconClassName} strokeWidth={2} aria-hidden />
          </button>
          <div className={mobileHeaderTitleBlockClassName}>
            <h1 className={mobileHeaderTitleClassName}>{title}</h1>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-[max(1rem,calc(env(safe-area-inset-bottom,0px)+12px))] pt-4">
        {options.length === 0 ? (
          <p className="text-sm text-muted-foreground">No formats available for this stock.</p>
        ) : (
          <div className="flex min-h-[44px] w-full flex-wrap gap-2" role="listbox" aria-label={title}>
            {options.map((fmt) => (
              <button
                key={fmt}
                type="button"
                role="option"
                aria-selected={selectedFormat === fmt}
                onClick={() => setSelectedFormat(fmt)}
                className={cn(
                  "rounded-[7px] border px-3 py-2 text-sm font-medium transition-colors",
                  selectedFormat === fmt
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/50 bg-background text-foreground/80 hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                {fmt}
              </button>
            ))}
          </div>
        )}
        <div className="mt-6">
          <button
            type="button"
            onClick={save}
            disabled={baseDraft === null}
            className="flex h-11 w-full items-center justify-center rounded-[7px] bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddRollFieldPage() {
  const params = useParams();
  const raw = params.field;
  const fieldParam = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const field = isAddRollFieldKey(fieldParam) ? fieldParam : null;

  if (!field) {
    notFound();
  }

  if (field === "iso") {
    return <IsoFieldEditor />;
  }
  if (field === "format") {
    return <FormatFieldEditor />;
  }

  const title = FIELD_LABELS[field];
  const placeholder = FIELD_PLACEHOLDERS[field] ?? "";

  return <GenericTextFieldEditor field={field} title={title} placeholder={placeholder} />;
}
