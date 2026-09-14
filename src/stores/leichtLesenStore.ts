import { persistentAtom } from '@nanostores/persistent';

export const leichtLesenStore = persistentAtom<boolean>('kuin:leicht-lesen', false, {
  encode: (v) => String(v),
  decode: (v) => v === 'true',
});

export function toggleLeichtLesen(): void {
  leichtLesenStore.set(!leichtLesenStore.get());
}

export function setLeichtLesen(value: boolean): void {
  leichtLesenStore.set(value);
}
