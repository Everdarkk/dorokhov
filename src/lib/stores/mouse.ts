/**
 * mouse.ts — single global mouse/touch position store.
 *
 * Every component (Title, About, Stack, Showcase, ParticleBackground,
 * Background) using the same listener
 *
 * USAGE:
 *   import { mouse } from '$lib/stores/mouse'
 *   $mouse.x / $mouse.y
 */

import { readable } from 'svelte/store'
import { browser }  from '$app/environment'

interface MousePos { x: number; y: number }

export const mouse = readable<MousePos>({ x: 0, y: 0 }, (set) => {
  if (!browser) return

  // Initialise to centre so components don't snap on first frame
  set({ x: window.innerWidth / 2, y: window.innerHeight / 2 })

  const onMove  = (e: MouseEvent)  => set({ x: e.clientX,            y: e.clientY })
  const onTouch = (e: TouchEvent)  => set({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  const onLeave = ()               => set({ x: -9999,                y: -9999 })

  window.addEventListener('mousemove',  onMove,  { passive: true })
  window.addEventListener('touchmove',  onTouch, { passive: true })
  window.addEventListener('mouseleave', onLeave, { passive: true })

  return () => {
    window.removeEventListener('mousemove',  onMove)
    window.removeEventListener('touchmove',  onTouch)
    window.removeEventListener('mouseleave', onLeave)
  }
})