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
