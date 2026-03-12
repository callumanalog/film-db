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

## Grain (single-select) — column: `grain`

| Value in DB | Shown in app |
|-------------|--------------|
| `fine`      | Fine         |
| `medium`    | Medium       |
| `strong`    | Strong       |

---

## Contrast (single-select) — column: `contrast`

| Value in DB | Shown in app |
|-------------|--------------|
| `low`       | Low          |
| `medium`    | Medium       |
| `high`      | High         |

---

## Latitude (single-select) — column: `latitude`

| Value in DB    | Shown in app  |
|----------------|---------------|
| `very_narrow`  | Very Narrow   |
| `narrow`       | Narrow        |
| `moderate`     | Moderate      |
| `wide`         | Wide          |
| `very_wide`    | Very Wide     |

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

| Value in DB      | Shown in app    |
|------------------|-----------------|
| `everyday`       | Everyday        |
| `portrait`       | Portraits       |
| `travel`         | Travel          |
| `landscape`      | Landscapes      |
| `night`          | Low Light       |
| `studio`         | Studio          |
| `street`         | Street          |
| `wedding`        | Weddings        |
| `sports`         | Sports          |
| `sunny_conditions` | Sunny Conditions |
| `creative`       | Creative        |

---

**Note:** In the Supabase table editor you enter the **value in DB** (e.g. `color_negative`). The app turns these into the labels in the right column.
