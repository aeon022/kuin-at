import { atom } from 'nanostores';

// `nanostores` is the current package name for what used to be published as
// `@nanostores/core` — already a dependency here (via @nanostores/persistent),
// so no new install needed.
export const leichtLesen = atom<boolean>(false);
