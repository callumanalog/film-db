# FilmDB style guide

Reference: **Film stocks landing page** (`/films`). New pages and components should follow these tokens and patterns so the site stays declarative and consistent.

**Visual reference:** Open **[/style-guide](/style-guide)** in the app to see every token rendered (colors, radius, typography, widths, surfaces). Use it when changing a style—find the token on that page, then use its class or variable name in code.

---

## 1. Page layout

- **Background:** Use `bg-background` for the main page wrapper (no arbitrary oklch).
- **Container:** `max-w-7xl mx-auto` for main content width.
- **Horizontal padding:** `px-4 sm:px-6 lg:px-8`.
- **Vertical padding:** Top `pt-20 sm:pt-24`, bottom `pb-8`. Use for the outer page wrapper.
- **Section spacing:** Use `mb-3` between logical sections (e.g. header → filters → grid). For larger gaps (e.g. below hero heading), use `mt-6` or `mt-12` as needed.

**Example (films page):**
```tsx
<div className="min-h-screen bg-background">
  <div className="mx-auto max-w-7xl px-4 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8">
    <div className="mb-3"><DiscoveryHeader ... /></div>
    <main className="min-w-0">
      <div className="mb-3 flex ..."><ActiveFilterChips /></div>
      <FilmsListingClient ... />
    </main>
  </div>
</div>
```

---

## 2. Radius

Use semantic radius utilities instead of arbitrary values.

| Token / utility   | Value | Use for |
|-------------------|-------|--------|
| `rounded-card`    | 7px   | Cards, panels, empty states, modals, image containers |
| `rounded-control` | 7px   | Pills, buttons, inputs, search bar, filter controls (same as rounded-card) |

Use existing scale where it fits: `rounded-sm`, `rounded-md`, `rounded-lg` (from `--radius` scale). Prefer `rounded-card` and `rounded-control` for cards, panels, buttons, and inputs (both are 7px).

---

## 3. Typography

### Font families
- **h1, h2, h3, h4, h5, h6 and body:** Work Sans (`font-sans`). Use `font-sans` for page headings and UI copy, or rely on base styles.
- **Modals and forms:** Use `font-work-sans` or `.work-sans-content` so headings stay Work Sans when needed.

### Font sizes (use utilities, not arbitrary px)

| Utility       | Use for |
|---------------|--------|
| `text-tiny`   | Smallest UI: e.g. ISO on placeholder card, tiny badges (9px) |
| `text-label`  | Labels, discontinued badge, spec labels, small caps (10px) |
| `text-caption`| Captions, secondary info (11px) |
| `text-ui`     | Compact UI: discovery pills, search input, filter buttons (13px) |
| `text-xs`     | Chips, sort label, small controls (Tailwind default) |
| `text-sm`     | Card titles, body copy in tight spaces, buttons |
| `text-base`   | Hero subtitle on larger breakpoints, body paragraphs |
| `text-lg`+    | Headings; use scale (e.g. `text-2xl sm:text-3xl`) |

**Hero (films page):**
- Title: `font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl`
- Subtitle: `font-sans text-sm text-muted-foreground sm:text-base`, container `max-w-xl` (or `max-w-[var(--width-prose-narrow)]`)

---

## 4. Surfaces (cards and controls)

### Card surface
Use for film cards, content panels, empty states, modals.
- Base: `rounded-card border border-border/50 bg-card`
- Hover (when clickable): `transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5`
- Optional: `overflow-hidden` when the card clips content (e.g. image).

### Control surface (secondary / pill)
Use for filter buttons, search trigger, Vibes. Responsive: `h-[44px] md:h-[36px]`, `text-sm md:text-xs`, `rounded-card`.
- Base: `rounded-card border border-border/60 bg-secondary/50 px-4 font-sans text-sm font-medium md:text-xs`
- Hover: `transition-colors hover:border-primary/40 hover:bg-secondary` (or `hover:bg-primary/5`)
- Icon-only: `h-[44px] w-[44px] md:h-[36px] md:w-[36px]` (same vertical mid-point as text pills).

### Chip (filter chips, tags)
- Container: `rounded-full border border-border/60 bg-secondary/50`
- Padding: `pl-2.5 pr-1.5 py-1.5`, label `text-xs font-medium`
- Truncate label: `max-w-[var(--width-chip-label)] truncate` (120px)

### Button & control scaling (responsive)
Use `rounded-card` or `rounded-control` (7px) for all buttons and controls. Ensure Vibes pills, Filter buttons, and Search triggers share the same vertical mid-point when aligned (pill scale).

**Primary (.btn-primary)** — Apply, Submit, main CTAs
- Mobile: `h-[52px]`, `text-base`
- Desktop (md:): `h-[44px]`, `text-sm`
- Classes: `flex h-[52px] items-center justify-center rounded-card bg-primary px-4 font-sans text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 md:h-[44px] md:text-sm`

**Secondary / pill controls** — Filters, Vibes, Search trigger, Clear, Cancel
- Mobile: `h-[44px]`, `text-sm`
- Desktop (md:): `h-[36px]`, `text-xs`
- Classes: `flex h-[44px] items-center justify-center rounded-card border border-border bg-transparent px-4 font-sans text-sm font-medium ... md:h-[36px] md:text-xs`. For icon-only: `h-[44px] w-[44px] md:h-[36px] md:w-[36px]`.

**Search input**
- Match primary height when standalone: `h-[52px]` mobile, `md:h-[44px]` desktop.
- In utility row with Filters/Vibes: use pill height (`h-[44px]` / `md:h-[36px]`) so all controls share the same vertical mid-point.

---

## 5. Spacing

- **Primary button:** `h-[52px]` mobile, `h-[44px]` desktop. **Pill controls:** `h-[44px]` mobile, `h-[36px]` desktop. **Search input:** match primary height when standalone; match pill height when in utility row.
- **Grid gap (film grid):** `gap-3 sm:gap-4`.
- **Section / block gap:** `gap-2` or `gap-2.5` for tight rows (e.g. pills), `gap-4` for form sections.
- **Card internal:** Padding `p-3` or `px-3 py-3` for content; image area `px-2 py-2` or `h-36 sm:h-40` as needed.
- **Empty state:** `py-16` for vertical breathing room.

---

## 6. Widths

Use CSS variables for repeated max-widths so they stay consistent and easy to change:

- Search field: `max-w-[var(--width-search-field)]` (220px)
- Chip label truncation: `max-w-[var(--width-chip-label)]` (120px)
- Hero subtitle / narrow prose: `max-w-[var(--width-prose-narrow)]` or `max-w-xl` (36rem)

---

## 7. Breakpoints

Use Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px.

**Films page patterns:**
- Discovery ribbon: `hidden md:block` (pills only from md up).
- Utility row: icon-only on mobile, full search + filters on `md`.
- Film grid: `grid-cols-2 md:grid-cols-5`.

Prefer one or two breakpoints per component where possible (e.g. `md:` for “mobile vs desktop”) so behavior is easy to follow.

---

## 8. Colors

Use semantic tokens only. No hardcoded hex or slate for UI.

- **Backgrounds:** `bg-background`, `bg-card`, `bg-secondary`, `bg-muted`, `bg-primary`
- **Text:** `text-foreground`, `text-muted-foreground`, `text-primary`
- **Borders:** `border-border`, `border-border/50`, `border-border/60`
- **Hover / focus:** `hover:border-primary/40`, `hover:bg-primary/5`, `focus:ring-primary/20`, etc.

Destructive: `bg-destructive`, `text-destructive`; badges can use `bg-red-100 text-red-700 dark:...` for status only.

---

## 9. Summary: “films page in tokens”

| What            | Use this |
|-----------------|----------|
| Page wrapper    | `bg-background`, `max-w-7xl mx-auto`, `px-4 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8` |
| Section gap     | `mb-3` |
| Hero title      | `font-advercase text-3xl font-bold tracking-tight sm:text-4xl` |
| Hero subtitle   | `text-sm text-muted-foreground sm:text-base`, `max-w-xl` |
| Cards           | `rounded-card border border-border/50 bg-card` + hover |
| Controls/pills  | `h-[44px] md:h-[36px] rounded-card border border-border/60 bg-secondary/50` + `text-sm md:text-xs` + hover |
| Chips           | `rounded-full` + control-style border/bg, `max-w-[var(--width-chip-label)]` for label |
| Primary button  | `h-[52px] md:h-[44px] rounded-card bg-primary px-4 font-sans text-base md:text-sm font-semibold` + hover/disabled |
| Secondary / pill | `h-[44px] md:h-[36px] rounded-card border border-border` + `text-sm md:text-xs` + hover/disabled |
| Search input    | Standalone: `h-[52px] md:h-[44px]`. In row with Filters: `h-[44px] md:h-[36px]` |
| Grid            | `grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4` |
| Empty state     | `rounded-card border border-dashed border-border py-16` |

When in doubt, match the film stocks landing page and use the utilities above instead of arbitrary values.
