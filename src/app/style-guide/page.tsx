import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Style guide",
  description: "Visual reference for Exposure Club design tokens. Use these tokens when changing styles.",
};

const BG_COLOR_TOKENS = [
  { token: "bg-background", label: "Background" },
  { token: "bg-card", label: "Card" },
  { token: "bg-secondary", label: "Secondary" },
  { token: "bg-muted", label: "Muted" },
  { token: "bg-primary", label: "Primary" },
  { token: "bg-destructive", label: "Destructive" },
] as const;

const TEXT_COLOR_TOKENS = [
  { token: "text-foreground", label: "Foreground" },
  { token: "text-muted-foreground", label: "Muted foreground" },
  { token: "text-primary", label: "Primary" },
] as const;

const RADIUS_TOKENS = [
  { token: "rounded-control", value: "7px", desc: "Pills, buttons, inputs, search, filters" },
  { token: "rounded-card", value: "7px", desc: "Cards, panels, empty states, modals" },
  { token: "rounded-sm", value: "theme scale", desc: "Small elements" },
  { token: "rounded-md", value: "theme scale", desc: "Medium" },
  { token: "rounded-lg", value: "theme scale", desc: "Large" },
] as const;

const TYPE_TOKENS = [
  { token: "text-tiny", value: "9px", sample: "ISO 400" },
  { token: "text-label", value: "10px", sample: "Discontinued" },
  { token: "text-caption", value: "11px", sample: "Camera: Nikon F3" },
  { token: "text-ui", value: "13px", sample: "Filters" },
  { token: "text-xs", value: "12px", sample: "Chip label" },
  { token: "text-sm", value: "14px", sample: "Card title" },
  { token: "text-base", value: "16px", sample: "Body copy" },
  { token: "text-lg", value: "18px", sample: "Subheading" },
  { token: "text-xl", value: "20px", sample: "Heading" },
  { token: "text-2xl", value: "24px", sample: "Page title" },
] as const;

const FONT_FAMILY_TOKENS = [
  { token: "font-sans", desc: "h1, h2, h3, h4, h5, h6, body, UI copy" },
] as const;

const FONT_WEIGHT_TOKENS = [
  { token: "font-thin", value: "100" },
  { token: "font-extralight", value: "200" },
  { token: "font-light", value: "300" },
  { token: "font-normal", value: "400" },
  { token: "font-medium", value: "500" },
  { token: "font-semibold", value: "600" },
  { token: "font-bold", value: "700" },
  { token: "font-extrabold", value: "800" },
  { token: "font-black", value: "900" },
] as const;

const WIDTH_TOKENS = [
  { token: "max-w-[var(--width-search-field)]", value: "220px", desc: "Search field" },
  { token: "max-w-[var(--width-chip-label)]", value: "120px", desc: "Chip label truncation" },
  { token: "max-w-[var(--width-prose-narrow)]", value: "36rem", desc: "Hero subtitle, narrow prose" },
] as const;

export default function StyleGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <header className="mb-12">
          <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Style guide
          </h1>
          <p className="mt-2 font-sans text-sm text-muted-foreground sm:text-base max-w-xl">
            Visual reference for design tokens. When changing a style, find the token below and use its class name or variable.
          </p>
        </header>

        {/* Colors */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Colors</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Use semantic tokens only. Token name = Tailwind class.
          </p>
          <h3 className="font-sans text-sm font-semibold text-foreground mb-3">Backgrounds</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {BG_COLOR_TOKENS.map(({ token, label }) => (
              <div key={token} className="flex flex-col gap-2">
                <div className={`h-14 rounded-card border border-border/50 ${token}`} />
                <code className="font-mono text-label text-foreground break-all">{token}</code>
                <span className="font-sans text-caption text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <h3 className="font-sans text-sm font-semibold text-foreground mb-3">Text</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TEXT_COLOR_TOKENS.map(({ token, label }) => (
              <div key={token} className="rounded-card border border-border/50 bg-card p-3">
                <span className={`${token} font-sans text-sm`}>Sample text</span>
                <code className="block mt-1 font-mono text-caption text-muted-foreground">{token}</code>
                <span className="block font-sans text-tiny text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-card border border-border/50 bg-card p-3">
            <span className="font-sans text-sm text-muted-foreground">Border: </span>
            <code className="font-mono text-caption text-muted-foreground">border-border</code>
            <span className="font-sans text-caption text-muted-foreground"> (use with </span>
            <code className="font-mono text-caption">border border-border</code>
            <span className="font-sans text-caption text-muted-foreground">)</span>
          </div>
        </section>

        {/* Radius */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Radius</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Use <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">rounded-card</code> or{" "}
            <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">rounded-control</code> (both 7px) for cards, panels, buttons, and inputs.
          </p>
          <div className="flex flex-wrap gap-8">
            {RADIUS_TOKENS.map(({ token, value, desc }) => (
              <div key={token} className="flex flex-col gap-2">
                <div className={`w-24 h-24 border-2 border-border bg-card ${token}`} />
                <code className="font-mono text-label text-foreground">{token}</code>
                <span className="font-sans text-caption text-muted-foreground">{value}</span>
                <span className="font-sans text-caption text-muted-foreground">{desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Typography — sizes */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Typography — sizes</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Use the token as the Tailwind class, e.g. <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">text-tiny</code>, <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">text-label</code>.
          </p>
          <div className="rounded-card border border-border/50 bg-card divide-y divide-border/50 overflow-hidden">
            {TYPE_TOKENS.map(({ token, value, sample }) => (
              <div key={token} className="flex flex-wrap items-baseline justify-between gap-4 px-4 py-3">
                <span className={`font-sans text-foreground ${token}`}>{sample}</span>
                <div className="flex items-center gap-3">
                  <code className="font-mono text-caption text-muted-foreground">{token}</code>
                  <span className="font-sans text-tiny text-muted-foreground tabular-nums">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography — font weights (font-sans) */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Typography — font weights</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            All samples use <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">font-sans</code>. Work Sans is loaded with 300, 400, 500, 600, 700; other weights may fall back to the nearest.
          </p>
          <div className="rounded-card border border-border/50 bg-card divide-y divide-border/50 overflow-hidden">
            {FONT_WEIGHT_TOKENS.map(({ token, value }) => (
              <div key={token} className="flex flex-wrap items-baseline justify-between gap-4 px-4 py-3">
                <span className={`font-sans ${token} text-base text-foreground`}>
                  The quick brown fox jumps over the lazy dog.
                </span>
                <div className="flex items-center gap-3">
                  <code className="font-mono text-caption text-muted-foreground">{token}</code>
                  <span className="font-sans text-tiny text-muted-foreground tabular-nums">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography — families */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Typography — families</h2>
          <div className="space-y-4">
            {FONT_FAMILY_TOKENS.map(({ token, desc }) => (
              <div key={token} className="rounded-card border border-border/50 bg-card p-4">
                <p className={`${token} text-lg font-semibold text-foreground`}>
                  The quick brown fox jumps over the lazy dog.
                </p>
                <code className="mt-2 block font-mono text-caption text-muted-foreground">{token}</code>
                <p className="mt-1 font-sans text-caption text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Widths */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Widths</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Use with <code className="rounded-control bg-muted px-1 py-0.5 font-mono text-caption">max-w-[var(--width-search-field)]</code> or other width tokens listed below.
          </p>
          <ul className="font-sans text-sm text-foreground space-y-2">
            {WIDTH_TOKENS.map(({ token, value, desc }) => (
              <li key={token} className="flex flex-wrap items-baseline gap-2">
                <code className="font-mono text-caption bg-muted rounded-control px-1.5 py-0.5">{token}</code>
                <span className="text-muted-foreground">→ {value}</span>
                <span className="text-muted-foreground">({desc})</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Surfaces */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Surfaces</h2>
          <p className="font-sans text-sm text-muted-foreground mb-6">
            Standard patterns for cards and controls. Copy the token classes when building similar UI.
          </p>
          <div className="space-y-8">
            <div>
              <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Card</h3>
              <code className="block font-mono text-caption text-muted-foreground mb-2 break-all">
                rounded-card border border-border/50 bg-card
              </code>
              <div className="rounded-card border border-border/50 bg-card p-4 max-w-xs">
                <p className="font-sans text-sm font-semibold text-foreground">Card title</p>
                <p className="font-sans text-caption text-muted-foreground mt-1">Content goes here.</p>
              </div>
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Secondary / pill controls</h3>
              <code className="block font-mono text-caption text-muted-foreground mb-2 break-all">
                h-[44px] md:h-[36px] rounded-card border border-border/60 bg-secondary/50 px-4 font-sans text-sm md:text-xs (Filters, Vibes, Search trigger — same vertical mid-point)
              </code>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-[44px] shrink-0 items-center justify-center rounded-card border border-border/60 bg-secondary/50 px-4 font-sans text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 md:h-[36px] md:text-xs"
                >
                  Filters
                </button>
                <button
                  type="button"
                  className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-card border border-border/60 bg-secondary/50 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-secondary hover:text-foreground md:h-[36px] md:w-[36px]"
                  aria-label="Search"
                >
                  ⌕
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Chip</h3>
              <code className="block font-mono text-caption text-muted-foreground mb-2 break-all">
                rounded-full border border-border/60 bg-secondary/50 text-xs · label: max-w-[var(--width-chip-label)] truncate
              </code>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/50 pl-2.5 pr-1.5 py-1.5 text-xs font-medium text-foreground">
                  <span className="truncate max-w-[var(--width-chip-label)]">Color Negative</span>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground">×</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons (CTA) — responsive height scale */}
        <section className="mb-14">
          <h2 className="font-sans text-xl font-bold text-foreground mb-1">Buttons (CTA)</h2>
          <p className="font-sans text-sm text-muted-foreground mb-2">
            Use <code className="font-mono bg-muted rounded-card px-1">Button</code> from{" "}
            <code className="font-mono bg-muted rounded-card px-1">@/components/ui/button</code>. Primary and
            Secondary use <code className="font-mono bg-muted rounded-card px-1">{`size="cta"`}</code> (52px
            mobile / 44px desktop). Tertiary and pill controls use default or smaller sizes. Radius:{" "}
            <code className="font-mono bg-muted rounded-card px-1">rounded-card</code> (7px).
          </p>
          <div className="space-y-8">
            <div>
              <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Primary</h3>
              <code className="block font-mono text-caption text-muted-foreground mb-3 break-all">
                {"<Button variant=\"default\" size=\"cta\">Apply</Button>"}
              </code>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" size="cta">
                  Apply
                </Button>
                <Button type="button" size="cta" className="w-full max-w-xs">
                  Apply (full width)
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Secondary</h3>
              <p className="font-sans text-caption text-muted-foreground mb-2">
                Same sizes and font as Primary; background = foreground (dark), text = background.
              </p>
              <code className="block font-mono text-caption text-muted-foreground mb-3 break-all">
                {"<Button variant=\"secondary\" size=\"cta\">Secondary action</Button>"}
              </code>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="secondary" size="cta">
                  Secondary action
                </Button>
                <Button type="button" variant="secondary" size="cta" className="w-full max-w-xs">
                  Secondary (full width)
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Tertiary / pill</h3>
              <code className="block font-mono text-caption text-muted-foreground mb-3 break-all">
                {"<Button variant=\"tertiary\">Clear all filters</Button>"}
              </code>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="tertiary">
                  Clear all filters
                </Button>
                <Button type="button" variant="tertiary" className="w-full max-w-xs">
                  Clear (full width)
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-sans text-sm font-semibold text-foreground mb-2">Search input</h3>
              <p className="font-sans text-caption text-muted-foreground mb-2">Match primary button height: <code className="font-mono bg-muted rounded-card px-1">h-[52px]</code> mobile, <code className="font-mono bg-muted rounded-card px-1">md:h-[44px]</code> desktop. In utility row with Filters/Vibes, use pill height (44px / 36px) so all align.</p>
              <div className="flex h-[52px] max-w-xs items-center gap-2 rounded-card border border-border/60 bg-secondary/50 px-4 md:h-[44px]">
                <span className="text-muted-foreground">⌕</span>
                <span className="font-sans text-base text-foreground md:text-sm">Search film stocks...</span>
              </div>
            </div>
          </div>
        </section>

        <p className="font-sans text-caption text-muted-foreground border-t border-border/50 pt-8">
          Tokens are defined in <code className="font-mono bg-muted rounded-control px-1">src/app/globals.css</code>. See <code className="font-mono bg-muted rounded-control px-1">STYLE_GUIDE.md</code> for usage rules.
        </p>
      </div>
    </div>
  );
}
