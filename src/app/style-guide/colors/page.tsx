import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Color Audit — Mobile",
  description: "Visual reference for every color used on mobile views in FilmDB.",
};

const SEMANTIC_TOKENS = [
  { token: "background", css: "--background", value: "oklch(0.985 0.002 75)", desc: "Page background — light cream" },
  { token: "foreground", css: "--foreground", value: "#191919", desc: "Primary text" },
  { token: "card", css: "--card", value: "oklch(1 0 0)", desc: "Card surfaces — white" },
  { token: "primary", css: "--primary", value: "#D97706", desc: "Brand amber — CTAs, active states, focus rings" },
  { token: "primary-foreground", css: "--primary-foreground", value: "oklch(0.98 0.005 75)", desc: "Text on primary — near-white" },
  { token: "secondary", css: "--secondary", value: "oklch(0.95 0.005 75)", desc: "Secondary backgrounds — pills, stat chips" },
  { token: "muted", css: "--muted", value: "oklch(0.94 0.005 75)", desc: "Muted backgrounds — code blocks, skeletons" },
  { token: "muted-foreground", css: "--muted-foreground", value: "oklch(0.45 0.02 60)", desc: "Secondary text — labels, placeholders, icons" },
  { token: "accent", css: "--accent", value: "oklch(0.93 0.01 70)", desc: "Hover backgrounds — interactive surfaces" },
  { token: "destructive", css: "--destructive", value: "oklch(0.55 0.22 27)", desc: "Error / destructive actions" },
  { token: "border", css: "--border", value: "oklch(0.88 0.01 70)", desc: "Default borders" },
  { token: "ring", css: "--ring", value: "#D97706", desc: "Focus ring — matches primary" },
] as const;

const STATUS_COLORS = [
  { label: "Shot It (active)", bg: "bg-emerald-500/10", text: "text-emerald-600", border: "border-emerald-500/40", usage: "Shot It button, checkmark" },
  { label: "Loaded / In Camera (active)", bg: "bg-blue-500/10", text: "text-blue-600", border: "border-blue-500/40", usage: "Loaded button, camera icon" },
  { label: "Queue / Wishlist (active)", bg: "bg-primary/10", text: "text-primary", border: "border-primary/40", usage: "Queue button, bookmark icon" },
  { label: "Discontinued", bg: "bg-red-100", text: "text-red-700", border: "border-transparent", usage: "Discontinued badge on image card" },
  { label: "Star rating", bg: "bg-transparent", text: "text-amber-400", border: "border-transparent", usage: "Star icons — MiniStars, AvgRatingStar, UserStarRating" },
] as const;

const FILM_TYPE_COLORS = [
  { label: "Color Negative", bg: "bg-amber-600", text: "text-amber-700", desc: "Type badge + accent text" },
  { label: "B&W Negative", bg: "bg-zinc-600", text: "text-zinc-600", desc: "Type badge + accent text" },
  { label: "Slide / Reversal", bg: "bg-emerald-600", text: "text-emerald-700", desc: "Type badge + accent text" },
  { label: "Instant", bg: "bg-sky-600", text: "text-sky-700", desc: "Type badge + accent text" },
  { label: "Specialty", bg: "bg-zinc-500", text: "text-zinc-500", desc: "Type badge + accent text" },
] as const;

const HARDCODED_COLORS = [
  { hex: "#E8E0D0", usage: "Legacy stats row (film mobile hero)", note: "Outside design system — won't respond to dark mode" },
] as const;

const BG_CLASSES = [
  { cls: "bg-background", where: "Film detail sheet, Header, body" },
  { cls: "bg-card", where: "Image card, FilmCard, SearchForm, action buttons" },
  { cls: "bg-white", where: "Image area inner, SearchForm, discovery header" },
  { cls: "bg-muted", where: "Spec icon containers, code blocks" },
  { cls: "bg-secondary/50", where: "StatPill, pill controls" },
  { cls: "bg-foreground", where: "Primary CTA (Shot It dark mode)" },
  { cls: "bg-slate-100", where: "Search skeletons, BottomNav border" },
  { cls: "bg-slate-200", where: "Search skeletons (larger)" },
  { cls: "bg-amber-500/90", where: "FilmCard Budget badge" },
] as const;

const TEXT_CLASSES = [
  { cls: "text-foreground", where: "Titles, card text, stat numbers" },
  { cls: "text-muted-foreground", where: "Metadata, labels, inactive icons, placeholders" },
  { cls: "text-primary", where: "Active queue/wishlist, active category pills" },
  { cls: "text-emerald-600", where: "Active Shot It button + icon" },
  { cls: "text-blue-600", where: "Active Loaded button + icon" },
  { cls: "text-amber-400", where: "Star rating icons" },
  { cls: "text-red-700", where: "Discontinued badge" },
  { cls: "text-white", where: "Type badges, primary CTA text" },
  { cls: "text-slate-600", where: "Search empty state" },
] as const;

const BORDER_CLASSES = [
  { cls: "border-border/50", where: "Cards, image card, stat row, dividers" },
  { cls: "border-border/60", where: "Pill controls, action buttons (inactive)" },
  { cls: "border-emerald-500/40", where: "Shot It button (active)" },
  { cls: "border-primary/40", where: "Queue button (active)" },
  { cls: "border-blue-500/40", where: "Loaded button (active)" },
  { cls: "border-slate-100", where: "SearchConsole, BottomNav, discovery header" },
  { cls: "border-slate-200", where: "Films header search, filter bar" },
] as const;

export default function ColorAuditPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <header className="mb-12">
          <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Color Audit — Mobile
          </h1>
          <p className="mt-2 font-sans text-sm text-muted-foreground sm:text-base max-w-xl">
            Every color used across mobile views, where it appears, and whether it comes from the design system or is hardcoded.
          </p>
        </header>

        {/* Semantic tokens */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Design System Tokens</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Core semantic colors defined in <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">globals.css</code>. These drive all Tailwind utilities like <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">bg-background</code>, <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">text-foreground</code>, etc.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SEMANTIC_TOKENS.map(({ token, css, value, desc }) => (
              <div key={token} className="flex flex-col gap-1.5">
                <div className={`h-14 rounded-card border border-border/50 bg-${token}`} />
                <code className="font-mono text-label text-foreground break-all">{css}</code>
                <span className="font-sans text-tiny text-muted-foreground">{value}</span>
                <span className="font-sans text-caption text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Status / state colors */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Status &amp; State Colors</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Colors used to indicate interactive states — active toggles, badges, and ratings.
          </p>
          <div className="space-y-3">
            {STATUS_COLORS.map(({ label, bg, text, border, usage }) => (
              <div key={label} className="flex items-center gap-4 rounded-card border border-border/50 bg-card p-3">
                <div className={`h-10 w-10 shrink-0 rounded-card ${bg} ${border} border`} />
                <div className="min-w-0 flex-1">
                  <span className={`font-sans text-sm font-semibold ${text}`}>{label}</span>
                  <p className="font-sans text-caption text-muted-foreground mt-0.5">{usage}</p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-0.5">
                  <code className="font-mono text-tiny text-muted-foreground">{bg}</code>
                  <code className="font-mono text-tiny text-muted-foreground">{text}</code>
                  <code className="font-mono text-tiny text-muted-foreground">{border}</code>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Film type colors */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Film Type Colors</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Each film stock type has a dedicated badge color and matching text accent.
          </p>
          <div className="flex flex-wrap gap-3">
            {FILM_TYPE_COLORS.map(({ label, bg, text, desc }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className={`flex h-8 items-center rounded-full ${bg} px-3`}>
                  <span className="font-sans text-xs font-medium text-white">{label}</span>
                </div>
                <span className={`font-sans text-caption font-medium ${text}`}>{label}</span>
                <code className="font-mono text-tiny text-muted-foreground">{bg}</code>
                <span className="font-sans text-tiny text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Hardcoded colors */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Hardcoded Colors</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            These colors are set via inline <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">style</code> attributes and live outside the design system. They won&apos;t respond to theme or dark mode changes.
          </p>
          <div className="space-y-3">
            {HARDCODED_COLORS.map(({ hex, usage, note }) => (
              <div key={hex} className="flex items-center gap-4 rounded-card border border-border/50 bg-card p-3">
                <div className="h-10 w-10 shrink-0 rounded-card border border-border/50" style={{ backgroundColor: hex }} />
                <div className="min-w-0 flex-1">
                  <code className="font-mono text-sm font-semibold text-foreground">{hex}</code>
                  <p className="font-sans text-caption text-muted-foreground mt-0.5">{usage}</p>
                  <p className="font-sans text-tiny text-destructive mt-0.5">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tailwind class audit — backgrounds */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Tailwind Classes — Backgrounds</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            All <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">bg-*</code> classes used on mobile, and where they appear.
          </p>
          <div className="rounded-card border border-border/50 bg-card divide-y divide-border/50 overflow-hidden">
            {BG_CLASSES.map(({ cls, where }) => (
              <div key={cls} className="flex items-center gap-4 px-4 py-3">
                <div className={`h-8 w-8 shrink-0 rounded-card border border-border/50 ${cls}`} />
                <code className="font-mono text-caption text-foreground min-w-[140px] shrink-0">{cls}</code>
                <span className="font-sans text-caption text-muted-foreground">{where}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tailwind class audit — text */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Tailwind Classes — Text</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            All <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">text-*</code> color classes on mobile.
          </p>
          <div className="rounded-card border border-border/50 bg-card divide-y divide-border/50 overflow-hidden">
            {TEXT_CLASSES.map(({ cls, where }) => (
              <div key={cls} className="flex items-center gap-4 px-4 py-3">
                <span className={`font-sans text-sm font-semibold ${cls}`}>Aa</span>
                <code className="font-mono text-caption text-foreground min-w-[170px] shrink-0">{cls}</code>
                <span className="font-sans text-caption text-muted-foreground">{where}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tailwind class audit — borders */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Tailwind Classes — Borders</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            All <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">border-*</code> color classes on mobile.
          </p>
          <div className="rounded-card border border-border/50 bg-card divide-y divide-border/50 overflow-hidden">
            {BORDER_CLASSES.map(({ cls, where }) => (
              <div key={cls} className="flex items-center gap-4 px-4 py-3">
                <div className={`h-8 w-8 shrink-0 rounded-card border-2 ${cls}`} />
                <code className="font-mono text-caption text-foreground min-w-[170px] shrink-0">{cls}</code>
                <span className="font-sans text-caption text-muted-foreground">{where}</span>
              </div>
            ))}
          </div>
        </section>

        <p className="font-sans text-caption text-muted-foreground border-t border-border/50 pt-8">
          Tokens are defined in <code className="font-mono bg-muted rounded-control px-1">src/app/globals.css</code>. Hardcoded colors should be migrated to semantic tokens for dark mode and theme support.
        </p>
      </div>
    </div>
  );
}
