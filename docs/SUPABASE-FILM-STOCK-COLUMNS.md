# Film stocks — Supabase column reference

Use this when editing film stocks in the Supabase Table Editor. The table only accepts the values below; wrong values will be rejected.

## Format (multiselect)

Store as array. Allowed values:

| Value in DB | Shown in app |
|-------------|----------------|
| `35mm`      | 35mm          |
| `120`       | 120           |
| `4x5`       | 4x5           |
| `8x10`      | 8x10          |
| `110`       | 110           |
| `instant`   | Instant       |

---

## Film type (single-select)

| Value in DB    | Shown in app     |
|----------------|------------------|
| `color_negative` | Color Negative   |
| `bw_negative`    | Black & White    |
| `color_reversal` | Slide / Reversal |
| `bw_reversal`    | B&W Reversal     |
| `instant`        | Instant          |

---

## Grain (scale 1–5) — column: `grain`

Integer `1`–`5`. On the landing page, filters show: **Fine** (1–2), **Medium** (3), **Coarse** (4–5).

| Scale | Filter label |
|-------|----------------|
| 1, 2  | Fine          |
| 3     | Medium        |
| 4, 5  | Coarse        |

---

## Contrast (scale 1–5) — column: `contrast`

Integer `1`–`5`. Filters: **Soft** (1–2), **Balanced** (3), **Punchy** (4–5).

---

## Latitude (scale 1–5) — column: `latitude`

Integer `1`–`5`. Filters: **Narrow** (1–2), **Moderate** (3), **Wide** (4–5).

---

## Saturation (scale 1–5) — column: `saturation`

Integer `1`–`5`. New column. Filters: **Muted** (1–2), **Natural** (3), **Vivid** (4–5).

---

## Performance — column: `shooting_notes`

Shown on the film page as the **Performance** section (hed + dek table, typically 3–6 items per stock). Stored as JSONB array of `{ "header": "...", "dek": "..." }`:

- **header** (hed): Short label, e.g. `Skin Tones`, `Color Bias`, `Push/Pull`. Uppercase on the site.
- **dek**: Body text for that note.

Example (Kodak Gold 200–style):

```json
[
  { "header": "Skin Tones", "dek": "Healthy and warm. It favors yellow/orange undertones, giving subjects a sun-kissed look." },
  { "header": "Color Bias", "dek": "Strong leaning toward warmth. It excels in golden hour light, accentuating yellows, reds, and oranges." },
  { "header": "Highlight Roll-off", "dek": "Exceptional. Like most Kodak negative films, it is very difficult to blow out highlights." }
]
```

In the Table Editor you can paste/edit the JSON. The admin UI at **/admin/films** also has **Performance (hed + dek)** where you can add, edit, and remove notes per stock.

---

## Color balance — column: `color_balance`

Free text. Shown in specs as "Color Balance". Examples: `Daylight (5500K)`, `Tungsten-balanced (≈3200K)`, `Warm, natural skin tones with soft pastels`.

---

## Development process (single-select)

| Value in DB | Shown in app |
|-------------|--------------|
| `c41`       | C-41         |
| `e6`        | E-6          |
| `bw`        | B&W          |
| `ecn2`      | ECN-2        |

---

## Use case / best_for (multiselect)

Store as text array. Allowed values:

| Value in DB        | Shown in app      |
|--------------------|-------------------|
| `general_purpose`  | General purpose   |
| `portrait`         | Portrait          |
| `street`           | Street            |
| `landscapes`       | Landscapes        |
| `architecture`     | Architecture      |
| `documentary`      | Documentary       |
| `sports`           | Sports            |
| `travel`           | Travel            |
| `weddings`         | Weddings          |
| `studio`           | Studio            |
| `bright_sun`       | Bright Sun        |
| `golden_hour`       | Golden Hour       |
| `low_light`        | Low Light         |
| `artificial_light` | Artificial Light  |
| `experimental`     | Experimental      |

---

**Note:** In the Supabase table editor you enter the **value in DB** (e.g. `color_negative`). The app turns these into the labels in the right column.
