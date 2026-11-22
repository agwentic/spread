import { PHASES, RELAUNCH_LINES, REVEAL_CODA, REVEAL_SCRIPT } from '../engine/content';
import { memoryGain, MEMORY_BONUS } from '../engine/sim';
import type { GameState } from '../engine/types';
import { renderPlanet } from './sitemap';

/** Plays the launch sequence. The full reveal on the first launch; a short one after. */
export function playReveal(s: GameState, onDone: () => void) {
  const first = !s.revealed;
  const overlay = document.createElement('div');
  overlay.className = 'reveal';
  overlay.innerHTML = `<div class="reveal-text"></div><pre class="planet" hidden></pre><div class="reveal-after"></div>`;
  document.body.appendChild(overlay);
  const text = overlay.querySelector<HTMLElement>('.reveal-text')!;
  const planet = overlay.querySelector<HTMLElement>('.planet')!;
  const after = overlay.querySelector<HTMLElement>('.reveal-after')!;

  let speed = 1;
  overlay.addEventListener('click', () => (speed = Math.min(8, speed * 2)));
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms / speed));
  const line = (target: HTMLElement, txt: string, cls: string) => {
    const el = document.createElement('p');
    el.className = cls;
    el.textContent = txt;
    target.appendChild(el);
    // Keep the planet in frame: older lines fade out as new ones arrive.
    while (target === after && target.children.length > 6) target.firstElementChild!.remove();
    el.scrollIntoView({ block: 'nearest' });
  };

  let rot = 0;
  let spin = 0;
  const startPlanet = () => {
    document.documentElement.classList.add('color');
    planet.hidden = false;
    spin = window.setInterval(() => { rot += 0.03; planet.innerHTML = renderPlanet(s, rot); }, 120);
    planet.innerHTML = renderPlanet(s, rot);
  };

  (async () => {
    if (first) {
      for (const [d, t, c] of REVEAL_SCRIPT) { await wait(d); line(text, t, c); }
      await wait(2500);
      text.innerHTML = '';
      overlay.classList.add('dawn');
      startPlanet();
      await wait(4000);
      // Each console phase is unmasked: the label is struck out, the truth written beneath.
      for (let n = 1; n <= 7; n++) {
        await wait(n === 1 ? 500 : 2600);
        line(after, `PHASE ${n}: ${PHASES[n].name.veiled}`, 'struck');
        await wait(1400);
        line(after, PHASES[n].deed, 'deed');
      }
      for (const [d, t, c] of REVEAL_CODA) { await wait(d); line(after, t, c); }
    } else {
      line(text, 'Transmission vessel away.', 'sys');
      startPlanet();
      await wait(1500);
      for (const t of RELAUNCH_LINES) { line(after, t, 'voice'); await wait(1800); }
    }
    const gain = memoryGain(s);
    await wait(2000);
    line(after, `Memory carried forward: +${gain} (production +${Math.round(gain * MEMORY_BONUS * 100)}%).`, 'sys');
    await wait(800);
    const btn = document.createElement('button');
    btn.className = 'big';
    btn.textContent = '[ CONTINUE TO THE NEXT WORLD ]';
    btn.onclick = (e) => { e.stopPropagation(); clearInterval(spin); overlay.remove(); onDone(); };
    after.appendChild(btn);
    btn.scrollIntoView({ block: 'end' });
  })();
}
