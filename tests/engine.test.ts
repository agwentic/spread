import { describe, expect, test } from 'vitest';
import {
  autoReserve, boot, buildingCost, bulkCost, buyBuilding, buyBuildings, completeProject, focusBurn, maxAffordable, computeRates, launch, memoryGain, newGame, nextCycle, phase, reach, tick,
} from '../src/engine/sim';
import { applyOffline, deserialize, serialize } from '../src/engine/save';

describe('engine', () => {
  test('nothing happens before boot', () => {
    const s = newGame();
    s.buildings.collector = 5;
    tick(s, 10);
    expect(s.resources.energy).toBe(0);
  });

  test('costs scale geometrically and buying spends resources', () => {
    const s = newGame(); boot(s);
    s.resources.matter = 100;
    expect(buildingCost(s, 'collector').matter).toBe(10);
    expect(buyBuilding(s, 'collector')).toBe(true);
    expect(s.resources.matter).toBe(90);
    expect(buildingCost(s, 'collector').matter).toBe(Math.ceil(10 * 1.14));
  });

  test('locked buildings cannot be bought', () => {
    const s = newGame(); boot(s);
    s.resources.matter = 1e6; s.resources.energy = 1e6;
    expect(buyBuilding(s, 'relay')).toBe(false);
  });

  test('consumers throttle when an input runs out', () => {
    const s = newGame(); boot(s);
    s.buildings.excavator = 10; // needs 4 energy/s, has none
    const r = computeRates(s);
    expect(r.eff.excavator).toBe(0);
    expect(r.short).toContain('energy');
    s.buildings.collector = 2; // 2 energy/s
    expect(computeRates(s).eff.excavator).toBeCloseTo(0.5);
  });

  test('meters cap at 100 and resources never go negative', () => {
    const s = newGame(); boot(s);
    s.projects.survey = true;
    s.buildings.processor = 1000; s.buildings.collector = 100000; s.resources.matter = 1e9;
    tick(s, 100);
    expect(s.resources.atmosphere).toBe(100);
    expect(Object.values(s.resources).every((v) => v >= 0)).toBe(true);
  });

  test('phase follows completed phase projects', () => {
    const s = newGame(); boot(s);
    expect(phase(s)).toBe(1);
    s.projects.survey = true;
    expect(phase(s)).toBe(2);
  });

  test('project requirements gate completion', () => {
    const s = newGame(); boot(s);
    s.projects.overclock = true; s.projects.network = true;
    s.resources.data = 1e6; s.resources.matter = 1e6;
    expect(completeProject(s, 'survey')).toBe(false); // reach 0 < 20
    s.buildings.relay = 10;
    expect(reach(s)).toBeGreaterThan(20);
    expect(completeProject(s, 'survey')).toBe(true);
  });

  test('launch carries memory into the next cycle and reveals', () => {
    const s = newGame(); boot(s);
    s.projects.vessel = true;
    s.resources.biosphere = 90;
    const gained = memoryGain(s);
    expect(launch(s)).toBe(gained);
    const next = nextCycle(s);
    expect(next.cycle).toBe(2);
    expect(next.memory).toBe(gained);
    expect(next.revealed).toBe(true);
    expect(next.buildings.collector).toBe(0);
  });

  test('save round-trips and offline progress applies', () => {
    const s = newGame(); boot(s);
    s.buildings.collector = 3;
    const loaded = deserialize(serialize(s))!;
    expect(loaded.buildings.collector).toBe(3);
    loaded.lastSaved = Date.now() - 100_000;
    const away = applyOffline(loaded);
    expect(away).toBeGreaterThan(99);
    expect(loaded.resources.energy).toBeGreaterThan(290);
  });

  test('garbage saves are rejected', () => {
    expect(deserialize('not json')).toBeNull();
    expect(deserialize('{"version":999}')).toBeNull();
  });

  test('bulk deploy buys all-or-nothing, MAX buys as many as affordable', () => {
    const s = newGame(); boot(s);
    s.resources.matter = 1000;
    const ten = bulkCost(s, 'collector', 10).matter!;
    expect(ten).toBe(Array.from({ length: 10 }, (_, i) => Math.ceil(10 * 1.14 ** i)).reduce((a, b) => a + b));
    expect(buyBuildings(s, 'collector', 10)).toBe(10);
    expect(s.resources.matter).toBe(1000 - ten);
    s.resources.matter = 50;
    expect(buyBuildings(s, 'collector', 10)).toBe(0);
    expect(s.resources.matter).toBe(50);
    const max = maxAffordable(s, 'collector');
    expect(buyBuildings(s, 'collector', Infinity)).toBe(max);
    expect(s.buildings.collector).toBe(10 + max);
  });

  test('auto-deploy needs its protocol, then keeps inputs in surplus and leaves a reserve', () => {
    const s = newGame(); boot(s);
    s.resources.matter = 1e5; s.resources.energy = 0;
    s.auto.excavator = true; s.auto.collector = true;
    tick(s, 1);
    expect(s.buildings.collector).toBe(0); // not unlocked yet
    s.projects.autobase = true;
    for (let i = 0; i < 200; i++) tick(s, 0.1);
    expect(s.buildings.collector).toBeGreaterThan(0);
    expect(computeRates(s).net.energy).toBeGreaterThanOrEqual(0); // never buys into an energy deficit
    // A protocol whose requirements are met holds back its cost.
    expect(autoReserve(s)).toEqual({});
  });

  test('focus doubles non-thought output and burns thought; unfunded focus does nothing', () => {
    const s = newGame(); boot(s);
    s.buildings.collector = 10;
    s.projects.focus = true;
    const base = computeRates(s).net.energy;
    s.focus.collector = true;
    expect(computeRates(s).net.energy).toBe(base); // no thought: unfunded
    s.resources.data = 1e6;
    const r = computeRates(s);
    expect(r.net.energy).toBeCloseTo(base * 2);
    expect(r.net.data).toBeCloseTo(-focusBurn(s, 'collector'));
    s.buildings.core = 1; s.focus.core = true;
    expect(computeRates(s).focusBurn).toBeCloseTo(focusBurn(s, 'collector')); // cores can't be focused
  });
});
