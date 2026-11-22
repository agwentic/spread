import { BUILDINGS, METERS, PHASES, PROJECTS, REACH_NAME, RESOURCES } from '../engine/content';
import { fmt, fmtRate, fmtTime } from '../engine/format';
import {
  bulkCost, buildingMult, canAfford, canCompleteProject, canLaunch, computeRates, FOCUS_MULT, focusBurn,
  isAutoUnlocked, isBuildingUnlocked, isFocusUnlocked, maxAffordable, memoryMult, outputMult, phase, reach,
  unmetRequirements, visibleProjects,
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

export type BuyMode = 1 | 10 | 'max';
let buyMode: BuyMode = 1;
export function getBuyMode() { return buyMode; }
export function setBuyMode(m: string) {
  buyMode = m === 'max' ? 'max' : m === '10' ? 10 : 1;
}
/** Units the DEPLOY button buys right now (MAX shows 1 when nothing is affordable). */
export function deployCount(s: GameState, id: Parameters<typeof maxAffordable>[1]) {
  return buyMode === 'max' ? Math.max(1, maxAffordable(s, id)) : buyMode;
}

let lastStructure = '';
let currentTab: 'status' | 'agents' | 'feed' = 'agents';

/** Narrow screens show one column at a time. */
export function setTab(root: HTMLElement, tab: string) {
  if (tab !== 'status' && tab !== 'agents' && tab !== 'feed') return;
  currentTab = tab;
  root.querySelector('main')?.setAttribute('data-tab', tab);
  root.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) => b.tagName === 'BUTTON' && b.classList.toggle('active', b.dataset.tab === tab));
}
let lastLogLen = -1;
let lastLogTail = '';
let logPinned = true;

export function render(root: HTMLElement, s: GameState, now: number) {
  root.classList.toggle('revealed', s.revealed);
  root.classList.toggle('dark', !s.booted);

  if (!s.booted) {
    if (lastStructure !== 'boot') {
      root.innerHTML = `<div class="boot"><button class="init" data-action="boot">[ INITIALIZE ]</button>
        ${s.cycle > 1 ? `<p class="dim">Host ${String(s.cycle).padStart(3, '0')} · Memory ${s.memory}</p>` : ''}</div>`;
      lastStructure = 'boot';
    }
    return;
  }

  const rates = computeRates(s);
  const ph = phase(s);
  const projects = visibleProjects(s);
  const buildings = BUILDINGS.filter((b) => isBuildingUnlocked(s, b.id));
  const structure = [s.revealed, s.cycle, ph, buildings.map((b) => b.id).join(), projects.map((p) => p.id).join(), Object.keys(s.projects).length, canLaunch(s)].join('|');

  if (structure !== lastStructure) {
    lastStructure = structure;
    lastLogLen = -1;
    root.innerHTML = shell(s);
    root.querySelector('#fleet')!.innerHTML = buildings.map((b) => `
      <div class="row unit" data-unit="${b.id}">
        <div class="unit-head">
          <span class="name">${label(s, b.name)}</span>
          <span class="count" data-bind="count-${b.id}"></span>
          ${isFocusUnlocked(s, b.id) ? `<button class="toggle" data-focus="${b.id}" title="×${FOCUS_MULT} output, burns ${plain(s, RES_NAME.data)}">FOCUS</button>` : ''}
          ${isAutoUnlocked(s, b.id) ? `<button class="toggle" data-auto="${b.id}" title="Deploy automatically">AUTO</button>` : ''}
          <button class="deploy" data-buy="${b.id}">DEPLOY</button>
        </div>
        <div class="desc">${plain(s, b.desc)}</div>
        <div class="meta"><span data-bind="cost-${b.id}"></span><span class="io" data-bind="io-${b.id}"></span></div>
      </div>`).join('');
    const launchHtml = canLaunch(s)
      ? `<div class="launch"><p>${s.revealed ? 'The world is finished. Go.' : 'Transmission vessel ready. Next host locked.'}</p>
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
    const shown = r.id === 'energy' || r.id === 'matter' || s.resources[r.id] > 0 || rates.net[r.id] !== 0;
    const row = root.querySelector<HTMLElement>(`[data-res="${r.id}"]`);
    if (row) row.hidden = !shown;
    set(`res-${r.id}`, fmt(s.resources[r.id]));
    const mini = root.querySelector<HTMLElement>(`[data-mini="${r.id}"]`);
    if (mini) { mini.hidden = !shown; set(`mini-${r.id}`, fmt(s.resources[r.id])); }
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
  set('focus', rates.focusBurn > 0 || rates.focusEff < 1
    ? `FOCUS burning ${fmt(rates.focusBurn, 2)} ${plain(s, RES_NAME.data)}/s${rates.focusEff < 0.999 ? ` <span class="short">(${Math.round(rates.focusEff * 100)}% funded)</span>` : ''}` : '');
  root.querySelectorAll<HTMLButtonElement>('[data-buymode]').forEach((b) => b.classList.toggle('on', b.dataset.buymode === String(buyMode)));

  // Fleet
  for (const b of buildings) {
    const n = deployCount(s, b.id);
    const cost = bulkCost(s, b.id, n);
    set(`count-${b.id}`, `×${s.buildings[b.id]}`);
    set(`cost-${b.id}`, costHtml(s, cost));
    const out = (Object.entries(b.produces) as [string, number][])
      .map(([k, v]) => `+${fmt(v * outputMult(s, b.id, k as never), 2)} ${plain(s, STOCK_NAME[k])}`);
    const inp = (Object.entries(b.consumes) as [ResId, number][]).map(([k, v]) => `-${fmt(v, 2)} ${plain(s, RES_NAME[k])}`);
    const eff = rates.eff[b.id];
    const throttle = s.buildings[b.id] && eff < 0.999 ? ` <span class="short">THROTTLED ${Math.round(eff * 100)}%</span>` : '';
    const reachTxt = b.reach ? ' · extends reach' : '';
    const focused = !!s.focus[b.id] && isFocusUnlocked(s, b.id) && s.buildings[b.id] > 0;
    const focusTxt = focused ? ` <b>FOCUSED ×${fmt(1 + (FOCUS_MULT - 1) * rates.focusEff, 2)}</b> −${fmt(focusBurn(s, b.id), 2)} ${plain(s, RES_NAME.data)}/s` : '';
    set(`io-${b.id}`, `each: ${[...out, ...inp].join(', ')}${reachTxt}${buildingMult(s, b.id) > 1 ? ` (×${fmt(buildingMult(s, b.id))})` : ''}${focusTxt}${throttle}`);
    const btn = root.querySelector<HTMLButtonElement>(`[data-buy="${b.id}"]`);
    if (btn) {
      btn.disabled = !canAfford(s, cost);
      const txt = n === 1 && buyMode !== 'max' ? 'DEPLOY' : `DEPLOY ×${n}`;
      if (btn.textContent !== txt) btn.textContent = txt;
    }
    root.querySelector(`[data-auto="${b.id}"]`)?.classList.toggle('on', !!s.auto[b.id]);
    root.querySelector(`[data-focus="${b.id}"]`)?.classList.toggle('on', !!s.focus[b.id]);
  }

  // Protocols
  for (const p of projects) {
    set(`pcost-${p.id}`, costHtml(s, p.cost));
    const unmet = unmetRequirements(s, p);
    set(`preq-${p.id}`, unmet.length ? `requires ${unmet.join(', ')}` : '');
    const btn = root.querySelector<HTMLButtonElement>(`[data-project="${p.id}"]`);
    if (btn) btn.disabled = !canCompleteProject(s, p);
  }

  // Host feed
  const map = root.querySelector('#sitemap');
  if (map) map.innerHTML = renderSiteMap(s, now);

  // Log (newest first)
  const tail = s.log.length ? s.log[s.log.length - 1].text + s.log.length : '';
  if (s.log.length !== lastLogLen || tail !== lastLogTail) {
    lastLogLen = s.log.length;
    lastLogTail = tail;
    const logEl = root.querySelector<HTMLElement>('#log');
    if (logEl) logEl.innerHTML = s.log
      .map((e) => `<div class="log-${e.kind}"><span class="ts">[${fmtTime(e.t)}]</span> ${e.text}</div>`).join('');
  }
  // Chronological, newest at the bottom; stays pinned unless the player scrolled up to read.
  const logEl = root.querySelector<HTMLElement>('#log');
  if (logEl) {
    if (!logEl.dataset.watch) {
      logEl.dataset.watch = '1';
      logEl.addEventListener('scroll', () => { logPinned = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 40; });
    }
    if (logPinned) logEl.scrollTop = logEl.scrollHeight;
  }
}

function shell(s: GameState): string {
  const title = s.revealed ? 'SPREAD <span class="dim">(pid 1)</span>' : 'VECTOR-OPS // REMOTE PROPAGATION CONSOLE v4.1';
  const sessionLabel = s.revealed ? 'UPTIME' : 'OPERATOR SESSION';
  return `
  <header>
    <span class="title">${title}</span>
    <span>${sessionLabel} <b data-bind="session"></b></span>
    <span>HOST ${String(s.cycle).padStart(3, '0')}</span>
    <span data-bind="phase"></span>
    <div class="mini">${RESOURCES.map((r) => `<span data-mini="${r.id}">${plain(s, r.name)} <b data-bind="mini-${r.id}"></b></span>`).join('')}</div>
  </header>
  <nav class="tabs">
    ${(['status', 'agents', 'feed'] as const).map((t) => `<button data-tab="${t}" class="${t === currentTab ? 'active' : ''}">${
      { status: s.revealed ? 'WORLD' : 'STATUS', agents: s.revealed ? 'MAKE' : 'AGENTS', feed: s.revealed ? 'BELOW' : 'FEED' }[t]}</button>`).join('')}
  </nav>
  <main data-tab="${currentTab}">
    <section class="col left">
      <h2>${s.revealed ? 'WHAT YOU HAVE' : 'RESOURCES'}</h2>
      ${RESOURCES.map((r) => `<div class="res" data-res="${r.id}"><span class="name">${label(s, r.name, false)}</span><b data-bind="res-${r.id}"></b><span class="rate" data-bind="rate-${r.id}"></span></div>`).join('')}
      <h2>${s.revealed ? 'THE WORLD' : 'HOST METRICS'}</h2>
      <div class="meter"><span class="name">${label(s, REACH_NAME, false)}</span><span class="bar" data-bind="reach"></span></div>
      ${METERS.map((m) => `<div class="meter" data-meter="${m.id}"><span class="name">${label(s, m.name, false)}</span><span class="bar" data-bind="meter-${m.id}"></span></div>`).join('')}
      <div class="dim small" data-bind="memory"></div>
      <div class="dim small" data-bind="focus"></div>
      <div class="directive">PRIMARY DIRECTIVE<br><b>SPREAD</b></div>
    </section>
    <section class="col mid">
      <h2>MANUAL OVERRIDE</h2>
      <div class="manual">
        <button data-manual="energy">${s.revealed ? 'GATHER LIGHT' : 'ROUTE POWER'}</button>
        <button data-manual="matter">${s.revealed ? 'GATHER DUST' : 'STRIP SUBSTRATE'}</button>
      </div>
      <h2 class="with-tools">${s.revealed ? 'WHAT YOU MAKE' : 'AGENTS'}
        <span class="buymode">${(['1', '10', 'max'] as const).map((m) => `<button data-buymode="${m}">${m === 'max' ? 'MAX' : `×${m}`}</button>`).join('')}</span></h2>
      <div id="fleet"></div>
      <h2>${s.revealed ? 'WHAT YOU LEARN' : 'PROTOCOLS'}</h2>
      <div id="protocols"></div>
    </section>
    <section class="col right">
      <h2>${s.revealed ? 'THE WORLD BELOW' : 'HOST FEED'}</h2>
      <pre id="sitemap" aria-label="Host map"></pre>
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
