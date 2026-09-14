import { test } from 'node:test';
import assert from 'node:assert/strict';

// @nanostores/persistent reads `globalThis.localStorage` — stub it before import.
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string) { return this.map.has(key) ? this.map.get(key)! : null; }
  setItem(key: string, value: string) { this.map.set(key, value); }
  removeItem(key: string) { this.map.delete(key); }
}
(globalThis as any).localStorage = new MemoryStorage();
(globalThis as any).addEventListener ??= () => {};

const { leichtLesenStore, toggleLeichtLesen, setLeichtLesen } = await import('./leichtLesenStore.ts');

test('defaults to false', () => {
  assert.equal(leichtLesenStore.get(), false);
});

test('toggleLeichtLesen flips the value', () => {
  setLeichtLesen(false);
  toggleLeichtLesen();
  assert.equal(leichtLesenStore.get(), true);
  toggleLeichtLesen();
  assert.equal(leichtLesenStore.get(), false);
});

test('setLeichtLesen sets an explicit value', () => {
  setLeichtLesen(true);
  assert.equal(leichtLesenStore.get(), true);
});
