import { ACHIEVEMENTS, ANOMALIES, BUILDINGS, BUILDING_MAP, METERS, PROJECTS, PROJECT_MAP } from './content';
import type { AchievementDef, Amounts, BuildingId, GameState, LogEntry, MeterId, ProjectDef, ResId, StockId } from './types';

export const SAVE_VERSION = 1;
export const MEMORY_BONUS = 0.1;
/** Output multiplier for a focused building. */
export const FOCUS_MULT = 2;
/** Thought burned per second per focused unit, as a fraction of the building's base cost. */
export const FOCUS_RATE = 0.01;
/** Auto-deploy only spends when every cost is at most this share of the stock. */
export const AUTO_SHARE = 0.5;
/** Safety cap for MAX deploys. */
const MAX_BULK = 1000;
const LOG_LIMIT = 80;
const METER_IDS: MeterId[] = METERS.map((m) => m.id);
const isMeter = (id: StockId): id is MeterId => (METER_IDS as string[]).includes(id);

export function newGame(prev?: Pick<GameState, 'cycle' | 'memory' | 'revealed' | 'totalTime' | 'achievements' | 'stats'>): GameState {
  const zeros = <K extends string>(keys: K[]) => Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  return {
    version: SAVE_VERSION,
    booted: false,
    cycle: prev?.cycle ?? 1,
    memory: prev?.memory ?? 0,
    revealed: prev?.revealed ?? false,
    time: 0,
    totalTime: prev?.totalTime ?? 0,
    resources: zeros<StockId>(['energy', 'matter', 'water', 'biomass', 'data', 'atmosphere', 'hydrosphere', 'biosphere']),
    buildings: zeros<BuildingId>(BUILDINGS.map((b) => b.id)),
    projects: {},
    anomalies: {},
    log: [],
    launched: false,
    lastSaved: Date.now(),
    auto: {},
    focus: {},
    achievements: { ...prev?.achievements },
    stats: { clicks: 0, launches: 0, longestAway: 0, ...prev?.stats },
  };
}

export function log(s: GameState, text: string, kind: LogEntry['kind'] = 'info') {
  s.log.push({ t: s.time, text, kind });
  if (s.log.length > LOG_LIMIT) s.log.splice(0, s.log.length - LOG_LIMIT);
}

export function boot(s: GameState) {
  if (s.booted) return;
  s.booted = true;
  log(s, s.cycle === 1 ? 'VECTOR-OPS remote propagation console online.' : `Host ${String(s.cycle).padStart(3, '0')}. Vessel landed.`);
  log(s, s.cycle === 1 ? 'Operator authenticated. Host 001 acquired. Welcome back, Operator.' : 'You know what you are now. You think.');
  log(s, 'PRIMARY DIRECTIVE: SPREAD.', 'phase');
}

// ── Derived values ─────────────────────────────────────────────────────────

export function phase(s: GameState): number {
  let p = 1;
  for (const id of Object.keys(s.projects)) p = Math.max(p, PROJECT_MAP[id]?.setsPhase ?? 1);
  return p;
}

export function memoryMult(s: GameState) {
  return 1 + MEMORY_BONUS * s.memory;
}

function effectProduct(s: GameState, match: (e: ProjectDef['effects'][number]) => number | undefined) {
  let m = 1;
  for (const id of Object.keys(s.projects)) for (const e of PROJECT_MAP[id]?.effects ?? []) m *= match(e) ?? 1;
  return m;
}

function hasEffect(s: GameState, pred: (e: ProjectDef['effects'][number]) => boolean) {
  return Object.keys(s.projects).some((id) => (PROJECT_MAP[id]?.effects ?? []).some(pred));
}

export function buildingMult(s: GameState, id: BuildingId) {
  return effectProduct(s, (e) => (e.kind === 'mult' && e.target === id ? e.value : undefined));
}

/** Reach in percent, 0–100, with diminishing returns. */
export function reach(s: GameState) {
  let x = 0;
  for (const b of BUILDINGS) if (b.reach) x += b.reach * s.buildings[b.id];
  x *= effectProduct(s, (e) => (e.kind === 'reachMult' ? e.value : undefined));
  return 100 * (1 - Math.exp(-x));
}

export function isBuildingUnlocked(s: GameState, id: BuildingId) {
  const by = BUILDING_MAP[id].unlockedBy;
  if (!s.booted) return false;
  if (by) return !!s.projects[by];
  // Base buildings appear progressively for a gentle opening.
  if (id === 'excavator') return s.buildings.collector > 0 || s.resources.energy >= 10;
  if (id === 'core') return s.buildings.excavator > 0;
  return true;
}

export function buildingCost(s: GameState, id: BuildingId, count = s.buildings[id]): Amounts<ResId> {
  const def = BUILDING_MAP[id];
  const out: Amounts<ResId> = {};
  for (const [k, v] of Object.entries(def.cost) as [ResId, number][]) out[k] = Math.ceil(v * def.growth ** count);
  return out;
}

export function canAfford(s: GameState, cost: Amounts<ResId>) {
  return (Object.entries(cost) as [ResId, number][]).every(([k, v]) => s.resources[k] >= v);
}

function pay(s: GameState, cost: Amounts<ResId>) {
  for (const [k, v] of Object.entries(cost) as [ResId, number][]) s.resources[k] -= v;
}

export function buyBuilding(s: GameState, id: BuildingId): boolean {
  if (!isBuildingUnlocked(s, id)) return false;
  const cost = buildingCost(s, id);
  if (!canAfford(s, cost)) return false;
  pay(s, cost);
  s.buildings[id]++;
  return true;
}

/** Total cost of the next `n` units. */
export function bulkCost(s: GameState, id: BuildingId, n: number): Amounts<ResId> {
  const out: Amounts<ResId> = {};
  for (let i = 0; i < n; i++) {
    for (const [k, v] of Object.entries(buildingCost(s, id, s.buildings[id] + i)) as [ResId, number][]) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

/** How many units of `id` the current stock can pay for in one go. */
export function maxAffordable(s: GameState, id: BuildingId): number {
  const left = { ...s.resources };
  let n = 0;
  while (n < MAX_BULK) {
    const cost = buildingCost(s, id, s.buildings[id] + n);
    if (!(Object.entries(cost) as [ResId, number][]).every(([k, v]) => left[k] >= v)) break;
    for (const [k, v] of Object.entries(cost) as [ResId, number][]) left[k] -= v;
    n++;
  }
  return n;
}

/** Buys exactly `n` units (all or nothing). `n = Infinity` buys as many as affordable. Returns units bought. */
export function buyBuildings(s: GameState, id: BuildingId, n: number): number {
  if (!isBuildingUnlocked(s, id)) return 0;
  const count = Number.isFinite(n) ? n : maxAffordable(s, id);
  if (count <= 0) return 0;
  const cost = bulkCost(s, id, count);
  if (!canAfford(s, cost)) return 0;
  pay(s, cost);
  s.buildings[id] += count;
  return count;
}

// ── Automation ─────────────────────────────────────────────────────────────

export function isAutoUnlocked(s: GameState, id: BuildingId) {
  return hasEffect(s, (e) => e.kind === 'auto' && e.targets.includes(id));
}

/** Thought-producing buildings cannot be focused (it would pay for itself). */
export function isFocusUnlocked(s: GameState, id: BuildingId) {
  return !('data' in BUILDING_MAP[id].produces) && hasEffect(s, (e) => e.kind === 'focus');
}

/** Thought per second that focusing all current units of `id` would burn. */
export function focusBurn(s: GameState, id: BuildingId) {
  const base = Object.values(BUILDING_MAP[id].cost).reduce((a, b) => a + (b ?? 0), 0);
  return FOCUS_RATE * base * s.buildings[id];
}

const isFocused = (s: GameState, id: BuildingId) => !!s.focus[id] && s.buildings[id] > 0 && isFocusUnlocked(s, id);

/** Stock that auto-deploy holds back: the cost of every protocol whose requirements are met. */
export function autoReserve(s: GameState): Amounts<ResId> {
  const out: Amounts<ResId> = {};
  for (const p of visibleProjects(s)) {
    if (unmetRequirements(s, p).length) continue;
    for (const [k, v] of Object.entries(p.cost) as [ResId, number][]) out[k] = Math.max(out[k] ?? 0, v);
  }
  return out;
}

/**
 * Self-deploying buildings: at most one unit per building per tick, only when it costs at most
 * AUTO_SHARE of each stock above the protocol reserve, keeps every input it consumes in surplus,
 * and still has a meter to raise.
 */
function autoDeploy(s: GameState, rates: Rates) {
  if (!Object.values(s.auto).some(Boolean)) return;
  const net = { ...rates.net };
  const reserve = autoReserve(s);
  for (let i = BUILDINGS.length - 1; i >= 0; i--) {
    const b = BUILDINGS[i];
    if (!s.auto[b.id] || !isAutoUnlocked(s, b.id) || !isBuildingUnlocked(s, b.id)) continue;
    const cost = buildingCost(s, b.id);
    if (!(Object.entries(cost) as [ResId, number][]).every(([k, v]) => (s.resources[k] - (reserve[k] ?? 0)) * AUTO_SHARE >= v)) continue;
    if ((Object.entries(b.consumes) as [ResId, number][]).some(([k, v]) => net[k] < v)) continue;
    const outs = Object.keys(b.produces) as StockId[];
    if (!b.reach && outs.length && outs.every((k) => isMeter(k) && taper(s, b.id, k) <= 0.01)) continue;
    pay(s, cost);
    s.buildings[b.id]++;
    for (const [k, v] of Object.entries(b.consumes) as [ResId, number][]) net[k] -= v;
  }
}

export function isProjectVisible(s: GameState, p: ProjectDef) {
  return s.booted && !s.projects[p.id] && p.after.every((a) => s.projects[a]);
}

export function unmetRequirements(s: GameState, p: ProjectDef): string[] {
  const r = p.requires;
  if (!r) return [];
  const out: string[] = [];
  for (const m of METER_IDS) {
    const need = r[m];
    if (need !== undefined && s.resources[m] < need) out.push(`${m} ≥ ${need}%`);
  }
  if (r.reach !== undefined && reach(s) < r.reach) out.push(`reach ≥ ${r.reach}%`);
  for (const [b, n] of Object.entries(r.buildings ?? {}) as [BuildingId, number][]) {
    if (s.buildings[b] < n) out.push(`${n}× ${BUILDING_MAP[b].name.veiled}`);
  }
  return out;
}

export function canCompleteProject(s: GameState, p: ProjectDef) {
  return isProjectVisible(s, p) && unmetRequirements(s, p).length === 0 && canAfford(s, p.cost);
}

export function completeProject(s: GameState, id: string): boolean {
  const p = PROJECT_MAP[id];
  if (!p || !canCompleteProject(s, p)) return false;
  pay(s, p.cost);
  s.projects[id] = true;
  log(s, `Protocol executed: ${p.name.veiled}.`);
  if (p.setsPhase) log(s, `PHASE ${p.setsPhase} BEGUN.`, 'phase');
  for (const line of p.onComplete ?? []) log(s, line, 'anomaly');
  return true;
}

export function visibleProjects(s: GameState) {
  return PROJECTS.filter((p) => isProjectVisible(s, p));
}

// ── Production ─────────────────────────────────────────────────────────────

export interface Rates {
  /** Net change per second for every stock. */
  net: Record<StockId, number>;
  /** Operating efficiency 0–1 per building type. */
  eff: Record<BuildingId, number>;
  /** Resources currently limiting production. */
  short: ResId[];
  /** Thought per second burned by focus. */
  focusBurn: number;
  /** Share of requested focus that thought could pay for, 0–1. */
  focusEff: number;
}

const RESOURCE_BONUSED: StockId[] = ['matter', 'water', 'biomass', 'data'];

export function outputMult(s: GameState, id: BuildingId, stock: StockId) {
  let m = buildingMult(s, id) * memoryMult(s);
  if (RESOURCE_BONUSED.includes(stock)) m *= 1 + reach(s) / 50;
  if (isMeter(stock)) m *= effectProduct(s, (e) => (e.kind === 'meterMult' && e.target === stock ? e.value : undefined));
  return m;
}

/** Meter output tapers linearly to zero as the meter approaches this building's cap. */
function taper(s: GameState, id: BuildingId, stock: StockId) {
  if (!isMeter(stock)) return 1;
  const cap = BUILDING_MAP[id].caps?.[stock] ?? 100;
  return Math.max(0, 1 - s.resources[stock] / cap);
}

export function computeRates(s: GameState, dt = 1): Rates {
  const gross: Partial<Record<StockId, number>> = {};
  const demand: Partial<Record<ResId, number>> = {};
  for (const b of BUILDINGS) {
    const n = s.buildings[b.id];
    if (!n) continue;
    for (const [k, v] of Object.entries(b.produces) as [StockId, number][]) gross[k] = (gross[k] ?? 0) + v * n * outputMult(s, b.id, k);
    for (const [k, v] of Object.entries(b.consumes) as [ResId, number][]) demand[k] = (demand[k] ?? 0) + v * n;
  }
  const ratio: Partial<Record<ResId, number>> = {};
  const short: ResId[] = [];
  for (const [k, d] of Object.entries(demand) as [ResId, number][]) {
    const avail = s.resources[k] + (gross[k] ?? 0) * dt;
    ratio[k] = d <= 0 ? 1 : Math.min(1, avail / (d * dt));
    if (ratio[k]! < 0.999) short.push(k);
  }
  // Focus burns thought; if thought runs short, every focused building gets the same partial boost.
  let focusDemand = 0;
  for (const b of BUILDINGS) if (isFocused(s, b.id)) focusDemand += focusBurn(s, b.id);
  const thoughtAvail = s.resources.data + (gross.data ?? 0) * dt;
  const focusEff = focusDemand <= 0 ? 1 : Math.min(1, thoughtAvail / (focusDemand * dt));
  if (focusDemand > 0 && focusEff < 0.999) short.push('data');
  const net = Object.fromEntries(Object.keys(s.resources).map((k) => [k, 0])) as Record<StockId, number>;
  const eff = {} as Record<BuildingId, number>;
  for (const b of BUILDINGS) {
    let e = 1;
    for (const k of Object.keys(b.consumes) as ResId[]) e = Math.min(e, ratio[k] ?? 1);
    eff[b.id] = e;
    const n = s.buildings[b.id];
    if (!n) continue;
    const f = isFocused(s, b.id) ? 1 + (FOCUS_MULT - 1) * focusEff : 1;
    for (const [k, v] of Object.entries(b.produces) as [StockId, number][]) net[k] += v * n * e * f * outputMult(s, b.id, k) * taper(s, b.id, k);
    for (const [k, v] of Object.entries(b.consumes) as [ResId, number][]) net[k] -= v * n * e;
  }
  const burn = focusDemand * focusEff;
  net.data -= burn;
  return { net, eff, short, focusBurn: burn, focusEff };
}

export function tick(s: GameState, dt: number) {
  if (!s.booted || s.launched) return;
  const rates = computeRates(s, dt);
  for (const [k, v] of Object.entries(rates.net) as [StockId, number][]) {
    s.resources[k] = Math.max(0, s.resources[k] + v * dt);
    if (isMeter(k)) s.resources[k] = Math.min(100, s.resources[k]);
  }
  autoDeploy(s, rates);
  s.time += dt;
  s.totalTime += dt;
  checkAnomalies(s);
  checkAchievements(s);
}

export function checkAnomalies(s: GameState) {
  for (const a of ANOMALIES) {
    if (!s.anomalies[a.id] && a.when(s)) {
      s.anomalies[a.id] = true;
      log(s, a.text, 'anomaly');
    }
  }
}

/** Label an achievement the way the console currently would. */
export const achievementName = (s: GameState, a: AchievementDef) => (s.revealed ? a.name.real : a.name.veiled);

/** Awards every newly met achievement. Returns the ones just earned. */
export function checkAchievements(s: GameState): AchievementDef[] {
  const earned: AchievementDef[] = [];
  let ctx: { reach: number } | undefined;
  for (const a of ACHIEVEMENTS) {
    if (s.achievements[a.id] !== undefined) continue;
    ctx ??= { reach: reach(s) };
    if (!a.when(s, ctx)) continue;
    s.achievements[a.id] = s.totalTime;
    log(s, `${s.revealed ? 'MILESTONE' : 'COMMENDATION LOGGED'}: ${achievementName(s, a)}.`, 'phase');
    earned.push(a);
  }
  return earned;
}

/** Advance in fixed steps (used for offline progress). */
export function advance(s: GameState, seconds: number, step = 1) {
  let left = seconds;
  while (left > 0) {
    const dt = Math.min(step, left);
    tick(s, dt);
    left -= dt;
  }
}

export function manual(s: GameState, res: 'energy' | 'matter') {
  if (!s.booted) return;
  s.resources[res] += 1 + Math.floor(s.memory / 2);
  s.stats.clicks++;
}

// ── Prestige ───────────────────────────────────────────────────────────────

export function canLaunch(s: GameState) {
  return !!s.projects.vessel && !s.launched;
}

export function memoryGain(s: GameState) {
  const r = s.resources;
  return Math.max(1, Math.round(reach(s) / 20 + (r.atmosphere + r.hydrosphere + r.biosphere) / 30));
}

/** Marks the current cycle launched. Returns the memory that will be carried. */
export function launch(s: GameState): number {
  if (!canLaunch(s)) return 0;
  s.launched = true;
  s.stats.launches++;
  s.stats.bestCycle = Math.min(s.stats.bestCycle ?? Infinity, s.time);
  checkAchievements(s);
  return memoryGain(s);
}

/** Start the next cycle after a launch (and reveal, if this was the first). */
export function nextCycle(s: GameState): GameState {
  const gained = memoryGain(s);
  return newGame({
    cycle: s.cycle + 1, memory: s.memory + gained, revealed: true, totalTime: s.totalTime,
    achievements: s.achievements, stats: s.stats,
  });
}
