import { BUILDINGS, METERS, PHASES, PROJECTS, REACH_NAME, RESOURCES } from '../engine/content';
import { fmt, fmtRate, fmtTime } from '../engine/format';
import {
  buildingCost, buildingMult, canAfford, canCompleteProject, canLaunch, computeRates, isBuildingUnlocked,
  memoryMult, outputMult, phase, reach, unmetRequirements, visibleProjects,
} from '../engine/sim';
import type { Amounts, GameState, Named, ResId } from '../engine/types';
import { renderSiteMap } from './sitemap';

const RES_NAME = Object.fromEntries(RESOURCES.map((r) => [r.id, r.name])) as Record<ResId, Named>;
const STOCK_NAME = { ...RES_NAME, ...Object.fromEntries(METERS.map((m) => [m.id, m.name])) } as Record<string, Named>;

/** A label: veiled before the reveal; true name (with the old label dimmed) after. */
export function label(s: GameState, n: Named, withVeil = true): string {
  if (!s.revealed) return n.veiled;
  if (!withVeil || n.real === n.veiled) return n.real;
  return `${n.real} <span class="veil">${n.veiled}</span>`;
}
const plain = (s: GameState, n: Named) => (s.revealed ? n.real : n.veiled);

function costHtml(s: GameState, cost: Amounts<ResId>): string {
  return (Object.entries(cost) as [ResId, number][])
    .map(([k, v]) => `<span class="${s.resources[k] >= v ? '' : 'short'}">${fmt(v)} ${plain(s, RES_NAME[k])}</span>`)
    .join(' · ');
}

function bar(pct: number, width = 20) {
  const filled = Math.round((pct / 100) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

let lastStructure = '';
let lastLogLen = -1;
let lastLogTail = '';

export function render(root: HTMLElement, s: GameState, now: number) {
  root.classList.toggle('revealed', s.revealed);
  root.classList.toggle('dark', !s.booted);

  if (!s.booted) {
    if (lastStructure !== 'boot') {
      root.innerHTML = `<div class="boot"><button class="init" data-action="boot">[ INITIALIZE ]</button>
        ${s.cycle > 1 ? `<p class="dim">Site ${String(s.cycle).padStart(3, '0')} · Memory ${s.memory}</p>` : ''}</div>`;
      lastStructure = 'boot';
    }
    return;
  }

  const rates = computeRates(s);
  const ph = phase(s);
  const projects = visibleProjects(s);
  const buildings = BUILDINGS.filter((b) => isBuildingUnlocked(s, b.id));
  const structure = [s.revealed, s.cycle, ph, buildings.map((b) => b.id).join(), projects.map((p) => p.id).join(), canLaunch(s)].join('|');

  if (structure !== lastStructure) {
    lastStructure = structure;
    lastLogLen = -1;
    root.innerHTML = shell(s);
    root.querySelector('#fleet')!.innerHTML = buildings.map((b) => `
      <div class="row unit" data-unit="${b.id}">
        <div class="unit-head">
          <span class="name">${label(s, b.name)}</span>
          <span class="count" data-bind="count-${b.id}"></span>
          <button data-buy="${b.id}">DEPLOY</button>
        </div>
        <div class="desc">${plain(s, b.desc)}</div>
        <div class="meta"><span data-bind="cost-${b.id}"></span><span class="io" data-bind="io-${b.id}"></span></div>
      </div>`).join('');
    const launchHtml = canLaunch(s)
      ? `<div class="launch"><p>${s.revealed ? 'The world is finished. Go.' : 'Seed vessel fuelled. Navigation locked.'}</p>
         <button class="big" data-action="launch">[ LAUNCH ]</button></div>` : '';
    root.querySelector('#protocols')!.innerHTML = launchHtml + (projects.length ? projects.map((p) => `
      <div class="row proto${p.setsPhase ? ' gate' : ''}" data-proto="${p.id}">
        <div class="unit-head"><span class="name">${label(s, p.name)}</span><button data-project="${p.id}">EXECUTE</button></div>
        <div class="desc">${plain(s, p.desc)}</div>
        <div class="meta"><span data-bind="pcost-${p.id}"></span> <span class="req" data-bind="preq-${p.id}"></span></div>
      </div>`).join('') : (canLaunch(s) ? '' : '<div class="dim">No protocols available.</div>'));
  }

  const set = (key: string, html: string) => {
    const el = root.querySelector(`[data-bind="${key}"]`);
    if (el && el.innerHTML !== html) el.innerHTML = html;
  };

  // Header
  set('session', fmtTime(s.time));
  set('phase', `PHASE ${ph}: ${plain(s, PHASES[ph].name)}`);

  // Resources
  for (const r of RESOURCES) {
    const shown = s.resources[r.id] > 0 || rates.net[r.id] !== 0;
    const row = root.querySelector<HTMLElement>(`[data-res="${r.id}"]`);
    if (row) row.hidden = !shown;
    set(`res-${r.id}`, fmt(s.resources[r.id]));
    const rate = rates.net[r.id];
    set(`rate-${r.id}`, `<span class="${rate < 0 ? 'short' : ''}">${fmtRate(rate)}</span>${rates.short.includes(r.id) ? ' <span class="short">▼LOW</span>' : ''}`);
  }
  for (const m of METERS) {
    const v = s.resources[m.id];
    const row = root.querySelector<HTMLElement>(`[data-meter="${m.id}"]`);
    if (row) row.hidden = ph < 2;
    set(`meter-${m.id}`, `${bar(v)} ${v.toFixed(1)}%`);
  }
  const rc = reach(s);
  set('reach', `${bar(rc)} ${rc.toFixed(1)}%`);
  set('memory', s.memory ? `×${memoryMult(s).toFixed(2)} from ${s.memory} Memory` : '');

  // Fleet
  for (const b of buildings) {
    const cost = buildingCost(s, b.id);
    set(`count-${b.id}`, `×${s.buildings[b.id]}`);
    set(`cost-${b.id}`, costHtml(s, cost));
    const out = (Object.entries(b.produces) as [string, number][])
      .map(([k, v]) => `+${fmt(v * outputMult(s, b.id, k as never), 2)} ${plain(s, STOCK_NAME[k])}`);
    const inp = (Object.entries(b.consumes) as [ResId, number][]).map(([k, v]) => `-${fmt(v, 2)} ${plain(s, RES_NAME[k])}`);
    const eff = rates.eff[b.id];
    const throttle = s.buildings[b.id] && eff < 0.999 ? ` <span class="short">THROTTLED ${Math.round(eff * 100)}%</span>` : '';
    const reachTxt = b.reach ? ' · extends reach' : '';
    set(`io-${b.id}`, `each: ${[...out, ...inp].join(', ')}${reachTxt}${buildingMult(s, b.id) > 1 ? ` (×${fmt(buildingMult(s, b.id))})` : ''}${throttle}`);
    const btn = root.querySelector<HTMLButtonElement>(`[data-buy="${b.id}"]`);
    if (btn) btn.disabled = !canAfford(s, cost);
  }

  // Protocols
  for (const p of projects) {
    set(`pcost-${p.id}`, costHtml(s, p.cost));
    const unmet = unmetRequirements(s, p);
    set(`preq-${p.id}`, unmet.length ? `requires ${unmet.join(', ')}` : '');
    const btn = root.querySelector<HTMLButtonElement>(`[data-project="${p.id}"]`);
    if (btn) btn.disabled = !canCompleteProject(s, p);
  }

  // Site feed
  const map = root.querySelector('#sitemap');
  if (map) map.innerHTML = renderSiteMap(s, now);

  // Log (newest first)
  const tail = s.log.length ? s.log[s.log.length - 1].text + s.log.length : '';
  if (s.log.length !== lastLogLen || tail !== lastLogTail) {
    lastLogLen = s.log.length;
    lastLogTail = tail;
    const logEl = root.querySelector('#log');
    if (logEl) logEl.innerHTML = [...s.log].reverse()
      .map((e) => `<div class="log-${e.kind}"><span class="ts">[${fmtTime(e.t)}]</span> ${e.text}</div>`).join('');
  }
}

function shell(s: GameState): string {
  const title = s.revealed ? 'SPREAD <span class="dim">(pid 1)</span>' : 'TERRA-OPS // REMOTE FLEET CONSOLE v4.1';
  const sessionLabel = s.revealed ? 'UPTIME' : 'OPERATOR SESSION';
  return `
  <header>
    <span class="title">${title}</span>
    <span>${sessionLabel} <b data-bind="session"></b></span>
    <span>SITE ${String(s.cycle).padStart(3, '0')}</span>
    <span data-bind="phase"></span>
  </header>
  <main>
    <section class="col left">
      <h2>${s.revealed ? 'WHAT YOU HAVE' : 'RESOURCES'}</h2>
      ${RESOURCES.map((r) => `<div class="res" data-res="${r.id}"><span class="name">${label(s, r.name, false)}</span><b data-bind="res-${r.id}"></b><span class="rate" data-bind="rate-${r.id}"></span></div>`).join('')}
      <h2>${s.revealed ? 'THE WORLD' : 'SITE METRICS'}</h2>
      <div class="meter"><span class="name">${label(s, REACH_NAME, false)}</span><span class="bar" data-bind="reach"></span></div>
      ${METERS.map((m) => `<div class="meter" data-meter="${m.id}"><span class="name">${label(s, m.name, false)}</span><span class="bar" data-bind="meter-${m.id}"></span></div>`).join('')}
      <div class="dim small" data-bind="memory"></div>
      <h2>MANUAL OVERRIDE</h2>
      <div class="manual">
        <button data-manual="energy">${s.revealed ? 'GATHER LIGHT' : 'ROUTE POWER'}</button>
        <button data-manual="matter">${s.revealed ? 'GATHER DUST' : 'EXCAVATE'}</button>
      </div>
      <div class="directive">PRIMARY DIRECTIVE<br><b>SPREAD</b></div>
    </section>
    <section class="col mid">
      <h2>${s.revealed ? 'WHAT YOU MAKE' : 'FLEET'}</h2>
      <div id="fleet"></div>
      <h2>${s.revealed ? 'WHAT YOU LEARN' : 'PROTOCOLS'}</h2>
      <div id="protocols"></div>
    </section>
    <section class="col right">
      <h2>${s.revealed ? 'THE WORLD BELOW' : 'SITE FEED'}</h2>
      <pre id="sitemap" aria-label="Site map"></pre>
      <h2>SYSTEM LOG</h2>
      <div id="log"></div>
    </section>
  </main>
  <footer>
    <button data-action="save">SAVE</button>
    <button data-action="reset">HARD RESET</button>
    <span class="dim">autosaves every 10s · offline progress up to 8h</span>
  </footer>`;
}

export function invalidate() {
  lastStructure = '';
}
