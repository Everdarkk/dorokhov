<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { techCards, type TechCard } from '$lib/data/stack'

  // ─── Animation timing (ms) ───────────────────────────────────────────────────

  const INTRO_START_DELAY  = 200
  const TITLE_AFTER_EYEBROW = 180
  const CARDS_AFTER_HEADER  = 460
  const CARD_STAGGER        = 100

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  // ─── Entrance animation state ─────────────────────────────────────────────────

  let eyebrowVisible             = false
  let titleVisible               = false
  let cardVisible: boolean[]     = techCards.map(() => false)

  // ─── Popup state ─────────────────────────────────────────────────────────────

  /** Index of the currently hovered card, or null when no card is hovered */
  let hoveredIndex: number | null = null

  /**
   * Current popup position in viewport px — updated every RAF frame via lerp
   * so the popup "floats" after the cursor rather than snapping.
   */
  let popupX = 0
  let popupY = 0

  /** Raw cursor position — the lerp target */
  let cursorX = 0
  let cursorY = 0

  // ─── DOM refs ────────────────────────────────────────────────────────────────

  let container:  HTMLDivElement
  let cardEls:    HTMLElement[]  = []
  let popupEl:    HTMLDivElement

  // ─── Pending timeouts ────────────────────────────────────────────────────────

  let pendingTimeouts: ReturnType<typeof setTimeout>[] = []

  function scheduleTimeout(fn: () => void, delay: number): void {
    pendingTimeouts.push(setTimeout(fn, delay))
  }

  function clearAllTimeouts(): void {
    for (const id of pendingTimeouts) clearTimeout(id)
    pendingTimeouts = []
  }

  // ─── Entrance / exit ─────────────────────────────────────────────────────────

  /**
   * Staggered entrance sequence:
   *   eyebrow → title → blob cards one by one (bubble "pop").
   * Identical pattern to About.svelte for consistency.
   */
  function playAnimation(): void {
    scheduleTimeout(() => { eyebrowVisible = true }, INTRO_START_DELAY)

    scheduleTimeout(
      () => { titleVisible = true },
      INTRO_START_DELAY + TITLE_AFTER_EYEBROW,
    )

    const cardsStart = INTRO_START_DELAY + TITLE_AFTER_EYEBROW + CARDS_AFTER_HEADER
    techCards.forEach((_, i) => {
      scheduleTimeout(() => {
        cardVisible[i] = true
        cardVisible = [...cardVisible]
      }, cardsStart + i * CARD_STAGGER)
    })
  }

  /**
   * Instantly resets all animated elements to hidden without triggering transitions.
   * Applies .no-transition for one frame — same pattern as About.svelte / Title.svelte.
   */
  function hideImmediately(): void {
    clearAllTimeouts()

    if (container) container.classList.add('no-transition')

    eyebrowVisible = false
    titleVisible   = false
    cardVisible    = techCards.map(() => false)
    hoveredIndex   = null

    cardEls.forEach((el) => {
      if (!el) return
      el.style.transform = ''
      el.style.setProperty('--glow', '0')
    })

    requestAnimationFrame(() => {
      if (container) container.classList.remove('no-transition')
    })
  }

  // ─── IntersectionObserver ────────────────────────────────────────────────────

  function findSnapSection(el: HTMLElement): HTMLElement {
    let node: HTMLElement | null = el.parentElement
    while (node) {
      if (node.classList.contains('snap-section')) return node
      node = node.parentElement
    }
    return el
  }

  // ─── Mouse tracking — 3-D tilt + popup follow ────────────────────────────────

  const MAX_DIST  = 340
  /** Lerp factor for the popup position — lower = more "floaty" lag */
  const POPUP_LERP = 0.12
  let rafMouseId: number
  let rafPopupId: number

  function onMouseMove(e: MouseEvent): void {
    cursorX = e.clientX
    cursorY = e.clientY

    cancelAnimationFrame(rafMouseId)
    rafMouseId = requestAnimationFrame(() => {
      cardEls.forEach((el, i) => {
        if (!el) return
        const rect  = el.getBoundingClientRect()
        const cx    = rect.left + rect.width  / 2
        const cy    = rect.top  + rect.height / 2
        const dx    = cursorX - cx
        const dy    = cursorY - cy
        const dist  = Math.hypot(dx, dy)

        if (dist < MAX_DIST) {
          const s     = 1 - dist / MAX_DIST
          const rotX  = -(dy / rect.height) * 18 * s
          const rotY  =  (dx / rect.width)  * 18 * s
          const scale =   1 + 0.06 * s
          const tx    = dx * 0.06 * s
          const ty    = dy * 0.06 * s
          el.style.transform =
            `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale}) translate(${tx}px,${ty}px)`
          el.style.setProperty('--glow', String(s))
        } else {
          el.style.transform = ''
          el.style.setProperty('--glow', '0')
        }
      })
    })
  }

  /**
   * RAF loop that lerps the popup position toward the cursor.
   * Runs continuously while the component is mounted so the popup
   * glides smoothly even when the cursor moves fast.
   */
  function tickPopup(): void {
    popupX = lerp(popupX, cursorX, POPUP_LERP)
    popupY = lerp(popupY, cursorY, POPUP_LERP)

    if (popupEl && hoveredIndex !== null) {
      // Offset so the popup doesn't sit directly under the cursor.
      // Clamp to viewport edges so it never clips off-screen.
      const pw   = popupEl.offsetWidth  || 240
      const ph   = popupEl.offsetHeight || 100
      const vw   = window.innerWidth
      const vh   = window.innerHeight
      const ox   = 20   // horizontal offset from cursor
      const oy   = -ph - 16 // appear above cursor

      let x = popupX + ox
      let y = popupY + oy

      // Flip to right side if too close to left edge
      if (x < 12) x = popupX - pw - ox
      // Flip below if too close to top
      if (y < 12) y = popupY + 24
      // Clamp right edge
      if (x + pw > vw - 12) x = vw - pw - 12
      // Clamp bottom edge
      if (y + ph > vh - 12) y = vh - ph - 12

      popupEl.style.transform = `translate(${x}px, ${y}px)`
    }

    rafPopupId = requestAnimationFrame(tickPopup)
  }

  function onCardMouseEnter(i: number): void {
    hoveredIndex = i
    // Snap popup position to cursor instantly on first enter —
    // avoids it sliding in from (0,0) on first hover.
    popupX = cursorX
    popupY = cursorY
  }

  function onCardMouseLeave(): void {
    hoveredIndex = null
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  onMount(() => {
    const target = findSnapSection(container)

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            playAnimation()
          } else {
            hideImmediately()
          }
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(target)
    window.addEventListener('mousemove', onMouseMove)
    rafPopupId = requestAnimationFrame(tickPopup)

    return (): void => {
      clearAllTimeouts()
      observer.disconnect()
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafMouseId)
      cancelAnimationFrame(rafPopupId)
    }
  })

  onDestroy((): void => {
    if (!browser) return
    clearAllTimeouts()
    cancelAnimationFrame(rafMouseId)
    cancelAnimationFrame(rafPopupId)
  })

  // ─── Derived ─────────────────────────────────────────────────────────────────

  /** The TechCard currently being hovered, or null */
  $: activeCard = hoveredIndex !== null ? techCards[hoveredIndex] : null
</script>

<!-- STRUCTURE -->
<div class="stack" bind:this={container}>

  <!-- Header — same pattern as About -->
  <header class="stack__header">
    <span class="stack__eyebrow" class:visible={eyebrowVisible}>технології</span>
    <h2 class="stack__title" class:visible={titleVisible}>
      Мій<br /><em>стек</em>
    </h2>
  </header>

  <!-- Blob grid -->
  <div class="stack__grid">
    {#each techCards as card, i (card.id)}
      <div
        class="blob"
        class:blob--visible={cardVisible[i]}
        bind:this={cardEls[i]}
        style="
          --accent1: {card.accent1};
          --accent2: {card.accent2};
          --rx: {card.rx};
          --ry: {card.ry};
          --dur: {card.morphDuration}s;
          --del: {card.morphDelay}s;
          --glow: 0;
        "
        role="button"
        tabindex="0"
        aria-label={card.name}
        on:mouseenter={() => onCardMouseEnter(i)}
        on:mouseleave={onCardMouseLeave}
        on:focus={() => onCardMouseEnter(i)}
        on:blur={onCardMouseLeave}
      >
        <div class="blob__body"></div>
        <div class="blob__shine"></div>
        <div class="blob__ring"></div>

        <div class="blob__inner">
          <img
            class="blob__icon"
            src={card.icon}
            alt={card.name}
            width="48"
            height="48"
            loading="lazy"
          />
        </div>
      </div>
    {/each}
  </div>

  <!--
    Cursor-following popup.
    Position is driven by the tickPopup RAF loop via inline transform.
    Visibility toggled by hoveredIndex — CSS handles fade in/out.
    bind:this lets the RAF loop read offsetWidth/Height for clamping.
  -->
  <div
    class="popup"
    class:popup--visible={activeCard !== null}
    bind:this={popupEl}
    aria-hidden="true"
    style="--pop-accent: {activeCard?.accent2 ?? 'rgba(255,255,255,0.3)'}"
  >
    {#if activeCard}
      <div class="popup__header">
        <img
          class="popup__icon"
          src={activeCard.icon}
          alt="Логотип технології"
          aria-hidden="true"
          width="22"
          height="22"
        />
        <span class="popup__name">{activeCard.name}</span>
      </div>
      <p class="popup__summary">{activeCard.summary}</p>
    {/if}
  </div>

</div>

<!-- STYLE -->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Onest:wght@300;400;500&display=swap');

  /* ── Transition kill — used during hideImmediately() ── */
  .stack.no-transition *,
  .stack.no-transition {
    transition: none !important;
    animation-play-state: paused !important;
  }

  /* ── Root layout ── */
  .stack {
    width: 100%;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    padding: 3.5rem 2rem 2rem;
    box-sizing: border-box;
    gap: 1.5rem;
    overflow: hidden;
    position: relative;
    z-index: 10;
    font-family: 'Onest', sans-serif;
  }

  /* ── Header ── */
  .stack__header {
    text-align: center;
    flex-shrink: 0;
  }

  .stack__eyebrow {
    display: inline-block;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.35);
    border: 1px solid rgba(255,255,255,0.12);
    padding: 0.3em 1.1em;
    border-radius: 100px;
    backdrop-filter: blur(4px);
    margin-bottom: 0.6rem;

    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity   0.7s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .stack__eyebrow.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .stack__title {
    font-family: 'Unbounded', sans-serif;
    font-size: clamp(1.5rem, 3.5vw, 2.8rem);
    font-weight: 700;
    line-height: 1.15;
    color: #fff;
    margin: 0;

    opacity: 0;
    transform: translateY(14px);
    transition:
      opacity   0.8s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .stack__title.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .stack__title em {
    font-style: normal;
    /* Matches the grey-lilac-yellow palette of the Стек Background */
    background: linear-gradient(135deg, #d0d0d0 0%, #fff1a0 45%, #c3a4c3 100%);
    background-size: 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 5s linear infinite;
  }

  @keyframes shimmer {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* ── Grid — 4 + 3 layout (first row 4 cols, second row 3 centred) ── */
  .stack__grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: center;
    gap: 1.1rem;
    width: 100%;
    max-width: 860px;
    margin: 0 auto;
    height: 100%;
    min-height: 0;
  }

  /*
    Each blob is a square that fits ~4 per row on desktop.
    aspect-ratio keeps them circular-ish regardless of grid height.
  */
  .blob {
    position: relative;
    will-change: transform, opacity, filter;
    cursor: pointer;
    flex: 0 0 clamp(100px, 18vmin, 160px);
    aspect-ratio: 1;

    /* Hidden: collapsed, blurred bubble */
    opacity: 0;
    transform: scale(0.5);
    filter: blur(16px);

    transition:
      opacity   0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      filter    0.6s ease;
  }

  /* Visible — bubble pops open with springy overshoot */
  .blob--visible {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);

    /* Fast transform transition for mouse tilt after entrance */
    transition:
      opacity   0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.1s ease,
      filter    0.6s ease;
  }

  /* Goo body */
  .blob__body {
    position: absolute;
    inset: 0;
    border-radius: var(--rx) / var(--ry);
    background: radial-gradient(
      ellipse at 35% 28%,
      color-mix(in srgb, var(--accent2) 60%, white 40%) 0%,
      var(--accent1) 50%,
      color-mix(in srgb, var(--accent1) 50%, black 50%) 100%
    );
    animation: morph var(--dur) ease-in-out var(--del) infinite alternate;
    transition: border-radius 0.9s ease, box-shadow 0.35s ease;
    z-index: 0;
  }

  .blob:hover .blob__body,
  .blob:focus-visible .blob__body {
    animation-play-state: paused;
    border-radius: 50%;
    box-shadow:
      0 0 0 2px color-mix(in srgb, var(--accent2) 70%, transparent 30%),
      0 0 60px 8px color-mix(in srgb, var(--accent2) 45%, transparent 55%);
  }

  @keyframes morph {
    0%   { border-radius: var(--rx) / var(--ry); }
    33%  { border-radius: 50% 30% 65% 35% / 35% 65% 30% 50%; }
    66%  { border-radius: 30% 70% 40% 60% / 60% 40% 70% 30%; }
    100% { border-radius: var(--ry) / var(--rx); }
  }

  /* Gradient ring */
  .blob__ring {
    position: absolute;
    inset: -3px;
    border-radius: inherit;
    background: conic-gradient(
      from 0deg,
      var(--accent2),
      transparent 30%,
      var(--accent1) 60%,
      transparent 80%,
      var(--accent2)
    );
    z-index: 0;
    opacity: calc(0.35 + var(--glow) * 0.65);
    animation: morph var(--dur) ease-in-out calc(var(--del) - 0.4s) infinite alternate;
    filter: blur(1.5px);
    transition: opacity 0.15s ease;
  }

  /* Specular 3-D shine */
  .blob__shine {
    position: absolute;
    top: 8%;
    left: 12%;
    width: 38%;
    height: 26%;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(6px);
    z-index: 1;
    pointer-events: none;
    opacity: calc(0.45 + var(--glow) * 0.55);
    transition: opacity 0.15s ease;
  }

  /* Icon container */
  .blob__inner {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .blob__icon {
    width: 45%;
    height: 45%;
    object-fit: contain;
    display: block;
    /*
      Drop-shadow lifts the icon off the blob surface.
      filter:none preserves original icon colours — no inversion.
    */
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.5));
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .blob:hover .blob__icon,
  .blob:focus-visible .blob__icon {
    transform: scale(1.15);
  }

  /* ── Popup ───────────────────────────────────────────────────────────────────

    Positioned fixed so it escapes any overflow:hidden ancestor.
    transform is driven by the tickPopup RAF loop (translate(x,y)).
    Opacity/visibility toggled by .popup--visible.

    Design: frosted-glass card with a thin gradient border matching the
    hovered blob's accent colour.
  ─────────────────────────────────────────────────────────────────────────── */
  .popup {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    width: max-content;
    max-width: 260px;
    pointer-events: none; /* never blocks mouse events */

    /* Glass card */
    background: rgba(20, 18, 28, 0.72);
    backdrop-filter: blur(18px) saturate(1.4);
    -webkit-backdrop-filter: blur(18px) saturate(1.4);
    border-radius: 16px;
    padding: 0.85rem 1.1rem;

    /*
      Gradient border: uses box-shadow + a pseudo border trick via
      background-clip. We use outline + box-shadow so no pseudo-element needed.
    */
    outline: 1px solid transparent;
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--pop-accent) 40%, transparent 60%),
      0 8px 32px rgba(0,0,0,0.45),
      0 2px 8px rgba(0,0,0,0.3);

    /* Hidden state */
    opacity: 0;
    visibility: hidden;
    /* Scale down from centre on hide */
    transform: translate(0, 0) scale(0.9);
    transform-origin: bottom left;
    transition:
      opacity    0.2s ease,
      visibility 0.2s ease;
    /* Note: we do NOT transition transform here —
       it is driven every frame by the RAF loop */
  }

  .popup--visible {
    opacity: 1;
    visibility: visible;
  }

  .popup__header {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin-bottom: 0.5rem;
  }

  .popup__icon {
    width: 22px;
    height: 22px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 4px rgba(0,0,0,0.4));
  }

  .popup__name {
    font-family: 'Unbounded', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.02em;
    /* Accent underline using the blob's colour */
    background: linear-gradient(90deg, var(--pop-accent), var(--pop-accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .popup__summary {
    font-family: 'Onest', sans-serif;
    font-size: 0.78rem;
    line-height: 1.6;
    color: rgba(255,255,255,0.72);
    margin: 0;
    font-weight: 300;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .stack { padding: 3.5rem 1rem 1rem; gap: 1rem; }
    .stack__grid { gap: 0.8rem; }
  }

  @media (max-width: 380px) {
    .blob {
      flex: 0 0 clamp(80px, 40vw, 120px);
    }
  }
</style>