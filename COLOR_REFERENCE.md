# Color Reference (Source of Truth)

Use this file when choosing UI colors. Values come from `src/index.css`.

## Semantic Tokens to Prefer

- `background`: app page background
- `foreground`: default text color
- `card`: surface blocks/cards
- `border`: neutral separators
- `primary`: brand lilac/pink action color (used by main CTA like "Nuevo Torneo")
- `header-bg`: explicit blue-family header background (created to avoid accent drift)

## Theme Interpretation

### Light Theme (`:root`)

- `primary` = `oklch(0.8 0.14 348.82)` -> lilac/pink
- `accent` = `oklch(0.83 0.09 247.96)` -> blue
- `secondary` = `oklch(0.94 0.07 97.7)` -> warm yellow
- `header-bg` = `oklch(0.94 0.03 247.96)` -> soft blue tint

### Dark Theme (`.dark`)

- `primary` = `oklch(0.6801 0.1583 276.9349)` -> violet/lilac
- `accent` = `oklch(0.879 0.1534 91.6054)` -> yellow/golden
- `secondary` = `oklch(0.77 0.15 306.21)` -> magenta-violet
- `header-bg` = `oklch(0.34 0.04 247.96)` -> muted blue tint

## Practical Rules

- Do not assume `accent` is blue in dark theme; there it is golden.
- If a color must stay "blue" across themes, use `header-bg` or define a dedicated semantic token.
- For neutral separators, use `border`.
- For primary action emphasis, use `primary`.
