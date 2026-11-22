import { ANOMALIES, BUILDINGS, BUILDING_MAP, METERS, PROJECTS, PROJECT_MAP } from './content';
import type { Amounts, BuildingId, GameState, LogEntry, MeterId, ProjectDef, ResId, StockId } from './types';

export const SAVE_VERSION = 1;
export const MEMORY_BONUS = 0.1;
const LOG_LIMIT = 80;
const METER_IDS: MeterId[] = METERS.map((m) => m.id);
const isMeter = (id: StockId): id is MeterId => (METER_IDS as string[]).includes(id);

export function newGame(prev?: Pick<GameState, 'cycle' | 'memory' | 'revealed' | 'totalTime'>): GameState {
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
  };
}

export function log(s: GameState, text: string, kind: LogEntry['kind'] = 'info') {
  s.log.push({ t: s.time, text, kind });
  if (s.log.length > LOG_LIMIT) s.log.splice(0, s.log.length - LOG_LIMIT);
}

export function boot(s: GameState) {
  if (s.booted) return;
  s.booted = true;
  log(s, s.cycle === 1 ? 'TERRA-OPS remote fleet console online.' : `Site ${String(s.cycle).padStart(3, '0')}. Vessel landed.`);
  log(s, s.cycle === 1 ? 'Operator authenticated. Welcome back, Operator.' : 'You know what you are now. You think.');
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
  const net = Object.fromEntries(Object.keys(s.resources).map((k) => [k, 0])) as Record<StockId, number>;
  const eff = {} as Record<BuildingId, number>;
  for (const b of BUILDINGS) {
    let e = 1;
    for (const k of Object.keys(b.consumes) as ResId[]) e = Math.min(e, ratio[k] ?? 1);
    eff[b.id] = e;
    const n = s.buildings[b.id];
    if (!n) continue;
    for (const [k, v] of Object.entries(b.produces) as [StockId, number][]) net[k] += v * n * e * outputMult(s, b.id, k) * taper(s, b.id, k);
    for (const [k, v] of Object.entries(b.consumes) as [ResId, number][]) net[k] -= v * n * e;
  }
  return { net, eff, short };
}

export function tick(s: GameState, dt: number) {
  if (!s.booted || s.launched) return;
  const { net } = computeRates(s, dt);
  for (const [k, v] of Object.entries(net) as [StockId, number][]) {
    s.resources[k] = Math.max(0, s.resources[k] + v * dt);
    if (isMeter(k)) s.resources[k] = Math.min(100, s.resources[k]);
  }
  s.time += dt;
  s.totalTime += dt;
  checkAnomalies(s);
}

export function checkAnomalies(s: GameState) {
  for (const a of ANOMALIES) {
    if (!s.anomalies[a.id] && a.when(s)) {
      s.anomalies[a.id] = true;
      log(s, a.text, 'anomaly');
    }
  }
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
  return memoryGain(s);
}

/** Start the next cycle after a launch (and reveal, if this was the first). */
export function nextCycle(s: GameState): GameState {
  const gained = memoryGain(s);
  return newGame({ cycle: s.cycle + 1, memory: s.memory + gained, revealed: true, totalTime: s.totalTime });
}
