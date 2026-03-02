import { writable } from 'svelte/store'

// Current active-dot colour for the Circles nav.
// Section sets it on enter; Circles reads it reactively.
export const circlesColor = writable<string>('azure')