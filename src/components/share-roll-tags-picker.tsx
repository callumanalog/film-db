"use client";

import { useCallback, useMemo, useState, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { SHARE_ROLL_POPULAR_TAGS } from "@/lib/share-roll-popular-tags";
import { shareRollPickerSectionLabelClassName } from "@/components/share-roll-picker-primitives";
import { cn } from "@/lib/utils";

function parseTagsString(s: string): string[] {
  return s
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function serializeTags(tags: string[]): string {
  return tags.join(", ");
}

function tagsFitMax(next: string[], maxLength: number): boolean {
  return serializeTags(next).length <= maxLength;
}

export function ShareRollTagsPicker({
  tags,
  onTagsChange,
  maxLength = 500,
}: {
  tags: string;
  onTagsChange: (value: string) => void;
  maxLength?: number;
}) {
  const [draft, setDraft] = useState("");

  const addedTags = useMemo(() => parseTagsString(tags), [tags]);

  const addedLower = useMemo(
    () => new Set(addedTags.map((t) => t.toLowerCase())),
    [addedTags]
  );

  const availablePopular = useMemo(
    () => SHARE_ROLL_POPULAR_TAGS.filter((p) => !addedLower.has(p.toLowerCase())),
    [addedLower]
  );

  const addCanonical = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const popularMatch = SHARE_ROLL_POPULAR_TAGS.find(
        (p) => p.toLowerCase() === trimmed.toLowerCase()
      );
      const canonical = popularMatch ?? trimmed;
      if (addedLower.has(canonical.toLowerCase())) return;

      const next = [...addedTags, canonical];
      if (!tagsFitMax(next, maxLength)) return;

      onTagsChange(serializeTags(next));
      setDraft("");
    },
    [addedLower, addedTags, maxLength, onTagsChange]
  );

  const removeAt = useCallback(
    (index: number) => {
      const next = addedTags.filter((_, i) => i !== index);
      onTagsChange(serializeTags(next));
    },
    [addedTags, onTagsChange]
  );

  const onAddTap = useCallback(() => {
    addCanonical(draft);
  }, [addCanonical, draft]);

  const onInputKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      addCanonical(draft);
    },
    [addCanonical, draft]
  );

  const canAddDraft = draft.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div
        className={cn(
          "flex h-[52px] min-h-[52px] w-full min-w-0 shrink-0 items-center rounded-card border border-border bg-background pl-3 pr-1"
        )}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="Add a tag"
          maxLength={80}
          className="min-w-0 flex-1 border-0 bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
          aria-label="Tag name"
        />
        <button
          type="button"
          disabled={!canAddDraft}
          onClick={onAddTap}
          aria-label="Add tag"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "disabled:pointer-events-none disabled:opacity-40"
          )}
        >
          <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div
        className={cn(
          "no-scrollbar min-h-0 flex-1 overflow-y-auto pb-2",
          addedTags.length > 0 && "space-y-10"
        )}
      >
        {addedTags.length > 0 ? (
          <section>
            <p className={cn(shareRollPickerSectionLabelClassName, "mb-4")}>Added tags</p>
            <div className="flex flex-wrap gap-2.5">
              {addedTags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-black py-1.5 pl-3 pr-1 text-sm font-medium text-white dark:bg-foreground dark:text-background"
                >
                  <span className="min-w-0 truncate">{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeAt(i)}
                    className="flex shrink-0 rounded-full p-1.5 text-white transition-colors hover:bg-white/15 dark:text-background dark:hover:bg-black/10"
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </button>
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className={addedTags.length > 0 ? "pt-2" : undefined}>
          <p className={cn(shareRollPickerSectionLabelClassName, "mb-4")}>Popular tags</p>
          <div className="flex flex-wrap gap-2.5">
            {availablePopular.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addCanonical(tag)}
                className={cn(
                  "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-left text-sm font-medium text-foreground transition-colors",
                  "hover:bg-muted/60 active:bg-muted dark:border-border"
                )}
              >
                <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
                <span className="min-w-0 truncate">{tag}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
