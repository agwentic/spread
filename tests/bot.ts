// A greedy headless player used to sanity-check balance.
import { BUILDINGS } from '../src/engine/content';
import {
  boot, buildingCost, buyBuilding, canAfford, canCompleteProject, canLaunch, computeRates,
  isBuildingUnlocked, manual, unmetRequirements, newGame, phase, tick, visibleProjects,
} from '../src/engine/sim';
import type { BuildingId, GameState } from '../src/engine/types';

export interface BotResult { state: GameState; phaseTimes: Record<number, number>; finished: boolean }

export function playCycle(start?: GameState, maxSeconds = 4 * 3600, clicksPerSec = 4): BotResult {
  const s = start ?? newGame();
  boot(s);
  const phaseTimes: Record<number, number> = { 1: 0 };
  while (s.time < maxSeconds) {
    if (s.buildings.collector + s.buildings.excavator < 6) {
      for (let i = 0; i < clicksPerSec; i++) manual(s, s.resources.energy < s.resources.matter ? 'energy' : 'matter');
    }
    // Projects first: phase gates are what matter most.
    for (const p of visibleProjects(s)) if (canCompleteProject(s, p)) { // eslint-disable-line
      // completeProject re-checks; import lazily to keep the loop simple
      complete(s, p.id);
    }
    buyGreedy(s);
    tick(s, 1);
    const ph = phase(s);
    if (phaseTimes[ph] === undefined) phaseTimes[ph] = s.time;
    if (canLaunch(s)) return { state: s, phaseTimes, finished: true };
  }
  return { state: s, phaseTimes, finished: false };
}

import { completeProject } from '../src/engine/sim';
function complete(s: GameState, id: string) { completeProject(s, id); }

function buyGreedy(s: GameState) {
  // Buy at most a few things per second; prefer keeping inputs positive.
  for (let i = 0; i < 5; i++) {
    const rates = computeRates(s);
    const shortOf = rates.short;
    let pick: BuildingId | null = null;
    if (shortOf.includes('energy') || rates.net.energy < 0) pick = 'collector';
    else if (shortOf.includes('matter') || rates.net.matter < 0) pick = 'excavator';
    else if ((shortOf.includes('water') || rates.net.water < 0) && isBuildingUnlocked(s, 'condenser')) pick = 'condenser';
    else if ((shortOf.includes('biomass') || rates.net.biomass < 0) && isBuildingUnlocked(s, 'seeder')) pick = isBuildingUnlocked(s, 'orchard') ? 'orchard' : 'seeder';
    if (pick && canAfford(s, buildingCost(s, pick))) { buyBuilding(s, pick); continue; }
    if (pick) return; // save up for the bottleneck
    // If a protocol is only blocked by cost, mostly save for it (buy only cheap things).
    const saving = visibleProjects(s).find((p) => unmetRequirements(s, p).length === 0 && !canAfford(s, p.cost));
    // Otherwise buy the cheapest (by total cost) affordable unlocked building, newest tiers favored.
    const options = BUILDINGS.filter((b) => isBuildingUnlocked(s, b.id) && canAfford(s, buildingCost(s, b.id)));
    if (!options.length) return;
    const score = (id: BuildingId) => Object.values(buildingCost(s, id)).reduce((a, b) => a + (b ?? 0), 0);
    options.sort((a, b) => score(a.id) - score(b.id));
    if (saving) {
      const budget = Object.entries(saving.cost).every(([k, v]) => (buildingCost(s, options[0].id) as Record<string, number>)[k] === undefined || (buildingCost(s, options[0].id) as Record<string, number>)[k] < 0.05 * (v ?? 0));
      if (!budget) return;
    }
    buyBuilding(s, options[0].id);
  }
}
