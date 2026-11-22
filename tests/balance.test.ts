import { expect, test } from 'vitest';
import { nextCycle } from '../src/engine/sim';
import { fmtTime } from '../src/engine/format';
import { playCycle } from './bot';

test('a greedy bot can finish cycle 1 in a reasonable time, and cycle 2 faster', () => {
  const one = playCycle();
  const report = (label: string, r: ReturnType<typeof playCycle>) =>
    console.log(label, r.finished ? 'finished' : 'DID NOT FINISH', fmtTime(r.state.time),
      Object.entries(r.phaseTimes).map(([p, t]) => `P${p}@${fmtTime(t)}`).join(' '),
      JSON.stringify(r.state.buildings), 'meters', Math.round(r.state.resources.atmosphere), Math.round(r.state.resources.hydrosphere), Math.round(r.state.resources.biosphere));
  report('cycle 1:', one);
  expect(one.finished).toBe(true);
  expect(one.state.time).toBeGreaterThan(20 * 60);
  expect(one.state.time).toBeLessThan(120 * 60);

  report('cycle 1 (manual):', playCycle(undefined, undefined, undefined, {}));
  report('cycle 1 (auto only):', playCycle(undefined, undefined, undefined, { auto: true }));
  report('cycle 1 (focus only):', playCycle(undefined, undefined, undefined, { focus: true }));

  const two = playCycle(nextCycle(one.state));
  report('cycle 2:', two);
  expect(two.finished).toBe(true);
  expect(two.state.time).toBeLessThan(one.state.time);
});
