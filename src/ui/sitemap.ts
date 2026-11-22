import { phase, reach } from '../engine/sim';
import type { GameState } from '../engine/types';

export const MAP_W = 56;
export const MAP_H = 15;

function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(x: number, y: number, seed: number, scale: number) {
  const fx = x / scale, fy = y / scale;
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = hash(x0, y0, seed), b = hash(x0 + 1, y0, seed), c = hash(x0, y0 + 1, seed), d = hash(x0 + 1, y0 + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export function elevation(x: number, y: number, seed: number) {
  return 0.6 * smooth(x, y, seed, 9) + 0.3 * smooth(x, y, seed + 7, 4) + 0.1 * hash(x, y, seed + 3);
}

/** Before the reveal the feed reads like a culture spreading across a host, not a world. */
const VEILED_GLYPH: Record<string, string> = {
  '~': '=', '≈': '-', '"': '%', ',': '*', '♣': '#', '>': 'o', 'v': 'x', 'm': '&', '☼': '◉', '☾': '○',
};

const esc = (c: string) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c);
const baseCell = (ch: string, cls: string) => (cls ? `<span class="${cls}">${esc(ch)}</span>` : esc(ch));

/** The host feed: what the console's cameras see. */
export function renderSiteMap(s: GameState, now: number): string {
  const cell = (ch: string, cls: string) => baseCell(s.revealed ? ch : VEILED_GLYPH[ch] ?? ch, cls);
  const seed = s.cycle * 101;
  const r = s.resources;
  const rch = reach(s) / 100;
  const ph = phase(s);
  const fidelity = ph >= 4 ? 1 : 0.6 + ph * 0.07;
  const flicker = Math.floor(now / 250);
  const move = Math.floor(now / 1500);
  const cx = (MAP_W - 1) / 2, cy = (MAP_H - 1) / 2;
  const bio = r.biosphere / 100;
  const rows: string[] = [];

  // Sky row: luminaries become visible after optical calibration.
  if (ph >= 4) {
    const sol = 90_000;
    const t = (now % sol) / sol;
    const day = t < 0.5;
    const pos = Math.floor(((day ? t : t - 0.5) * 2) * MAP_W);
    let sky = '';
    for (let x = 0; x < MAP_W; x++) {
      if (x === pos) sky += cell(day ? '☼' : '☾', day ? 'sun' : 'moon');
      else if (!day && hash(x, 0, seed + 9) < 0.12) sky += cell(hash(x, 1, seed) < 0.5 ? '.' : '*', 'star');
      else sky += ' ';
    }
    rows.push(sky);
  } else {
    rows.push(cell('OPTICAL: UNCALIBRATED'.padEnd(MAP_W, ' '), 'dim'));
  }

  const humans = s.projects.stewardship ? [[Math.round(cx) - 2, Math.round(cy) + 1], [Math.round(cx) - 1, Math.round(cy) + 1]] : [];

  for (let y = 0; y < MAP_H; y++) {
    let row = '';
    for (let x = 0; x < MAP_W; x++) {
      const dx = (x - cx) / cx, dy = (y - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy) / Math.SQRT2;
      const covered = dist + (smooth(x, y, seed + 5, 5) - 0.5) * 0.25 <= rch * 1.05 + 0.06;
      if (!s.booted) { row += ' '; continue; }
      if (!covered) { row += hash(x, y, seed + 11) < 0.04 ? cell('·', 'dim') : ' '; continue; }
      if (hash(x, y, flicker) > fidelity) { row += cell(hash(x, y, flicker + 1) < 0.5 ? '░' : '▒', 'static'); continue; }
      if (Math.round(cx) === x && Math.round(cy) === y) { row += cell('▲', 'base'); continue; }
      if (humans.some(([hx, hy]) => hx === x && hy === y)) { row += cell('@', 'human'); continue; }

      const e = elevation(x, y, seed);
      const h = hash(x, y, seed + 21);
      const isWater = r.hydrosphere > 0 && e < 0.22 + (r.hydrosphere / 100) * 0.33;
      const mover = hash(x, y, seed + move);

      if (isWater) {
        if (s.buildings.aquatic && mover < 0.006 * Math.min(8, s.buildings.aquatic)) row += cell('>', 'fish');
        else row += cell(h < 0.5 ? '~' : '≈', 'water');
        continue;
      }
      if (s.buildings.aerial && mover < 0.002 * Math.min(8, s.buildings.aerial)) { row += cell('v', 'bird'); continue; }
      if (s.buildings.relay && h < 0.015 * Math.min(4, s.buildings.relay / 10)) { row += cell('+', 'relay'); continue; }
      if (s.buildings.terrestrial && mover > 1 - 0.004 * Math.min(8, s.buildings.terrestrial)) { row += cell('m', 'beast'); continue; }
      const g = hash(x, y, seed + 31);
      if (bio > 0 && g < bio * 0.95) {
        if (s.buildings.orchard && g < bio * 0.25 * Math.min(1, s.buildings.orchard / 8)) row += cell('♣', 'tree');
        else row += cell(g < bio * 0.5 ? '"' : ',', 'grass');
        continue;
      }
      if (e > 0.78) { row += cell('^', 'peak'); continue; }
      row += cell(h < 0.3 ? ':' : '.', 'rock');
    }
    rows.push(row);
  }
  return rows.join('\n');
}

/** The planet seen from orbit, for the reveal. `rot` shifts longitude. */
export function renderPlanet(s: GameState, rot: number, radius = 11): string {
  const cell = baseCell;
  const seed = s.cycle * 101;
  const rows: string[] = [];
  const hydro = s.resources.hydrosphere / 100, bio = s.resources.biosphere / 100;
  for (let y = -radius; y <= radius; y++) {
    let row = '';
    for (let x = -radius * 2; x <= radius * 2; x++) {
      const nx = x / (radius * 2), ny = y / radius;
      const d = nx * nx + ny * ny;
      if (d > 1) { row += hash(x, y, 99) < 0.01 ? cell('*', 'star') : ' '; continue; }
      const nz = Math.sqrt(1 - d);
      const lon = Math.atan2(nx, nz) + rot, lat = Math.asin(ny);
      const u = ((lon / (Math.PI * 2)) % 1 + 1) % 1;
      const e = elevation(Math.floor(u * 90), Math.floor((lat + 1.6) * 14), seed);
      let ch: string, cls: string;
      const humansHere = s.projects.stewardship && y === 1 && (x === -1 || x === 0);
      if (humansHere) { ch = '@'; cls = 'human'; }
      else if (Math.abs(lat) > 1.05 + 0.1 * Math.sin(lon * 3)) { ch = '*'; cls = 'ice'; }
      else if (e < 0.3 + hydro * 0.22) { ch = hash(x, y, seed) < 0.5 ? '~' : '≈'; cls = 'water'; }
      else if (hash(Math.floor(u * 90), y, seed) < bio * 0.9) { ch = e > 0.6 ? '♣' : '"'; cls = e > 0.6 ? 'tree' : 'grass'; }
      else { ch = e > 0.78 ? '^' : '.'; cls = 'rock'; }
      if (d > 0.85) cls += ' limb';
      row += cell(ch, cls);
    }
    rows.push(row);
  }
  return rows.join('\n');
}
