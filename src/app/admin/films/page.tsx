"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { FilmStock, FilmBrand, FilmType, BestFor, GrainLevel, ContrastLevel, LatitudeLevel, DevelopmentProcess } from "@/lib/types";
import { FILM_TYPE_LABELS, BEST_FOR_LABELS, GRAIN_LABELS, CONTRAST_LABELS, LATITUDE_LABELS, DEVELOPMENT_PROCESS_LABELS } from "@/lib/types";
import { urlToWebReview, urlToVideoReview } from "@/lib/review-url-utils";
import { ChevronLeft, Save, RotateCcw, Pencil, X, Plus, Trash2 } from "lucide-react";

type StockRow = FilmStock & { brand: FilmBrand };

const TYPE_OPTIONS: FilmType[] = ["color_negative", "color_reversal", "bw_negative", "bw_reversal", "instant"];
const GRAIN_OPTIONS: GrainLevel[] = ["fine", "medium", "strong"];
const CONTRAST_OPTIONS: ContrastLevel[] = ["low", "medium", "high"];
const LATITUDE_OPTIONS: (LatitudeLevel | "")[] = ["", "very_narrow", "narrow", "moderate", "wide", "very_wide"];
const DEVELOPMENT_PROCESS_OPTIONS: (DevelopmentProcess | "")[] = ["", "c41", "e6", "bw", "ecn2"];
const BEST_FOR_OPTIONS: BestFor[] = ["portrait", "landscape", "street", "wedding", "travel", "night", "studio", "everyday"];

export default function AdminFilmsPage() {
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [brands, setBrands] = useState<FilmBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<StockRow | null>(null);
  const [stockToDelete, setStockToDelete] = useState<StockRow | null>(null);
  const [usingFile, setUsingFile] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [reviewsBySlug, setReviewsBySlug] = useState<Record<string, { web: { title: string; site: string; url: string }[]; video: { title: string; channel: string; url: string }[] }>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stocksRes, brandsRes] = await Promise.all([
        fetch("/api/admin/film-stocks"),
        fetch("/api/admin/brands").catch(() => null),
      ]);
      if (!stocksRes.ok) throw new Error("Failed to load stocks");
      const data = await stocksRes.json();
      setStocks(data);
      if (brandsRes?.ok) {
        const b = await brandsRes.json();
        setBrands(b);
      } else {
        const byId = new Map<string, FilmBrand>();
        data.forEach((s: StockRow) => s.brand && byId.set(s.brand.id, s.brand));
        setBrands(Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)));
      }
      const fileCheck = await fetch("/api/admin/film-stocks/source").catch(() => null);
      if (fileCheck?.ok) {
        const { source } = await fileCheck.json();
        setUsingFile(source === "file");
      }
      const imagesRes = await fetch("/api/admin/film-images").catch(() => null);
      if (imagesRes?.ok) {
        const list = await imagesRes.json();
        setAvailableImages(Array.isArray(list) ? list : []);
      }
      const reviewsRes = await fetch("/api/admin/film-reviews").catch(() => null);
      if (reviewsRes?.ok) {
        const rev = await reviewsRes.json();
        setReviewsBySlug(rev && typeof rev === "object" && !Array.isArray(rev) ? rev : {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveAll() {
    setSaving(true);
    try {
      const brandsRes = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brands),
      });
      if (!brandsRes.ok) throw new Error((await brandsRes.json()).error || "Save brands failed");
      const res = await fetch("/api/admin/film-stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stocks),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      const reviewsRes = await fetch("/api/admin/film-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewsBySlug),
      });
      if (!reviewsRes.ok) throw new Error((await reviewsRes.json()).error || "Save reviews failed");
      setUsingFile(true);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetToSeed() {
    if (!confirm("Remove the editable file and use seed data again?")) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/film-stocks", { method: "DELETE" });
      if (!res.ok) throw new Error("Reset failed");
      setUsingFile(false);
      setEditing(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setSaving(false);
    }
  }

  function updateEditing(field: keyof FilmStock, value: unknown) {
    if (!editing) return;
    setEditing((prev) => (prev ? { ...prev, [field]: value } : null));
  }

  function applyEditingToStocks() {
    if (!editing) return;
    setStocks((prev) => prev.map((s) => (s.id === editing.id ? editing : s)));
    setEditing(null);
  }

  /** Assign the stock being edited to a brand by name (existing or new). Never renames an existing brand. */
  function handleAssignBrandByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed || !editing) return;
    const existing = brands.find((b) => b.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setEditing((prev) => (prev ? { ...prev, brand_id: existing.id, brand: existing } : null));
      return;
    }
    const slug = trimmed.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "brand";
    const id = `brand-${slug}-${Date.now()}`;
    const newBrand: FilmBrand = {
      id,
      name: trimmed,
      slug,
      logo_url: null,
      description: null,
      website_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBrands((prev) => [...prev, newBrand]);
    setEditing((prev) => (prev ? { ...prev, brand_id: id, brand: newBrand } : null));
  }

  function handleAddStock() {
    const firstBrand = brands[0];
    const brandId = firstBrand?.id ?? "brand-kodak";
    const brand = firstBrand ?? { id: brandId, name: "Kodak", slug: "kodak", logo_url: null, description: null, website_url: null, created_at: "", updated_at: "" };
    const ts = Date.now();
    const newStock: StockRow = {
      id: `stock-new-${ts}`,
      name: "New film stock",
      slug: `new-stock-${ts}`,
      brand_id: brandId,
      format: ["35mm"],
      type: "color_negative",
      iso: 400,
      description: null,
      history: null,
      shooting_tips: null,
      grain: null,
      contrast: null,
      latitude: null,
      color_palette: null,
      grain_level: "medium",
      contrast_level: "medium",
      best_for: [],
      discontinued: false,
      price_tier: null,
      base_price_usd: null,
      image_url: null,
      year_introduced: null,
      rating: 4,
      featured: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      brand,
    };
    setStocks((prev) => [...prev, newStock]);
    setEditing(newStock);
  }

  function handleDeleteStock(stock: StockRow) {
    setStockToDelete(stock);
  }

  function confirmDeleteStock() {
    if (!stockToDelete) return;
    setStocks((prev) => prev.filter((s) => s.id !== stockToDelete.id));
    if (editing?.id === stockToDelete.id) setEditing(null);
    setReviewsBySlug((prev) => {
      const next = { ...prev };
      delete next[stockToDelete.slug];
      return next;
    });
    setStockToDelete(null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/films"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Film Stocks
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Edit film stocks</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Source: {usingFile ? "data/film-stocks.json" : "seed-data.ts"}
          </span>
          {usingFile && (
            <button
              type="button"
              onClick={handleResetToSeed}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset to seed
            </button>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> Save all to file
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {stocks.length} stocks. Edit a row below and click &quot;Save all to file&quot; to write to{" "}
        <code className="rounded bg-muted px-1">data/film-stocks.json</code>. The site will use this file until you
        &quot;Reset to seed&quot;.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border/50 bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/50">
              <th className="px-3 py-2 font-semibold">Brand</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Slug</th>
              <th className="px-3 py-2 font-semibold">ISO</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Rating</th>
              <th className="px-3 py-2 font-semibold">Discontinued</th>
              <th className="w-28 px-3 py-2 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...stocks]
              .sort((a, b) => {
                const brandA = (a.brand?.name ?? "").toLowerCase();
                const brandB = (b.brand?.name ?? "").toLowerCase();
                if (brandA !== brandB) return brandA.localeCompare(brandB);
                return (a.name ?? "").toLowerCase().localeCompare((b.name ?? "").toLowerCase());
              })
              .map((stock) => (
              <tr key={stock.id} className="border-b border-border/30 hover:bg-muted/30">
                <td className="px-3 py-2">{stock.brand?.name ?? "—"}</td>
                <td className="px-3 py-2 font-medium">{stock.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{stock.slug}</td>
                <td className="px-3 py-2">{stock.iso}</td>
                <td className="px-3 py-2">{FILM_TYPE_LABELS[stock.type]}</td>
                <td className="px-3 py-2">{stock.rating.toFixed(1)}</td>
                <td className="px-3 py-2">{stock.discontinued ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditing({ ...stock })}
                      className="inline-flex items-center gap-1 rounded border border-border/50 bg-background px-2 py-1 text-xs font-medium hover:bg-muted"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStock(stock)}
                      className="inline-flex items-center gap-1 rounded border border-red-200 bg-background px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/50"
                      title="Delete this film stock"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleAddStock}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:border-primary/40"
        >
          <Plus className="h-4 w-4" /> Add film stock
        </button>
      </div>

      {stockToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setStockToDelete(null)}>
          <div
            className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-foreground">Delete film stock?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Delete &quot;{stockToDelete.name}&quot;? It will be removed from the list. Click &quot;Save all to file&quot; to persist the change.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStockToDelete(null)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteStock}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {editing && (
        <EditPanel
          stock={editing}
          brands={brands}
          setBrands={setBrands}
          onAssignBrandByName={handleAssignBrandByName}
          availableImages={availableImages}
          reviewsWeb={reviewsBySlug[editing.slug]?.web ?? []}
          reviewsVideo={reviewsBySlug[editing.slug]?.video ?? []}
          onUpdateReviews={(web, video) => setReviewsBySlug((prev) => ({ ...prev, [editing.slug]: { web, video } }))}
          onUpdate={updateEditing}
          onClose={() => setEditing(null)}
          onApply={applyEditingToStocks}
        />
      )}
    </div>
  );
}

function EditPanel({
  stock,
  brands,
  setBrands,
  onAssignBrandByName,
  availableImages,
  reviewsWeb,
  reviewsVideo,
  onUpdateReviews,
  onUpdate,
  onClose,
  onApply,
}: {
  stock: StockRow;
  brands: FilmBrand[];
  setBrands: React.Dispatch<React.SetStateAction<FilmBrand[]>>;
  onAssignBrandByName: (name: string) => void;
  availableImages: string[];
  reviewsWeb: { title: string; site: string; url: string }[];
  reviewsVideo: { title: string; channel: string; url: string }[];
  onUpdateReviews: (web: { title: string; site: string; url: string }[], video: { title: string; channel: string; url: string }[]) => void;
  onUpdate: (field: keyof FilmStock, value: unknown) => void;
  onClose: () => void;
  onApply: () => void;
}) {
  const [brandInputValue, setBrandInputValue] = useState(stock.brand?.name ?? "");
  useEffect(() => {
    setBrandInputValue(stock.brand?.name ?? "");
  }, [stock.brand?.id, stock.brand?.name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Edit: {stock.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Name</span>
            <input
              type="text"
              value={stock.name}
              onChange={(e) => onUpdate("name", e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Slug</span>
            <input
              type="text"
              value={stock.slug}
              onChange={(e) => onUpdate("slug", e.target.value)}
              className="rounded border border-border bg-background px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Brand</span>
            <input
              type="text"
              list="edit-panel-brand-list"
              value={brandInputValue}
              onChange={(e) => setBrandInputValue(e.target.value)}
              onBlur={() => {
                const name = brandInputValue.trim();
                if (name) onAssignBrandByName(name);
              }}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="Select or type to assign to a brand"
            />
            <datalist id="edit-panel-brand-list">
              {brands.map((b) => (
                <option key={b.id} value={b.name} />
              ))}
            </datalist>
            <p className="text-[11px] text-muted-foreground">
              Choose an existing brand or type a new name to assign only this stock to that brand. This never renames other brands.
            </p>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">ISO</span>
            <input
              type="number"
              min={1}
              value={stock.iso}
              onChange={(e) => onUpdate("iso", Number(e.target.value) || 0)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Type</span>
            <select
              value={stock.type}
              onChange={(e) => onUpdate("type", e.target.value as FilmType)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{FILM_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Rating</span>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={stock.rating}
              onChange={(e) => onUpdate("rating", Number(e.target.value) || 0)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Year introduced</span>
            <input
              type="number"
              min={1900}
              max={2030}
              placeholder="e.g. 1998"
              value={stock.year_introduced ?? ""}
              onChange={(e) => onUpdate("year_introduced", e.target.value === "" ? null : Number(e.target.value))}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Grain</span>
            <select
              value={stock.grain_level}
              onChange={(e) => onUpdate("grain_level", e.target.value as GrainLevel)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              {GRAIN_OPTIONS.map((g) => (
                <option key={g} value={g}>{GRAIN_LABELS[g]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Contrast</span>
            <select
              value={stock.contrast_level}
              onChange={(e) => onUpdate("contrast_level", e.target.value as ContrastLevel)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              {CONTRAST_OPTIONS.map((c) => (
                <option key={c} value={c}>{CONTRAST_LABELS[c]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Latitude</span>
            <select
              value={stock.latitude_level ?? ""}
              onChange={(e) => onUpdate("latitude_level", e.target.value === "" ? null : (e.target.value as LatitudeLevel))}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {LATITUDE_OPTIONS.filter((v) => v !== "").map((l) => (
                <option key={l} value={l}>{LATITUDE_LABELS[l]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Color Balance</span>
            <input
              type="text"
              value={stock.color_balance ?? ""}
              onChange={(e) => onUpdate("color_balance", e.target.value.trim() || null)}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. Daylight-Balanced (≈5500K). Leave empty for — (e.g. B&W)"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">DX Coding</span>
            <select
              value={stock.dx_coding === true ? "yes" : stock.dx_coding === false ? "no" : ""}
              onChange={(e) => {
                const v = e.target.value;
                onUpdate("dx_coding", v === "yes" ? true : v === "no" ? false : undefined);
              }}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Development Process</span>
            <select
              value={stock.development_process ?? ""}
              onChange={(e) => onUpdate("development_process", e.target.value === "" ? null : (e.target.value as DevelopmentProcess))}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {DEVELOPMENT_PROCESS_OPTIONS.filter((v) => v !== "").map((d) => (
                <option key={d} value={d}>{DEVELOPMENT_PROCESS_LABELS[d]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Format (comma-separated)</span>
            <input
              type="text"
              value={Array.isArray(stock.format) ? stock.format.join(", ") : ""}
              onChange={(e) => onUpdate("format", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="35mm, 120"
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Best for (multi)</span>
            <div className="flex flex-wrap gap-2">
              {BEST_FOR_OPTIONS.map((b) => (
                <label key={b} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={stock.best_for?.includes(b) ?? false}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...(stock.best_for || []), b]
                        : (stock.best_for || []).filter((x) => x !== b);
                      onUpdate("best_for", next);
                    }}
                  />
                  <span className="text-sm">{BEST_FOR_LABELS[b]}</span>
                </label>
              ))}
            </div>
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={stock.discontinued}
              onChange={(e) => onUpdate("discontinued", e.target.checked)}
            />
            <span className="text-sm font-medium">Discontinued</span>
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <textarea
              value={stock.description ?? ""}
              onChange={(e) => onUpdate("description", e.target.value || null)}
              rows={3}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Shooting notes (tips)</span>
            <textarea
              value={stock.shooting_tips ?? ""}
              onChange={(e) => onUpdate("shooting_tips", e.target.value || null)}
              rows={4}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
              placeholder="One or more tips, e.g. overexpose by 1 stop..."
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Web review URLs (one per line)</span>
            <p className="text-[11px] text-muted-foreground mb-0.5">
              Paste article URLs; they’ll be shown as “Reviews from the web” with title/site derived from the URL.
            </p>
            <textarea
              value={reviewsWeb.map((r) => r.url).join("\n")}
              onChange={(e) => {
                const urls = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
                const web = urls.map((url) => urlToWebReview(url));
                onUpdateReviews(web, reviewsVideo);
              }}
              rows={3}
              className="rounded border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="https://example.com/review..."
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Video review URLs (one per line)</span>
            <p className="text-[11px] text-muted-foreground mb-0.5">
              Paste YouTube or video URLs; they’ll be shown as “Video reviews” with thumbnail.
            </p>
            <textarea
              value={reviewsVideo.map((r) => r.url).join("\n")}
              onChange={(e) => {
                const urls = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
                const video = urls.map((url) => urlToVideoReview(url));
                onUpdateReviews(reviewsWeb, video);
              }}
              rows={3}
              className="rounded border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Image</span>
            <p className="text-[11px] text-muted-foreground mb-0.5">
              Choose a file already in <code className="rounded bg-muted px-1">public/films/</code> or enter any path/URL.
            </p>
            {availableImages.length > 0 && (
              <select
                value={availableImages.includes(stock.image_url ?? "") ? (stock.image_url ?? "") : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) onUpdate("image_url", v);
                }}
                className="rounded border border-border bg-background px-3 py-2 text-sm mb-1.5"
              >
                <option value="">— Choose from existing —</option>
                {availableImages.map((img) => (
                  <option key={img} value={img}>{img}</option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={stock.image_url ?? ""}
              onChange={(e) => onUpdate("image_url", e.target.value || null)}
              className="rounded border border-border bg-background px-3 py-2 text-sm font-mono"
              placeholder="/films/stock-name.jpg or full URL"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Price tier (1–3)</span>
            <input
              type="number"
              min={1}
              max={3}
              value={stock.price_tier ?? ""}
              onChange={(e) => onUpdate("price_tier", e.target.value === "" ? null : (Number(e.target.value) as 1 | 2 | 3))}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Base price USD</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={stock.base_price_usd ?? ""}
              onChange={(e) => onUpdate("base_price_usd", e.target.value === "" ? null : Number(e.target.value))}
              className="rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Apply to table
          </button>
        </div>
      </div>
    </div>
  );
}
