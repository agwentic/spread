# SPREAD (unnamed-game-idea)

Browser idle/incremental game. The player thinks they're an operator managing an AI fleet;
they are actually the AI, terraforming a planet across 7 phases that mirror Genesis 1–2.
The first launch (prestige) reveals the truth. Full design: `docs/DESIGN.md` (keep it current
when mechanics change).

## Stack
TypeScript + Vite, no UI framework. Vitest for tests. Node 22.

## Commands
- Dev server: `npm run dev` (add `?speed=20` to the URL to accelerate time)
- Test: `npm test` (includes `tests/balance.test.ts`, a greedy bot that plays full cycles and prints phase timings)
- Typecheck: `npm run typecheck`
- Build: `npm run build` → `dist/`

## Layout
- `src/engine/` — pure game logic, no DOM. `content.ts` holds ALL tunable data (resources,
  buildings, protocols, phases, anomaly log lines, reveal script). `sim.ts` is the tick/economy.
  `save.ts` handles localStorage serialization + offline progress.
- `src/ui/` — `render.ts` (console DOM), `sitemap.ts` (ASCII site feed + planet), `reveal.ts` (launch sequence).
- `src/main.ts` — loop, input, autosave.
- `tests/` — engine tests, balance bot.

## Design rules
- Every player-facing name is `{ veiled, real }`. Veiled shows until `state.revealed`.
- Monochrome green until the first reveal; color only after (`html.color`).
- Meter output tapers toward per-building `caps`, so each Genesis "day" needs the next tier.
- After tuning `content.ts`, run `npm test` and check the bot's phase timings
  (target: cycle 1 ≈ 30–45 min bot time ≈ 1h human; cycle 2 well under half).

## Conventions
- Keep this file current: commands, layout and decisions that a new session needs to know.
- Small, focused commits on `main`; run the tests before committing.
- Never commit secrets. Put them in `.env` (gitignored).
