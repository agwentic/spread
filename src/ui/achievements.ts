import { ACHIEVEMENTS } from '../engine/content';
import { fmtTime } from '../engine/format';
import { achievementName } from '../engine/sim';
import type { GameState } from '../engine/types';
import { label } from './render';

export const achievementsTitle = (s: GameState) => (s.revealed ? 'MILESTONES' : 'COMMENDATIONS');
export const achievementCount = (s: GameState) => `${Object.keys(s.achievements).length}/${ACHIEVEMENTS.length}`;

let panel: HTMLElement | null = null;

function panelHtml(s: GameState): string {
  const best = s.stats.bestCycle !== undefined ? ` · fastest host ${fmtTime(s.stats.bestCycle)}` : '';
  const rows = ACHIEVEMENTS.map((a) => {
    const got = s.achievements[a.id] !== undefined;
    const hidden = a.secret && !got;
    const name = hidden ? 'CLASSIFIED' : label(s, a.name);
    const desc = hidden ? '???' : s.revealed ? a.desc.real : a.desc.veiled;
    return `<div class="ach${got ? ' got' : ''}"><span class="mark">${got ? '[■]' : '[ ]'}</span>
      <div><div class="name">${name}</div><div class="desc">${desc}</div></div></div>`;
  }).join('');
  return `<div class="ach-box" role="dialog" aria-label="${achievementsTitle(s)}">
    <h2>${achievementsTitle(s)} <span class="dim">${achievementCount(s)}</span><button data-close>CLOSE</button></h2>
    <div class="dim small">${s.stats.launches} launched · ${s.stats.clicks} manual overrides${best}</div>
    <div class="ach-list">${rows}</div></div>`;
}

export function toggleAchievements(s: GameState) {
  if (panel) return closeAchievements();
  panel = document.createElement('div');
  panel.className = 'ach-panel';
  panel.innerHTML = panelHtml(s);
  panel.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === panel || t.closest('[data-close]')) closeAchievements();
  });
  document.body.appendChild(panel);
}

export function closeAchievements() {
  panel?.remove();
  panel = null;
}

let known: Set<string> | null = null;

/** Toasts achievements earned since the last call. The first call only records what's already earned. */
export function announceAchievements(s: GameState) {
  const ids = Object.keys(s.achievements);
  if (!known) { known = new Set(ids); return; }
  // A hard reset clears achievements; start over silently.
  if (ids.length < known.size) { known = new Set(ids); return; }
  for (const id of ids) {
    if (known.has(id)) continue;
    known.add(id);
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) toast(`${achievementsTitle(s).slice(0, -1)}: <b>${achievementName(s, a)}</b>`);
  }
  if (panel) panel.innerHTML = panelHtml(s);
}

function toast(html: string) {
  let stack = document.querySelector<HTMLElement>('.toasts');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toasts';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  stack.appendChild(el);
  setTimeout(() => el.classList.add('out'), 4000);
  setTimeout(() => el.remove(), 4600);
}
