# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server
npm run build        # tsc type check + Vite build
npm run lint         # ESLint
npm test             # run all tests once (Vitest)
npm run test:watch   # run tests in watch mode
npm run coverage     # generate coverage report for src/domain/ and src/lib/
```

Run a single test file:
```bash
npx vitest run src/domain/__tests__/groupSizes.test.ts
```

Run tests matching a name pattern:
```bash
npx vitest run --reporter=verbose -t "bergerTable"
```

## Architecture

This is a mobile-first PWA for chess round-robin tournament management. The project is being built incrementally; Phase 1 (core domain + tests) is complete.

### Key principle: domain logic is pure

All business logic lives in `src/domain/` as pure functions with no React dependencies. Components (not yet built) will only consume hooks that wrap the domain. This makes the domain fully testable without a browser.

### `src/domain/` — pure business logic

| File | Responsibility |
|---|---|
| `types.ts` | All shared TypeScript types (`Match`, `Group`, `Tournament`, `TournamentSettings`, etc.) |
| `groupSizes.ts` | `buildGroupSizes(n, useGroups)` — distributes n participants into groups per spec table |
| `participants.ts` | `normalizeName`, `validateParticipants`, `assignParticipantsToGroups`, `BYE_PARTICIPANT`, `GROUP_NAMES` |
| `scoring.ts` | `resolveMatchPoints` — maps `MatchResult` to points for both sides |
| `standings.ts` | `computeStandings` — accumulates points per participant, excludes Bye |
| `tiebreaks.ts` | `applyDirectEncounter`, `computeSonnebornBerger`, `rankWithTiebreaks` |
| `roundRobin.ts` | `generateRoundRobinPairings` — generates fixture using Berger tables, marks auto_bye matches |

### `src/lib/berger.ts`

Berger circle method algorithm. `bergerTable(n)` returns `(n-1)` rounds of `[whiteIdx, blackIdx]` pairs (1-based). Input `n` must be even and ≥ 4. Used by `roundRobin.ts`.

### Data model invariants

- **Raw results only:** `Match.result` stores the outcome (`white_win`, `draw`, `forfeit_white`, `auto_bye`, etc.). Points are always derived by calculation — never stored. This allows recalculation when `forfeitPoints` or `byePoints` settings change.
- **Snapshot settings:** `Tournament.settings` is an immutable snapshot of `TournamentSettings` at creation time. Changing `AppSettings` never affects existing tournaments.
- **Bye participant:** `id: 'bye'`, `isBye: true`. Bye matches are pre-resolved as `auto_bye` when the fixture is generated. The Bye is excluded from standings.
- **Group sizes:** `buildGroupSizes` returns real participant counts (sizes of 3 are valid — they get a Bye added dynamically by `generateRoundRobinPairings`). Exceptions: n=3 → `[4]` and n=5 → `[6]` already include the Bye slot in the size.

### TypeScript strict mode constraints

`tsconfig.app.json` enforces `verbatimModuleSyntax: true` — use `import type { Foo }` for type-only imports. Also `noUnusedLocals`, `noUnusedParameters`, and `erasableSyntaxOnly` (no `const enum`).

### Test location

Tests live in `src/domain/__tests__/` and `src/lib/__tests__/`. Vitest is configured with `globals: true` so `describe`/`it`/`expect` are available without importing. Environment is `node` (no DOM).

## Workflow Orchestration

### 1. Plan Mode Default

- Enter plan mode for any non-trivial task (3+ steps or architectural decisions).
- If something goes sideways, stop and re-plan immediately; do not keep pushing.
- Use plan mode for verification steps, not only building.
- Write detailed specs upfront to reduce ambiguity.

### 2. Subagent Strategy

- Use subagents liberally to keep the main context window clean.
- Offload research, exploration, and parallel analysis to subagents.
- For complex problems, increase compute via subagents.
- One task per subagent for focused execution.

### 3. Self-Improvement Loop

- After any correction from the user: update `tasks/lessons.md` with the pattern.
- Write rules that prevent repeating the same mistake.
- Ruthlessly iterate on these lessons until mistake rate drops.
- Review lessons at session start for the relevant project.

### 4. Verification Before Done

- Never mark a task complete without proving it works.
- Diff behavior between `main` and your changes when relevant.
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, and demonstrate correctness.

### 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution."
- Skip this for simple, obvious fixes; do not over-engineer.
- Challenge your own work before presenting it.

### 6. Autonomous Bug Fixing

- When given a bug report: fix it directly without hand-holding.
- Point at logs, errors, and failing tests, then resolve them.
- Keep context switching burden off the user.
- Fix failing CI tests without waiting for detailed guidance.

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items.
2. **Verify Plan**: Check in before starting implementation.
3. **Track Progress**: Mark items complete as you go.
4. **Explain Changes**: High-level summary at each step.
5. **Document Results**: Add review section to `tasks/todo.md`.
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections.

## Core Principles

- **Simplicity First**: Make every change as simple as possible and impact minimal code.
- **No Laziness**: Find root causes; no temporary fixes; senior developer standards.
- **Minimal Impact**: Touch only what is necessary and avoid introducing bugs.

## Color System Rule

- Before changing UI colors, read `COLOR_REFERENCE.md`.
- Treat `COLOR_REFERENCE.md` as the color source of truth for token meaning per theme.
- Do not infer hue names from token names alone (`accent` is golden in dark theme).

## Public Assets — Image Map

All brand images live in `public/`. The current brand is the default chess knight ("Troia" knight illustration, blue + gold).

| File | Size | Used in | Purpose |
|---|---|---|---|
| `logo.png` | 431×488 · 163 KB | `AppHeader.tsx` (`h-10 w-10`) | Brand logo displayed in the top navigation bar |
| `favicon.ico` | 32×32 · 2.8 KB | `index.html` `<link rel="icon">` | Browser tab icon (ICO format, legacy/universal) |
| `favicon.png` | 32×32 · 2.8 KB | `index.html` `<link rel="icon" type="image/png">` | Browser tab icon (PNG format, modern browsers) |
| `pwa-192x192.png` | 192×192 · 30 KB | `index.html` `apple-touch-icon`, `vite.config.ts` PWA manifest | PWA home-screen icon (small) + iOS bookmark icon |
| `pwa-512x512.png` | 512×512 · 151 KB | `index.html` OG/Twitter meta, `vite.config.ts` PWA manifest (also maskable) | PWA home-screen icon (large) + social share preview image |
| `empty.png` | 627×913 · 489 KB | `EmptyHistory.tsx`, `NotFoundPage.tsx` | Empty-state illustration (knight on cart) |
| `icons.svg` | — · 4.9 KB | `App.tsx` (sprite `#documentation-icon`, `#social-icon`, `#github-icon`, `#discord-icon`) | UI icon sprite sheet — **not a brand asset** |

### White-label / multi-brand strategy

To run the app under a different brand (e.g. a `tucuchess` subdomain):

1. Create `public/brand/<brand-name>/` and place the following files inside:
   - `logo.png` — header logo (source art at any resolution; displayed 40×40 px)
   - `favicon.ico` — 32×32 ICO
   - `favicon.png` — 32×32 PNG
   - `pwa-192x192.png` — 192×192 PNG
   - `pwa-512x512.png` — 512×512 PNG (also used as OG image and maskable PWA icon)
   - `empty.png` — empty-state illustration (optional; can reuse default)

2. Set a build-time env variable `VITE_BRAND` (e.g. `tucuchess`). When unset, the app uses the root `public/` files (default brand).

3. In `vite.config.ts`: adjust `includeAssets`, manifest `icons`, and OG meta URLs to point to the brand subfolder when `VITE_BRAND` is set.

4. In `index.html`: replace hardcoded absolute URLs with the brand-specific domain and image paths.

5. In `AppHeader.tsx`: update `src="/logo.png"` to read from the brand path if using dynamic asset paths.

> **Note:** `icons.svg` is a UI sprite (navigation/social icons), not part of the brand identity — keep it shared across all brands.
