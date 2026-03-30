"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, GripVertical, Search, X } from "lucide-react";
import { getSuggestedStocks, type SearchStocksResult } from "@/app/actions/search";
import {
  createStockList,
  getStockListDetailForViewer,
  updateStockListMeta,
  replaceStockListItems,
} from "@/app/actions/stock-lists";
import { showToastViaEvent } from "@/components/toast";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { useVisualViewportBox } from "@/lib/use-visual-viewport-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TITLE_MAX = 200;
const DESC_MAX = 2000;
const TAG_MAX = 10;

const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

const STOCK_LIST_FORM_HTML_ID = "stock-list-form-fields";

type DraftStock = SearchStocksResult;

export function StockListFormClient({ mode, listId }: { mode: "create" | "edit"; listId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetSlug = searchParams.get("addStock")?.trim() || searchParams.get("presetSlug")?.trim() || "";
  const { user, loading: authLoading } = useAuth();

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const viewportOverlay = useVisualViewportBox();
  const [loading, setLoading] = useState(mode === "edit");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggested, setSuggested] = useState<Awaited<ReturnType<typeof getSuggestedStocks>> | null>(null);
  const [items, setItems] = useState<DraftStock[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragSlug, setDragSlug] = useState<string | null>(null);
  const [presetApplied, setPresetApplied] = useState(false);

  useEffect(() => {
    document.body.classList.add("list-form-fullscreen");
    return () => document.body.classList.remove("list-form-fullscreen");
  }, []);

  const loadEdit = useCallback(async () => {
    if (mode !== "edit" || !listId || !user) return;
    setLoading(true);
    try {
      const payload = await getStockListDetailForViewer(listId);
      if (!payload.ok) {
        showToastViaEvent("List not found.");
        router.replace("/profile");
        return;
      }
      if (payload.list.ownerUserId !== user.id) {
        showToastViaEvent("You can only edit your own lists.");
        router.replace(`/lists/${listId}`);
        return;
      }
      setTitle(payload.list.title);
      setDescription(payload.list.description ?? "");
      setTags(payload.list.tags ?? []);
      const slugs = payload.orderedSlugs;
      if (slugs.length === 0) {
        setItems([]);
        return;
      }
      const sug = await getSuggestedStocks();
      const bySlug = new Map(sug.allStocks.map((s) => [s.slug, s]));
      const ordered: DraftStock[] = [];
      for (const s of slugs) {
        const row = bySlug.get(s);
        if (row) ordered.push(row);
      }
      setItems(ordered);
    } finally {
      setLoading(false);
    }
  }, [mode, listId, router, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const next = mode === "edit" && listId ? `/lists/${listId}/edit` : "/lists/new";
      const q = presetSlug ? `?addStock=${encodeURIComponent(presetSlug)}` : "";
      router.replace(`/auth/sign-in?next=${encodeURIComponent(next + q)}`);
      return;
    }
    if (mode === "edit") void loadEdit();
  }, [authLoading, user, router, mode, listId, loadEdit, presetSlug]);

  useEffect(() => {
    getSuggestedStocks().then(setSuggested);
  }, []);

  useEffect(() => {
    setPresetApplied(false);
  }, [presetSlug]);

  useEffect(() => {
    if (mode !== "create" || !presetSlug || !suggested || presetApplied) return;
    const found = suggested.allStocks.find((s) => s.slug === presetSlug);
    if (found) {
      setItems((prev) => (prev.some((i) => i.slug === presetSlug) ? prev : [...prev, found]));
    }
    setPresetApplied(true);
  }, [mode, presetSlug, suggested, presetApplied]);

  const filteredSearch = useMemo(() => {
    if (!suggested?.allStocks) return [];
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return suggested.allStocks
      .filter((s) => s.name.toLowerCase().includes(q) || s.brandName.toLowerCase().includes(q))
      .filter((s) => !items.some((i) => i.slug === s.slug))
      .slice(0, 12);
  }, [suggested, search, items]);

  const showSearchDropdown = searchFocused && search.trim().length > 0;

  useEffect(() => {
    if (!showSearchDropdown) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = searchWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [showSearchDropdown]);

  function commitTagFragment(fragment: string) {
    const t = fragment.replace(/,\s*$/, "").trim();
    if (!t) return;
    if (tags.length >= TAG_MAX) {
      showToastViaEvent(`Maximum ${TAG_MAX} tags.`);
      return;
    }
    const key = t.toLowerCase();
    if (tags.some((x) => x.toLowerCase() === key)) return;
    setTags((prev) => [...prev, t.slice(0, 40)]);
  }

  function onTagInputChange(v: string) {
    if (v.endsWith(", ") && tagInput.length < v.length) {
      commitTagFragment(tagInput);
      setTagInput("");
      return;
    }
    setTagInput(v);
  }

  function onTagInputBlur() {
    const t = tagInput.trim();
    if (t) commitTagFragment(t);
    setTagInput("");
  }

  function addStock(s: DraftStock) {
    setItems((prev) => {
      if (prev.some((i) => i.slug === s.slug)) return prev;
      return [...prev, s];
    });
    setSearch("");
    setSearchFocused(true);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  function removeStock(slug: string) {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }

  function moveItem(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      const [x] = next.splice(from, 1);
      next.splice(to, 0, x);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      showToastViaEvent("Enter a title.");
      return;
    }
    if (items.length === 0) {
      showToastViaEvent("Add at least one film stock.");
      return;
    }
    const slugs = items.map((i) => i.slug);
    const finalTags = [...tags];
    const pendingTag = tagInput.trim();
    if (pendingTag) {
      const pt = pendingTag.slice(0, 40);
      const key = pt.toLowerCase();
      if (finalTags.length < TAG_MAX && !finalTags.some((x) => x.toLowerCase() === key)) {
        finalTags.push(pt);
      }
    }
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await createStockList(t, description.trim() || null, finalTags, slugs);
        if (!res.ok) {
          showToastViaEvent(res.error === "validation" ? "Check the form and try again." : "Could not create list.");
          return;
        }
        showToastViaEvent("List published.");
        router.push(`/lists/${res.listId}`);
        router.refresh();
      } else {
        const id = listId?.trim();
        if (!id) return;
        const meta = await updateStockListMeta(id, t, description.trim() || null, finalTags);
        if (!meta.ok) {
          showToastViaEvent(meta.error === "not_found" ? "List not found." : "Could not update list.");
          return;
        }
        const rep = await replaceStockListItems(id, slugs);
        if (!rep.ok) {
          showToastViaEvent("Could not update stocks in list.");
          return;
        }
        showToastViaEvent("List updated.");
        router.push(`/lists/${id}`);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  const headerTitle = mode === "create" ? "Create a new list" : "Edit list";

  const overlayShellStyle =
    viewportOverlay != null
      ? { top: viewportOverlay.top, height: viewportOverlay.height }
      : undefined;
  const overlayPositionClass =
    viewportOverlay != null ? "fixed left-0 right-0" : "fixed inset-0";

  if (authLoading || !user || loading) {
    return (
      <div
        className={cn(
          overlayPositionClass,
          "z-[60] flex min-h-0 flex-col items-center justify-center bg-white dark:bg-background"
        )}
        style={
          overlayShellStyle
            ? { ...overlayShellStyle, paddingTop: "env(safe-area-inset-top, 0px)" }
            : { paddingTop: "env(safe-area-inset-top, 0px)" }
        }
      >
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <>
      {/*
        Panel sized to the visual viewport (above keyboard). Footer is a sibling
        fixed to the layout viewport bottom so the keyboard overlays it (overlays-content).
      */}
      <div
        className={cn(overlayPositionClass, "z-[60] flex min-h-0 flex-col bg-white dark:bg-background")}
        style={overlayShellStyle}
      >
        <header
          className="shrink-0 border-b border-border/60 bg-white dark:bg-background"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4 sm:h-16 sm:px-6">
            <Link
              href={mode === "edit" && listId ? `/lists/${listId}` : "/profile"}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted/80"
              aria-label="Back"
            >
              <ChevronLeft className="h-6 w-6" strokeWidth={2} />
            </Link>
            <h1 className="min-w-0 flex-1 text-center font-sans text-base font-semibold text-foreground sm:text-lg">
              {headerTitle}
            </h1>
            <span className="h-11 w-11 shrink-0" aria-hidden />
          </div>
        </header>

        <form
          id={STOCK_LIST_FORM_HTML_ID}
          onSubmit={(e) => void handleSubmit(e)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div
            className="mx-auto min-h-0 w-full max-w-2xl flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:px-6"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
          <div className="space-y-5">
            <div>
              <label htmlFor="sl-title" className="text-field-label mb-1 block">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="sl-title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                placeholder="My great new list"
                className="rounded-card border-0 bg-muted/50"
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="sl-desc" className="text-field-label mb-1 block">
                Description
              </label>
              <textarea
                id="sl-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                placeholder="What is this list about?"
                rows={5}
                className="border-input bg-muted/50 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-card border-0 px-3 py-2.5 text-sm outline-none focus-visible:ring-[3px]"
              />
            </div>

            <div>
              <span className="text-field-label mb-1 block">Tags</span>
              <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-card bg-muted/50 px-2 py-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-foreground ring-1 ring-border/60"
                  >
                    {tag}
                    <button
                      type="button"
                      className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Remove ${tag}`}
                      onClick={() => setTags((prev) => prev.filter((x) => x !== tag))}
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
                {tags.length < TAG_MAX ? (
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => onTagInputChange(e.target.value)}
                    onBlur={() => onTagInputBlur()}
                    placeholder={tags.length === 0 ? "Add tags…" : ""}
                    className="min-w-[120px] flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
                  />
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Type a comma and space to add a tag. Max {TAG_MAX}.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-field-label">Stocks</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div ref={searchWrapRef} className="relative z-10">
                <Search className="pointer-events-none absolute left-3 top-1/2 z-[1] size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => {
                    setSearchFocused(true);
                    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                      requestAnimationFrame(() => {
                        searchWrapRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
                      });
                    }
                  }}
                  placeholder="Search for a stock to add…"
                  className="rounded-card border-0 bg-muted/50 pl-9"
                  autoComplete="off"
                  aria-expanded={showSearchDropdown}
                  aria-controls={showSearchDropdown ? "stock-search-results" : undefined}
                />
                {showSearchDropdown ? (
                  <div
                    id="stock-search-results"
                    className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-card border border-border/60 bg-card py-1 shadow-lg"
                  >
                    {filteredSearch.length === 0 ? (
                      <p className="px-3 py-3 text-center text-sm text-muted-foreground">No matching stocks.</p>
                    ) : (
                      <ul className="flex flex-col">
                        {filteredSearch.map((s) => (
                          <li key={s.slug}>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-muted/60"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => addStock(s)}
                            >
                              <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
                                {s.imageUrl ? (
                                  <Image
                                    src={s.imageUrl}
                                    alt=""
                                    width={44}
                                    height={44}
                                    className="size-full object-contain"
                                    sizes="44px"
                                    placeholder="blur"
                                    blurDataURL={BLUR_DATA_URL}
                                  />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1 font-medium text-foreground">{s.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-card border border-dashed border-border/60 bg-white p-3 dark:bg-background">
                {items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">Your list is empty.</p>
                ) : (
                  <ul className="flex flex-col gap-0">
                    {items.map((s, idx) => (
                      <li
                        key={s.slug}
                        draggable
                        onDragStart={() => setDragSlug(s.slug)}
                        onDragEnd={() => setDragSlug(null)}
                        onDragOver={(ev) => ev.preventDefault()}
                        onDrop={() => {
                          if (!dragSlug || dragSlug === s.slug) return;
                          const from = items.findIndex((i) => i.slug === dragSlug);
                          if (from < 0) return;
                          moveItem(from, idx);
                          setDragSlug(null);
                        }}
                        className={cn(
                          "flex items-center gap-2 border-b border-border/40 py-2.5 last:border-b-0",
                          dragSlug === s.slug && "opacity-50"
                        )}
                      >
                        <span
                          className="cursor-grab touch-manipulation text-muted-foreground active:cursor-grabbing"
                          aria-hidden
                        >
                          <GripVertical className="size-5" />
                        </span>
                        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
                          {s.imageUrl ? (
                            <Image
                              src={s.imageUrl}
                              alt=""
                              width={44}
                              height={44}
                              className="size-full object-contain"
                              sizes="44px"
                              placeholder="blur"
                              blurDataURL={BLUR_DATA_URL}
                            />
                          ) : null}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                        </div>
                        <button
                          type="button"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label={`Remove ${s.name}`}
                          onClick={() => removeStock(s.slug)}
                        >
                          <X className="size-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
        </form>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border/60 bg-white px-4 py-3 dark:bg-background sm:px-6"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto max-w-2xl">
          <Button
            type="submit"
            form={STOCK_LIST_FORM_HTML_ID}
            size="cta"
            variant="default"
            className="w-full"
            disabled={saving}
          >
            {saving ? "Saving…" : mode === "create" ? "Publish list" : "Save changes"}
          </Button>
        </div>
      </div>
    </>
  );
}
