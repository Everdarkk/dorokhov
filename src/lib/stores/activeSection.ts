/**
 * activeSection.ts — which section id is currently on screen.
 *
 * WHY: Background, ParticleBackground and other heavy RAF loops should only
 * run while their section is actually visible. 
 * Section.svelte writes to this store via IntersectionObserver.
 * Background components read it and pause/resume their loops.
 */

import { writable } from 'svelte/store'

export const activeSection = writable<string>('')