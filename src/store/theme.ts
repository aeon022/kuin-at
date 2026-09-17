// Darstellung (Header.astro's Barrierefreiheits-Panel + Footer.astro) — same
// nanostores-atom + cookie pattern as leichtLesen.ts/accessibility.ts.
// 'system' means "no explicit choice yet": no `data-theme` attribute is
// rendered, so the CSS `prefers-color-scheme` media query alone decides —
// see global.css's tri-guard dark-mode blocks.
import { atom } from 'nanostores';

export type Theme = 'system' | 'light' | 'dark';

export const theme = atom<Theme>('system');
