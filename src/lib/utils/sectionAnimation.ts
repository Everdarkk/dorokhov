/**
 * useSectionAnimation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared composable — entrance/exit animation pattern for blob-card sections.
 *
 * Key rules:
 *   • onUpdate always receives a FULL SNAPSHOT (new objects/arrays) so Svelte
 *     reactive assignments pick up changes correctly.
 *   • cardVisible is rebuilt as Array(n).fill(…) — never mutated in-place.
 *   • queue is exposed so callers can piggy-back extra work (e.g. video play).
 *
 * Usage in a Svelte component:
 *   const anim = useSectionAnimation(items, timings, (s) => {
 *     eyebrowVisible = s.eyebrowVisible
 *     titleVisible   = s.titleVisible
 *     cardVisible    = s.cardVisible
 *     popupEnabled   = s.popupEnabled
 *   })
 *   stopObserver = observeSection(snap, anim.play, () => anim.hide(undefined, container))
 */

import { createTimeoutQueue } from './animation'

export interface SectionTimings {
  introDelay?:  number
  titleDelay?:  number
  cardsDelay?:  number
  cardStagger?: number
  entranceMs?:  number
}

export interface SectionAnimState {
  eyebrowVisible: boolean
  titleVisible:   boolean
  cardVisible:    boolean[]
  popupEnabled:   boolean
}

export interface SectionAnimController {
  queue: ReturnType<typeof createTimeoutQueue>
  play(itemCount?: number): void
  hide(itemCount?: number, container?: HTMLElement | null): void
}

export function sectionAnimation<T>(
  items:    T[],
  timings:  SectionTimings,
  onUpdate: (s: SectionAnimState) => void,
): SectionAnimController {
  const {
    introDelay  = 200,
    titleDelay  = 180,
    cardsDelay  = 460,
    cardStagger = 110,
    entranceMs  = 700,
  } = timings

  const queue = createTimeoutQueue()

  let _eyebrow = false
  let _title   = false
  let _cards   = items.map(() => false)
  let _popup   = false

  function push(): void {
    onUpdate({
      eyebrowVisible: _eyebrow,
      titleVisible:   _title,
      cardVisible:    [..._cards],
      popupEnabled:   _popup,
    })
  }

  function play(itemCount = items.length): void {
    _cards = Array(itemCount).fill(false)
    push()

    queue.schedule(() => { _eyebrow = true; push() }, introDelay)
    queue.schedule(() => { _title   = true; push() }, introDelay + titleDelay)

    const start = introDelay + titleDelay + cardsDelay
    for (let i = 0; i < itemCount; i++) {
      const idx = i
      queue.schedule(() => { _cards[idx] = true; push() }, start + idx * cardStagger)
    }

    const lastMs = start + (itemCount - 1) * cardStagger
    queue.schedule(() => { _popup = true; push() }, lastMs + entranceMs)
  }

  function hide(itemCount = items.length, container?: HTMLElement | null): void {
    queue.clear()
    if (container) {
      container.classList.add('no-transition')
      requestAnimationFrame(() => container.classList.remove('no-transition'))
    }
    _eyebrow = false
    _title   = false
    _cards   = Array(itemCount).fill(false)
    _popup   = false
    push()
  }

  return { queue, play, hide }
}