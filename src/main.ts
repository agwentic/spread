import './style.css';
import { boot, completeProject, launch, log, manual, newGame, nextCycle, tick } from './engine/sim';
import { applyOffline, deserialize, SAVE_KEY, serialize } from './engine/save';
import { fmtTime } from './engine/format';
import type { BuildingId, GameState } from './engine/types';
import { buyBuilding } from './engine/sim';
import { invalidate, render } from './ui/render';
import { playReveal } from './ui/reveal';

const root = document.getElementById('app')!;
const params = new URLSearchParams(location.search);
const SPEED = Math.max(1, Number(params.get('speed')) || 1);

function load(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const s = raw ? deserialize(raw) : null;
    if (s) {
      const away = applyOffline(s);
      if (away > 60) log(s, `Session resumed. Fleet operated autonomously for ${fmtTime(away)}.`);
      return s;
    }
  } catch { /* storage unavailable */ }
  return newGame();
}

let state = load();
let paused = false;

function save() {
  try { localStorage.setItem(SAVE_KEY, serialize(state)); } catch { /* ignore */ }
}

root.addEventListener('click', (ev) => {
  const t = (ev.target as HTMLElement).closest('button');
  if (!t || paused) return;
  const d = t.dataset;
  if (d.buy) buyBuilding(state, d.buy as BuildingId);
  else if (d.project) completeProject(state, d.project);
  else if (d.manual) manual(state, d.manual as 'energy' | 'matter');
  else if (d.action === 'boot') { boot(state); document.documentElement.classList.add('poweron'); }
  else if (d.action === 'save') { save(); log(state, 'State saved.'); }
  else if (d.action === 'reset') {
    if (confirm('Erase everything, including Memory and the reveal?')) {
      try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
      state = newGame();
      document.documentElement.classList.remove('color');
      invalidate();
    }
  } else if (d.action === 'launch') {
    if (!launch(state)) return;
    save();
    startReveal();
  }
  render(root, state, performance.now());
});

function startReveal() {
  paused = true;
  playReveal(state, () => {
    state = nextCycle(state);
    paused = false;
    save();
    invalidate();
  });
}

if (state.revealed) document.documentElement.classList.add('color');
// A launch that was interrupted (tab closed mid-reveal) resumes here.
if (state.launched) startReveal();

let last = performance.now();
let lastSave = last;
function frame(now: number) {
  const dt = Math.min(1, (now - last) / 1000) * SPEED;
  last = now;
  if (!paused) {
    tick(state, dt);
    render(root, state, now);
  }
  if (now - lastSave > 10_000 && !paused) { save(); lastSave = now; }
  setTimeout(() => requestAnimationFrame(frame), 100);
}
window.addEventListener('beforeunload', () => { if (!paused) save(); });
render(root, state, last);
requestAnimationFrame(frame);

// Expose for debugging in the console.
(window as unknown as { game: () => GameState }).game = () => state;
