// Barrierefreiheits-Panel state (Header.astro) — same nanostores-atom +
// cookie pattern as leichtLesen.ts, so the same "hydrate from the
// server-rendered attribute, then .listen()" approach works unchanged.
import { atom } from 'nanostores';

export type FontSizeStep = '0' | '1' | '2';

export const fontSize = atom<FontSizeStep>('0');
export const highContrast = atom(false);
export const reduceMotion = atom(false);
export const readingAid = atom(false);
