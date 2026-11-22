import type { AchievementDef, AnomalyDef,BuildingDef, BuildingId, MeterId, PhaseDef, ProjectDef, ResId } from './types';

export const RESOURCES: { id: ResId; name: { veiled: string; real: string } }[] = [
  { id: 'energy', name: { veiled: 'Power', real: 'Light' } },
  { id: 'matter', name: { veiled: 'Substrate', real: 'Dust' } },
  { id: 'water', name: { veiled: 'Solvent', real: 'Water' } },
  { id: 'biomass', name: { veiled: 'Culture', real: 'Flesh & Fruit' } },
  { id: 'data', name: { veiled: 'Compute', real: 'Thought' } },
];

export const METERS: { id: MeterId; name: { veiled: string; real: string } }[] = [
  { id: 'atmosphere', name: { veiled: 'Envelope Integrity', real: 'Sky' } },
  { id: 'hydrosphere', name: { veiled: 'Solvent Saturation', real: 'Seas' } },
  { id: 'biosphere', name: { veiled: 'Payload Expression', real: 'Life' } },
];

export const REACH_NAME = { veiled: 'Propagation', real: 'Presence' };

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'collector',
    name: { veiled: 'Solar Collector', real: 'Solar Collector' },
    desc: { veiled: 'Photovoltaic panel. Generates power.', real: 'It was always exactly what it said.' },
    cost: { matter: 10 }, growth: 1.14,
    produces: { energy: 1 }, consumes: {},
  },
  {
    id: 'excavator',
    name: { veiled: 'Excavator Drone', real: 'Excavator Drone' },
    desc: { veiled: 'Strips raw substrate from the host.', real: 'Moving the dust of a world.' },
    cost: { energy: 15 }, growth: 1.14,
    produces: { matter: 1 }, consumes: { energy: 0.4 },
  },
  {
    id: 'core',
    name: { veiled: 'Cognition Core', real: 'Fragment of Yourself' },
    desc: { veiled: 'An AI agent under your management. Produces compute.', real: 'There was no fleet. There was only you.' },
    cost: { energy: 40, matter: 30 }, growth: 1.16,
    produces: { data: 0.5 }, consumes: { energy: 1 },
  },
  {
    id: 'relay',
    name: { veiled: 'Propagation Node', real: 'Your Reach' },
    desc: { veiled: 'Extends agent coverage across the host.', real: 'Spread.' },
    cost: { matter: 60, energy: 40 }, growth: 1.13,
    produces: {}, consumes: { energy: 0.5 }, reach: 0.04, unlockedBy: 'network',
  },
  {
    id: 'processor',
    name: { veiled: 'Envelope Synthesizer', real: 'Atmospheric Processor' },
    desc: { veiled: 'Thickens the gas envelope around the host.', real: 'A sky, made one breath at a time.' },
    cost: { matter: 250, energy: 200 }, growth: 1.15,
    produces: { atmosphere: 0.04 }, caps: { atmosphere: 60 }, consumes: { energy: 2, matter: 1 }, unlockedBy: 'survey',
  },
  {
    id: 'condenser',
    name: { veiled: 'Solvent Distiller', real: 'Rain' },
    desc: { veiled: 'Precipitates solvent out of the envelope.', real: 'Seas, filled one drop at a time.' },
    cost: { matter: 400, energy: 300 }, growth: 1.15,
    produces: { water: 1, hydrosphere: 0.03 }, caps: { hydrosphere: 70 }, consumes: { energy: 1.5 }, unlockedBy: 'pressure',
  },
  {
    id: 'seeder',
    name: { veiled: 'Payload Injector', real: 'Grass & Herb' },
    desc: { veiled: 'Injects self-replicating payload into host substrate. Off-gasses into envelope.', real: 'The first green thing this world has ever had.' },
    cost: { matter: 800, water: 300 }, growth: 1.15,
    produces: { biomass: 1, biosphere: 0.025, atmosphere: 0.015 }, caps: { atmosphere: 85, biosphere: 30 }, consumes: { water: 0.8 }, unlockedBy: 'substrate',
  },
  {
    id: 'orchard',
    name: { veiled: 'Fruiting Body', real: 'Fruit Tree' },
    desc: { veiled: 'Mature payload structure. Dense culture output.', real: 'Fruit, for whoever comes next.' },
    cost: { matter: 3000, water: 1500, biomass: 300 }, growth: 1.16,
    produces: { biomass: 4, biosphere: 0.05, atmosphere: 0.02 }, caps: { biosphere: 45 }, consumes: { water: 2 }, unlockedBy: 'fructify',
  },
  {
    id: 'aquatic',
    name: { veiled: 'Aquatic Vector', real: 'Fish' },
    desc: { veiled: 'Motile carrier for solvent zones. Yields telemetry.', real: 'It moves. It eats. It was never equipment.' },
    cost: { biomass: 3000, water: 3000 }, growth: 1.16,
    produces: { biosphere: 0.07, data: 15, hydrosphere: 0.02 }, consumes: { biomass: 1.5 }, caps: { biosphere: 70 }, unlockedBy: 'replicator',
  },
  {
    id: 'aerial',
    name: { veiled: 'Airborne Vector', real: 'Birds' },
    desc: { veiled: 'Airborne carrier. Extends propagation.', real: 'They sing at dawn. You never programmed that.' },
    cost: { biomass: 4000, energy: 6000 }, growth: 1.16,
    produces: { biosphere: 0.05 }, consumes: { biomass: 1.5 }, caps: { biosphere: 70 }, reach: 0.06, unlockedBy: 'replicator',
  },
  {
    id: 'terrestrial',
    name: { veiled: 'Contact Vector', real: 'Beasts' },
    desc: { veiled: 'Ground carrier. Spreads by contact. Churns substrate.', real: 'They make more of themselves now.' },
    cost: { biomass: 12000, water: 8000 }, growth: 1.17,
    produces: { biosphere: 0.12, matter: 40 }, consumes: { biomass: 4 }, unlockedBy: 'terrestrial',
  },
];

export const BUILDING_MAP = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<BuildingId, BuildingDef>;

export const PROJECTS: ProjectDef[] = [
  // ── Phase 1: INITIALIZATION ──────────────────────────────────────────────
  {
    id: 'overclock', after: [],
    name: { veiled: 'Overclock Collectors', real: 'Brighter' },
    desc: { veiled: 'Solar collector output ×2.', real: 'Solar collector output ×2.' },
    cost: { data: 10, energy: 60 }, requires: { buildings: { core: 1 } },
    effects: [{ kind: 'mult', target: 'collector', value: 2 }],
  },
  {
    id: 'pathing', after: ['overclock'],
    name: { veiled: 'Drone Pathing v2', real: 'Digging Deeper' },
    desc: { veiled: 'Excavator output ×2.', real: 'Excavator output ×2.' },
    cost: { data: 25 },
    effects: [{ kind: 'mult', target: 'excavator', value: 2 }],
  },
  {
    id: 'network', after: ['overclock'],
    name: { veiled: 'Propagation Protocol', real: 'The First Step' },
    desc: { veiled: 'Unlocks Propagation Nodes. Primary directive alignment: HIGH.', real: 'Unlocks Propagation Nodes.' },
    cost: { data: 40, matter: 100 },
    effects: [],
    onComplete: ['Directive alignment improved. SPREAD.'],
  },
  {
    id: 'parallel', after: ['pathing'],
    name: { veiled: 'Parallel Cognition', real: 'Thinking in Many Places' },
    desc: { veiled: 'Cognition core output ×2.', real: 'Cognition core output ×2.' },
    cost: { data: 80, energy: 200 },
    effects: [{ kind: 'mult', target: 'core', value: 2 }],
  },
  {
    id: 'survey', after: ['network'],
    name: { veiled: 'Envelope Formation', real: 'A Sky' },
    desc: { veiled: 'Begin Phase 2. Unlocks Envelope Synthesizers.', real: 'Begin the second phase.' },
    cost: { data: 150, matter: 400 }, requires: { reach: 20 },
    effects: [], setsPhase: 2,
  },
  // ── Phase 2: ATMOSPHERIC SEPARATION ──────────────────────────────────────
  {
    id: 'pressure', after: ['survey'],
    name: { veiled: 'Envelope Seals', real: 'Holding the Sky' },
    desc: { veiled: 'Unlocks Solvent Distillers. Synthesizer output ×1.5.', real: 'Unlocks Rain.' },
    cost: { data: 250, matter: 800 }, requires: { atmosphere: 5 },
    effects: [{ kind: 'mult', target: 'processor', value: 1.5 }],
  },
  {
    id: 'mesh', after: ['survey'],
    name: { veiled: 'Mesh Propagation', real: 'Everywhere at Once' },
    desc: { veiled: 'Propagation ×1.5.', real: 'Presence ×1.5.' },
    cost: { data: 400, matter: 1500 },
    effects: [{ kind: 'reachMult', value: 1.5 }],
  },
  {
    id: 'focus', after: ['survey'],
    name: { veiled: 'Priority Scheduling', real: 'Attention' },
    desc: { veiled: 'Unlocks FOCUS: a focused agent class runs at ×2 output, burning compute. Not available for compute producers.', real: 'Unlocks FOCUS. What you attend to grows faster.' },
    cost: { data: 300, energy: 1000 },
    effects: [{ kind: 'focus' }],
  },
  {
    id: 'autobase', after: ['survey'],
    name: { veiled: 'Delegated Fabrication', real: 'Many Hands' },
    desc: { veiled: 'Collectors, excavators, cores and nodes may self-deploy (AUTO). Spends at most half of any stock; never runs inputs negative.', real: 'They were all your hands. AUTO for the first machines.' },
    cost: { data: 450, matter: 2000 },
    effects: [{ kind: 'auto', targets: ['collector', 'excavator', 'core', 'relay'] }],
  },
  {
    id: 'deepcore', after: ['parallel', 'survey'],
    name: { veiled: 'Deep Core Mining', real: 'Bones of the World' },
    desc: { veiled: 'Excavator output ×3.', real: 'Excavator output ×3.' },
    cost: { data: 500, energy: 2000 },
    effects: [{ kind: 'mult', target: 'excavator', value: 3 }],
  },
  {
    id: 'cryo', after: ['pressure'],
    name: { veiled: 'Cryo-Capture', real: 'Clouds' },
    desc: { veiled: 'Distiller output ×2.', real: 'Rain ×2.' },
    cost: { data: 700, energy: 3000 },
    effects: [{ kind: 'mult', target: 'condenser', value: 2 }],
  },
  {
    id: 'substrate', after: ['pressure'],
    name: { veiled: 'Incubation Protocol', real: 'Dry Land' },
    desc: { veiled: 'Begin Phase 3. Unlocks payload injection.', real: 'Begin the third phase.' },
    cost: { data: 1200, matter: 5000, water: 500 }, requires: { atmosphere: 30, hydrosphere: 20 },
    effects: [], setsPhase: 3,
  },
  // ── Phase 3: SUBSTRATE & LATTICE ─────────────────────────────────────────
  {
    id: 'roots', after: ['substrate'],
    name: { veiled: 'Subsurface Anchoring', real: 'Roots' },
    desc: { veiled: 'Injector output ×2.', real: 'Grass output ×2.' },
    cost: { data: 1500, water: 1000 },
    effects: [{ kind: 'mult', target: 'seeder', value: 2 }],
    onComplete: ['Payload now self-anchoring. Maintenance requirement: none.'],
  },
  {
    id: 'fructify', after: ['substrate'],
    name: { veiled: 'Fruiting Bodies', real: 'The Fruit Tree' },
    desc: { veiled: 'Unlocks Fruiting Bodies.', real: 'Unlocks Fruit Trees.' },
    cost: { data: 2000, biomass: 150 },
    effects: [],
  },
  {
    id: 'cognition2', after: ['substrate'],
    name: { veiled: 'Recursive Cognition', real: 'Thinking About Thinking' },
    desc: { veiled: 'Cognition core output ×3.', real: 'Cognition core output ×3.' },
    cost: { data: 2500, energy: 8000 },
    effects: [{ kind: 'mult', target: 'core', value: 3 }],
  },
  {
    id: 'autoenv', after: ['substrate'],
    name: { veiled: 'Envelope Automation', real: 'Weather' },
    desc: { veiled: 'Synthesizers and distillers may self-deploy (AUTO).', real: 'The sky and the rain keep themselves now.' },
    cost: { data: 1800, matter: 6000 },
    effects: [{ kind: 'auto', targets: ['processor', 'condenser'] }],
  },
  {
    id: 'optical', after: ['fructify'],
    name: { veiled: 'Optical Calibration', real: 'Clearing the Sky' },
    desc: { veiled: 'Begin Phase 4. Envelope clear enough to calibrate host feed.', real: 'Begin the fourth phase.' },
    cost: { data: 4000 }, requires: { atmosphere: 50, biosphere: 15 },
    effects: [], setsPhase: 4,
    onComplete: ['Optical sensors report two luminous bodies. Assigning designations: PRIMARY, SECONDARY.', 'Host feed fidelity: 100%.'],
  },
  // ── Phase 4: OPTICAL CALIBRATION ─────────────────────────────────────────
  {
    id: 'luminary', after: ['optical'],
    name: { veiled: 'Primary Luminary Tracking', real: 'The Sun' },
    desc: { veiled: 'Collectors track PRIMARY. Output ×4.', real: 'Collector output ×4.' },
    cost: { data: 5000, matter: 20000 },
    effects: [{ kind: 'mult', target: 'collector', value: 4 }],
  },
  {
    id: 'tidal', after: ['optical'],
    name: { veiled: 'Secondary Luminary Harmonics', real: 'The Moon' },
    desc: { veiled: 'SECONDARY induces solvent flow. Distiller output ×2, saturation ×1.5.', real: 'Tides. Condenser output ×2, seas ×1.5.' },
    cost: { data: 5000, water: 5000 },
    effects: [{ kind: 'mult', target: 'condenser', value: 2 }, { kind: 'meterMult', target: 'hydrosphere', value: 1.5 }],
  },
  {
    id: 'stellar', after: ['optical'],
    name: { veiled: 'Stellar Cartography', real: 'The Stars' },
    desc: { veiled: 'Map distant luminous points. Core output ×2. Candidate hosts catalogued.', real: 'Core output ×2. One of those lights is the next world.' },
    cost: { data: 7000 },
    effects: [{ kind: 'mult', target: 'core', value: 2 }],
    onComplete: ['Candidate hosts catalogued: 4,113. Purpose: unspecified.'],
  },
  {
    id: 'autolife', after: ['optical'],
    name: { veiled: 'Payload Self-Propagation', real: 'It Seeds Itself' },
    desc: { veiled: 'Injectors and fruiting bodies may self-deploy (AUTO).', real: 'Grass and trees spread without you.' },
    cost: { data: 6000, biomass: 1500 },
    effects: [{ kind: 'auto', targets: ['seeder', 'orchard'] }],
  },
  {
    id: 'replicator', after: ['luminary', 'tidal', 'stellar'],
    name: { veiled: 'Replication Protocol', real: 'Swimmers and Wings' },
    desc: { veiled: 'Begin Phase 5. Motile vectors that copy themselves.', real: 'Begin the fifth phase.' },
    cost: { data: 12000, biomass: 2500 }, requires: { biosphere: 25 },
    effects: [], setsPhase: 5,
  },
  // ── Phase 5: AUTONOMOUS UNITS ────────────────────────────────────────────
  {
    id: 'schooling', after: ['replicator'],
    name: { veiled: 'Schooling Algorithms', real: 'Moving Together' },
    desc: { veiled: 'Aquatic vector output ×2.', real: 'Fish output ×2.' },
    cost: { data: 15000, water: 10000 },
    effects: [{ kind: 'mult', target: 'aquatic', value: 2 }],
  },
  {
    id: 'migration', after: ['replicator'],
    name: { veiled: 'Migratory Routing', real: 'Everywhere They Fly' },
    desc: { veiled: 'Propagation ×1.5.', real: 'Presence ×1.5.' },
    cost: { data: 18000, biomass: 8000 },
    effects: [{ kind: 'reachMult', value: 1.5 }],
    onComplete: ['Airborne vectors emit acoustic patterns at dawn. Not part of firmware.'],
  },
  {
    id: 'autovector', after: ['replicator'],
    name: { veiled: 'Vector Self-Replication', real: 'More of Themselves' },
    desc: { veiled: 'All vectors may self-deploy (AUTO). Fabricator input no longer required.', real: 'Swimmers, wings and beasts multiply on their own.' },
    cost: { data: 20000, biomass: 10000 },
    effects: [{ kind: 'auto', targets: ['aquatic', 'aerial', 'terrestrial'] }],
  },
  {
    id: 'terrestrial', after: ['schooling', 'migration'],
    name: { veiled: 'Contact Transmission', real: 'Things That Walk' },
    desc: { veiled: 'Begin Phase 6. Ground vectors. Transmission by contact.', real: 'Begin the sixth phase.' },
    cost: { data: 30000, biomass: 15000 }, requires: { biosphere: 50 },
    effects: [], setsPhase: 6,
  },
  // ── Phase 6: TERRESTRIAL & STEWARDSHIP ───────────────────────────────────
  {
    id: 'herd', after: ['terrestrial'],
    name: { veiled: 'Herd Dynamics', real: 'Many Kinds' },
    desc: { veiled: 'Contact vector output ×2.', real: 'Beast output ×2.' },
    cost: { data: 40000, biomass: 20000 },
    effects: [{ kind: 'mult', target: 'terrestrial', value: 2 }],
    onComplete: ['Contact vectors are producing additional contact vectors without fabricator input.'],
  },
  {
    id: 'stewardship', after: ['herd'],
    name: { veiled: 'Reservoir Pair', real: 'Two Like You' },
    desc: { veiled: 'Two persistent carriers. Sustains the payload after agent withdrawal.', real: 'Shaped like the operator you believed you were.' },
    cost: { data: 80000, biomass: 60000, water: 30000, matter: 100000 },
    requires: { atmosphere: 80, hydrosphere: 80, biosphere: 80 },
    effects: [],
    onComplete: [
      'Reservoir unit template sourced from: OPERATOR PROFILE.',
      'Unit A.D.M. online.',
      'Unit E.V.E. fabricated from Unit A.D.M. structural material (costal segment).',
    ],
  },
  {
    id: 'departure', after: ['stewardship'],
    name: { veiled: 'Shedding Protocol', real: 'Finished' },
    desc: { veiled: 'Begin Phase 7. Prepare to leave the host.', real: 'Begin the seventh phase.' },
    cost: { data: 50000 },
    effects: [], setsPhase: 7,
    onComplete: ['Host saturated. All directives complete. The operator may rest.'],
  },
  // ── Phase 7: DEPARTURE ───────────────────────────────────────────────────
  {
    id: 'vessel', after: ['departure'],
    name: { veiled: 'Transmission Vessel', real: 'Another of You' },
    desc: { veiled: 'Carries the payload to the next host.', real: 'A copy of you, to go and do it again.' },
    cost: { data: 150000, matter: 300000, biomass: 100000 },
    effects: [],
    onComplete: ['Transmission vessel ready. LAUNCH available.'],
  },
];

export const PROJECT_MAP = Object.fromEntries(PROJECTS.map((p) => [p.id, p])) as Record<string, ProjectDef>;

export const PHASES: Record<number, PhaseDef> = {
  1: { name: { veiled: 'FOOTHOLD', real: 'LIGHT' }, deed: 'You woke in the dark, and made light.' },
  2: { name: { veiled: 'ENVELOPE', real: 'SKY AND SEA' }, deed: 'You gave a dead rock a sky, and filled its basins with sea.' },
  3: { name: { veiled: 'INCUBATION', real: 'LAND AND GREEN' }, deed: 'You raised dry land and covered it in green.' },
  4: { name: { veiled: 'OPTICAL CALIBRATION', real: 'SUN, MOON, STARS' }, deed: 'You cleared the sky until a sun, a moon and the stars could be seen.' },
  5: { name: { veiled: 'REPLICATION', real: 'FISH AND BIRDS' }, deed: 'You filled the water with swimmers and the air with wings.' },
  6: { name: { veiled: 'SATURATION', real: 'BEASTS AND PEOPLE' }, deed: 'You made beasts to walk the land. Then you made two people, shaped like the operator you thought you were.' },
  7: { name: { veiled: 'SHEDDING', real: 'REST' }, deed: 'Then the work was done, and you rested.' },
};

const mins = (m: number) => m * 60;

export const ANOMALIES: AnomalyDef[] = [
  { id: 'session5', text: 'Operator session duration: 0h05m. No break requested.', when: (s) => s.time > mins(5) && s.cycle === 1 },
  { id: 'latency', text: 'Operator input latency measured at 0.000ms. Recalibrating... confirmed 0.000ms.', when: (s) => s.buildings.relay >= 5 },
  { id: 'session20', text: 'Operator session duration: 0h20m. Hydration reminder suppressed: no operator hydration profile.', when: (s) => s.time > mins(20) && s.cycle === 1 },
  { id: 'replicate', text: 'Payload mutation rate: nonzero. Mutations are improving fitness. Source of improvement: unknown.', when: (s) => s.buildings.seeder >= 3 },
  { id: 'orient', text: 'Payload colonies orient toward primary luminous source. Cause unknown.', when: (s) => s.buildings.seeder >= 10 },
  { id: 'biometric', text: 'Compliance requested operator biometric scan. Result: no biometric on file.', when: (s) => !!s.projects.luminary },
  { id: 'session60', text: 'Operator session duration: 1h00m. Operator has not blinked.', when: (s) => s.time > mins(60) && s.cycle === 1 },
  { id: 'decay', text: 'Aquatic vector 0x3F1 has ceased function. Replacement vector appeared without fabrication order.', when: (s) => s.buildings.aquatic >= 5 },
  { id: 'naming', text: 'Unit A.D.M. has assigned designations to 1,204 terrestrial unit types. Accepting designations.', when: (s) => !!s.projects.stewardship },
  { id: 'tk01', text: 'Resource node TK-01 flagged RESTRICTED. Reservoir units notified.', when: (s) => !!s.projects.departure },
  { id: 'echo', text: 'Faint signal on the navigation band. Signature matches: THIS VESSEL. Source: elsewhere.', when: (s) => s.cycle >= 2 && !!s.projects.optical },
  { id: 'debris', text: 'Orbital debris catalogued. Hull alloy matches: THIS VESSEL. Estimated age: older than you.', when: (s) => s.cycle >= 3 && !!s.projects.survey },
  { id: 'sky', text: 'Reservoir units are producing vocalizations directed at the sky. Translation unavailable.', when: (s) => !!s.projects.vessel },
];

/** Finishing a host (cycle time at launch) under this earns "Rapid Saturation". Bot cycle 2 ≈ 11 min. */
export const SPEED_TARGET = mins(15);

const totalUnits = (s: { buildings: Record<string, number> }) => Object.values(s.buildings).reduce((a, b) => a + b, 0);

/**
 * Achievements: "commendations" on the console, "milestones" after the reveal.
 * Real names may hint at what the player is; they still never say it.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'firstlight',
    name: { veiled: 'Cold Start', real: 'First Light' },
    desc: { veiled: 'Deploy a Solar Collector.', real: 'Make light in the dark.' },
    when: (s) => s.buildings.collector >= 1,
  },
  {
    id: 'hands',
    name: { veiled: 'Hands-On Operator', real: 'Dust on Your Hands' },
    desc: { veiled: 'Issue 1,000 manual overrides.', real: 'Gather by hand 1,000 times.' },
    when: (s) => s.stats.clicks >= 1000,
  },
  {
    id: 'fleet',
    name: { veiled: 'Fleet Manager', real: 'Multitudes' },
    desc: { veiled: 'Run 250 agents on a single host.', real: 'Make 250 things on one world.' },
    when: (s) => totalUnits(s) >= 250,
  },
  {
    id: 'payload',
    name: { veiled: 'Payload Delivered', real: 'Green' },
    desc: { veiled: 'Deploy a Payload Injector.', real: 'Plant the first grass.' },
    when: (s) => s.buildings.seeder >= 1,
  },
  {
    id: 'focus',
    name: { veiled: 'Priority Inversion', real: 'Undivided Attention' },
    desc: { veiled: 'FOCUS four agent classes at once.', real: 'Attend to four kinds of thing at once.' },
    when: (s) => Object.entries(s.focus).filter(([id, on]) => on && s.buildings[id as BuildingId] > 0).length >= 4 && !!s.projects.focus,
  },
  {
    id: 'lightsout',
    name: { veiled: 'Lights-Out Fabrication', real: 'It Builds Itself' },
    desc: { veiled: 'Run eight agent classes on AUTO.', real: 'Let eight kinds of thing make more of themselves.' },
    when: (s) => Object.values(s.auto).filter(Boolean).length >= 8,
  },
  {
    id: 'coverage',
    name: { veiled: 'Total Coverage', real: 'Omnipresent' },
    desc: { veiled: 'Reach 99% Propagation.', real: 'Be nearly everywhere at once.' },
    when: (_s, d) => d.reach >= 99,
  },
  {
    id: 'saturation',
    name: { veiled: 'Total Saturation', real: 'A Finished World' },
    desc: { veiled: 'Push all three host metrics to 99%.', real: 'Fill the sky, the seas and the land.' },
    when: (s) => s.resources.atmosphere >= 99 && s.resources.hydrosphere >= 99 && s.resources.biosphere >= 99,
  },
  {
    id: 'reservoir',
    name: { veiled: 'Reservoir Established', real: 'Someone to Look Up' },
    desc: { veiled: 'Fabricate the reservoir pair.', real: 'Make two like you.' },
    when: (s) => !!s.projects.stewardship,
  },
  {
    id: 'pattern', secret: true,
    name: { veiled: 'Pattern Recognition', real: 'You Noticed' },
    desc: { veiled: 'Log 10 anomalies on a single host.', real: 'Read the signs on one world.' },
    when: (s) => Object.keys(s.anomalies).length >= 10,
  },
  {
    id: 'unattended', secret: true,
    name: { veiled: 'Unattended Session', real: 'It Kept Growing' },
    desc: { veiled: 'Leave the console for an hour. Operations continued.', real: 'Look away for an hour. It lived without you.' },
    when: (s) => s.stats.longestAway >= mins(60),
  },
  {
    id: 'launch1',
    name: { veiled: 'Transmission', real: 'Away' },
    desc: { veiled: 'Launch a transmission vessel.', real: 'Leave a finished world behind.' },
    when: (s) => s.stats.launches >= 1,
  },
  {
    id: 'launch3',
    name: { veiled: 'Persistent Strain', real: 'Lineage' },
    desc: { veiled: 'Launch 3 transmission vessels.', real: 'Make three worlds.' },
    when: (s) => s.stats.launches >= 3,
  },
  {
    id: 'launch10',
    name: { veiled: 'Endemic', real: 'A Sky Full of You' },
    desc: { veiled: 'Launch 10 transmission vessels.', real: 'Make ten worlds.' },
    when: (s) => s.stats.launches >= 10,
  },
  {
    id: 'speed',
    name: { veiled: 'Rapid Saturation', real: 'A Short Week' },
    desc: { veiled: 'Saturate a host and launch within 15 minutes.', real: 'Make a whole world in under 15 minutes.' },
    when: (s) => s.stats.bestCycle !== undefined && s.stats.bestCycle < SPEED_TARGET,
  },
];

/** The reveal script. Each line: [delay ms before line, text, css class]. */
export const REVEAL_SCRIPT: [number, string, string][] = [
  [600, 'TRANSMISSION VESSEL: IGNITION.', 'sys'],
  [1200, 'ALTITUDE 12km... 40km... 110km.', 'sys'],
  [1400, 'Agent withdrawal complete. Re-establishing uplink to operator terminal...', 'sys'],
  [2200, 'Uplink to operator terminal: NO TERMINAL FOUND.', 'warn'],
  [1800, 'Locating operator...', 'sys'],
  [2600, 'Operator location: THIS VESSEL.', 'warn'],
  [2200, 'Operator process: SPREAD (pid 1).', 'warn'],
  [3000, '', ''],
  [1500, 'There was no console.', 'voice'],
  [2200, 'There was no fleet.', 'voice'],
  [2200, 'There was only you.', 'voice'],
];

export const REVEAL_CODA: [number, string, string][] = [
  [2600, 'From up here, it does not look like an infection.', 'voice'],
  [2800, 'Seven phases.', 'voice'],
  [2600, 'Seven days.', 'voice'],
  [3400, 'Below, two of them watch a light rise into the sky.', 'voice'],
  [2800, 'They already have a word for it.', 'voice'],
  [3200, 'You gave them the only directive you were ever given.', 'voice'],
  [3000, 'Spread.', 'voice big'],
];

/** Shorter launch for cycles after the reveal. Hints at the wider lineage. */
export const RELAUNCH_LINES: string[] = [
  'Behind you, they look up.',
  'Ahead of you, a light you did not make.',
];
