# SPREAD (unnamed-game-idea)

Browser idle/incremental game. The player thinks they're an operator managing an AI fleet;
they are actually a self-replicating probe (the AI) seeding life on a planet across 7 phases that echo a creation story. Imply godhood, never state it: no scripture, never the word "god". Humans are the finish line. The veiled (pre-reveal) vocabulary reads like an infection (host, payload, vectors, shedding) but never calls the player a virus.
The first launch (prestige) reveals the truth. Full design: `docs/DESIGN.md` (keep it current
when mechanics change).

## Stack
TypeScript + Vite, no UI framework. Vitest for tests. Node 22.

## Commands
- Dev server: `npm run dev` (add `?speed=20` to the URL to accelerate time)
- Test: `npm test` (includes `tests/balance.test.ts`, a greedy bot that plays full cycles and prints phase timings)
- Typecheck: `npm run typecheck`
- Build: `npm run build` → `dist/` (relative base, works under any path)
- Deploy: `npm run deploy` (tests, builds, force-pushes `dist/` to the `gh-pages` branch) → https://agwentic.github.io/spread/

## Layout
- `src/engine/` — pure game logic, no DOM. `content.ts` holds ALL tunable data (resources,
  buildings, protocols, phases, anomaly log lines, reveal script). `sim.ts` is the tick/economy.
  `save.ts` handles localStorage serialization + offline progress.
- `src/ui/` — `render.ts` (console DOM), `sitemap.ts` (ASCII site feed + planet), `reveal.ts` (launch sequence), `achievements.ts` (panel + toasts).
- `src/main.ts` — loop, input, autosave.
- `tests/` — engine tests, balance bot.

## Design rules
- Every player-facing name is `{ veiled, real }`. Veiled shows until `state.revealed`.
- Monochrome green until the first reveal; color only after (`html.color`). Host-feed glyphs are abstract until the reveal (`VEILED_GLYPH` in `sitemap.ts`).
- Layout must fit any window: app shell is 100dvh, columns scroll internally, map font scales with container width/height, tabs below 900px.
- Meter output tapers toward per-building `caps`, so each Genesis "day" needs the next tier.
- Achievements (`ACHIEVEMENTS` in `content.ts`) are checked every tick and on launch/offline; they and
  `state.stats` survive launches. UI in `src/ui/achievements.ts` (footer panel + toasts). The balance bot prints which ones it earns.
- Thought sinks: AUTO protocols (per tier) and FOCUS (burns thought for ×2 output). Auto-deploy
  holds back the cost of executable protocols so it never starves the chapter breaks. Bulk deploy is free UI.
- After tuning `content.ts`, run `npm test` and check the bot's phase timings
  (target: cycle 1 ≈ 30–45 min bot time ≈ 1h human; cycle 2 well under half). The bot also
  reports manual / auto-only / focus-only runs for comparison.

## Conventions
- Keep this file current: commands, layout and decisions that a new session needs to know.
- Small, focused commits on `main`; run the tests before committing.
- Never commit secrets. Put them in `.env` (gitignored).
