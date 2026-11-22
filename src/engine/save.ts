import { advance, newGame, SAVE_VERSION } from './sim';
import type { GameState } from './types';

export const SAVE_KEY = 'spread.save.v1';
export const OFFLINE_CAP_SECONDS = 8 * 3600;

export function serialize(s: GameState): string {
  return JSON.stringify({ ...s, lastSaved: Date.now() });
}

export function deserialize(raw: string): GameState | null {
  try {
    const data = JSON.parse(raw) as Partial<GameState>;
    if (data.version !== SAVE_VERSION) return null;
    const base = newGame();
    // Merge so newly added resources/buildings get defaults.
    return {
      ...base,
      ...data,
      resources: { ...base.resources, ...data.resources },
      buildings: { ...base.buildings, ...data.buildings },
      auto: { ...data.auto },
      focus: { ...data.focus },
    } as GameState;
  } catch {
    return null;
  }
}

/** Applies offline progress; returns seconds simulated. */
export function applyOffline(s: GameState, now = Date.now()): number {
  if (!s.booted || s.launched) return 0;
  const away = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (now - s.lastSaved) / 1000));
  if (away < 5) return 0;
  advance(s, away, away > 600 ? 5 : 1);
  return away;
}
