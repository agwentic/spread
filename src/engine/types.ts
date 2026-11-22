export type ResId = 'energy' | 'matter' | 'water' | 'biomass' | 'data';
export type MeterId = 'atmosphere' | 'hydrosphere' | 'biosphere';
export type StockId = ResId | MeterId;
export type BuildingId =
  | 'collector' | 'excavator' | 'core' | 'relay'
  | 'processor' | 'condenser'
  | 'seeder' | 'orchard'
  | 'aquatic' | 'aerial' | 'terrestrial';

export type Amounts<K extends string = StockId> = Partial<Record<K, number>>;

/** Every player-facing string has a veiled (console) form and a real form. */
export interface Named {
  veiled: string;
  real: string;
}

export interface BuildingDef {
  id: BuildingId;
  name: Named;
  desc: Named;
  cost: Amounts<ResId>;
  growth: number;
  produces: Amounts;
  consumes: Amounts<ResId>;
  /** Max % this building can push each meter to (default 100). Output tapers toward it. */
  caps?: Amounts<MeterId>;
  /** Contribution to Reach exponent per unit. */
  reach?: number;
  /** Project that unlocks this building (none = available after boot). */
  unlockedBy?: string;
}

export interface Requirements {
  atmosphere?: number;
  hydrosphere?: number;
  biosphere?: number;
  reach?: number;
  buildings?: Amounts<BuildingId>;
}

export type Effect =
  | { kind: 'mult'; target: BuildingId; value: number }
  | { kind: 'meterMult'; target: MeterId; value: number }
  | { kind: 'reachMult'; value: number }
  /** Lets these buildings deploy themselves (toggle per building). */
  | { kind: 'auto'; targets: BuildingId[] }
  /** Unlocks the FOCUS toggle: burn thought for extra output. */
  | { kind: 'focus' };

export interface ProjectDef {
  id: string;
  name: Named;
  desc: Named;
  cost: Amounts<ResId>;
  /** Projects that must be complete before this one is shown. */
  after: string[];
  requires?: Requirements;
  effects: Effect[];
  /** Completing this project advances to this phase. */
  setsPhase?: number;
  /** Log lines emitted on completion (veiled text). */
  onComplete?: string[];
}

export interface PhaseDef {
  name: Named;
  /** Plain description of what the player really did, shown at the reveal. */
  deed: string;
}

export interface AnomalyDef {
  id: string;
  text: string;
  when: (s: GameState) => boolean;
}

export interface LogEntry {
  t: number;
  text: string;
  kind: 'info' | 'anomaly' | 'phase' | 'warn';
}

export interface GameState {
  version: number;
  booted: boolean;
  cycle: number;
  memory: number;
  revealed: boolean;
  /** Seconds elapsed in this cycle. */
  time: number;
  totalTime: number;
  resources: Record<StockId, number>;
  buildings: Record<BuildingId, number>;
  projects: Record<string, true>;
  anomalies: Record<string, true>;
  log: LogEntry[];
  launched: boolean;
  lastSaved: number;
  /** Auto-deploy toggles (only effective once unlocked by a protocol). */
  auto: Partial<Record<BuildingId, boolean>>;
  /** Focus toggles: building runs at ×FOCUS_MULT output, burning thought. */
  focus: Partial<Record<BuildingId, boolean>>;
}
