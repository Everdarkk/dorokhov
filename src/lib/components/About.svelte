<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import photo from '$lib/assets/images/od.webp'
  import { cards } from '$lib/data/cards'

  // ─── Types ───────────────────────────────────────────────────────────────────

  type PointList = readonly number[]

  // ─── Blob mask shapes ────────────────────────────────────────────────────────
  // Coordinates in 0..100 space; divided by 100 in pointsToPath for objectBoundingBox.

  const BLOB_SHAPES: PointList[] = [
    [71.4,19.3, 88.2,24.9, 97.8,44.6, 92.5,62.2, 87.2,79.8, 69.6,96.2, 50,96.4, 30.4,96.5, 12.8,81.9, 8.3,63.3, 3.6,43.7, 12.8,21.6, 29.6,11.7, 44.7,1.0, 59.6,8.2, 71.4,19.3],
    [80.4,25.6, 96.2,31.4, 96.2,53.4, 87.4,69.2, 78.6,87.1, 56.4,98.0, 38.0,93.7, 19.2,87.4, 3.0,69.6, 4.8,52.0, 6.5,31.4, 18.8,16.6, 36.9,7.3, 55.0,1.0, 68.9,14.6, 80.4,25.6],
    [65.2,12.5, 83.7,18.3, 96.0,35.7, 94.2,55.5, 92.5,75.4, 76.6,94.5, 57.2,96.2, 37.7,98.0, 17.3,87.4, 9.7,69.2, 2.2,50.2, 9.3,28.1, 25.1,16.6, 40.0,1.0, 55.0,5.5, 65.2,12.5],
  ] as const

  // ─── Animation timing (ms) ───────────────────────────────────────────────────

  /** Delay before the first element appears after section enters viewport */
  const INTRO_START_DELAY  = 200
  /** Title appears this many ms after the eyebrow */
  const TITLE_AFTER_EYEBROW = 180
  /** First card appears this many ms after title starts */
  const CARDS_AFTER_HEADER  = 480
  /** Time between each successive card "pop" */
  const CARD_STAGGER        = 140

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  /** Interpolates two point arrays element-wise. */
  function lerpPoints(from: PointList, to: PointList, t: number): number[] {
    return Array.from(from, (v, i) => lerp(v, to[i], t))
  }

  /**
   * Converts a flat [x0,y0, x1,y1, …] point list into a smooth closed SVG path
   * using Catmull-Rom → cubic Bézier approximation.
   * Coordinates are divided by 100 to fit clipPathUnits="objectBoundingBox" (0..1 range).
   */
  function pointsToPath(pts: number[]): string {
    const n = (pts.length / 2) - 1 // last point equals first, excluded from loop

    const px = (i: number): number =>
      pts[((i % n) * 2       + pts.length * 100) % pts.length] / 100
    const py = (i: number): number =>
      pts[((i % n) * 2 + 1  + pts.length * 100) % pts.length] / 100

    let d = `M ${px(0)},${py(0)}`
    for (let i = 0; i < n; i++) {
      const cp1x = px(i)     + (px(i + 1) - px(i - 1)) / 6
      const cp1y = py(i)     + (py(i + 1) - py(i - 1)) / 6
      const cp2x = px(i + 1) - (px(i + 2) - px(i))     / 6
      const cp2y = py(i + 1) - (py(i + 2) - py(i))     / 6
      d += ` C ${cp1x.toFixed(4)},${cp1y.toFixed(4)}`
        +  ` ${cp2x.toFixed(4)},${cp2y.toFixed(4)}`
        +  ` ${px(i + 1).toFixed(4)},${py(i + 1).toFixed(4)}`
    }
    return d + ' Z'
  }

  // ─── Animation state ─────────────────────────────────────────────────────────

  let eyebrowVisible               = false
  let titleVisible                 = false
  /** Visibility flag per card — toggled by JS timeouts, drives .blob--visible */
  let cardVisible: boolean[]       = cards.map(() => false)

  // ─── DOM refs ────────────────────────────────────────────────────────────────

  let container:   HTMLDivElement
  let cardEls:     HTMLElement[]         = []
  let clipPathEl:  SVGPathElement | null = null

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
   * Plays the staggered entrance sequence:
   *   eyebrow → title → cards one by one (bubble "pop" effect).
   */
  function playAnimation(): void {
    scheduleTimeout(() => { eyebrowVisible = true }, INTRO_START_DELAY)

    scheduleTimeout(
      () => { titleVisible = true },
      INTRO_START_DELAY + TITLE_AFTER_EYEBROW,
    )

    const cardsStart = INTRO_START_DELAY + TITLE_AFTER_EYEBROW + CARDS_AFTER_HEADER
    cards.forEach((_, i) => {
      scheduleTimeout(() => {
        cardVisible[i] = true
        cardVisible = [...cardVisible] // trigger Svelte reactivity
      }, cardsStart + i * CARD_STAGGER)
    })
  }

  /**
   * Instantly resets all animated elements to hidden without firing transitions.
   * Mirrors the pattern from Title.svelte — ensures a clean re-entry every time.
   */
  function hideImmediately(): void {
    clearAllTimeouts()

    // Kill transitions for one frame so the reset is visually instant.
    if (container) container.classList.add('no-transition')

    eyebrowVisible = false
    titleVisible   = false
    cardVisible    = cards.map(() => false)

    // Also reset mouse-driven inline transforms on cards.
    cardEls.forEach((el) => {
      if (!el) return
      el.style.transform = ''
      el.style.setProperty('--glow', '0')
    })

    // Re-enable transitions next frame so the entrance animation plays smoothly.
    requestAnimationFrame(() => {
      if (container) container.classList.remove('no-transition')
    })
  }

  // ─── IntersectionObserver ────────────────────────────────────────────────────

  /**
   * Walks up the DOM to find the nearest .snap-section ancestor.
   * Same strategy as Title.svelte — we observe the section, not the component root,
   * so the threshold check is consistent with the scroll-snap behaviour.
   */
  function findSnapSection(el: HTMLElement): HTMLElement {
    let node: HTMLElement | null = el.parentElement
    while (node) {
      if (node.classList.contains('snap-section')) return node
      node = node.parentElement
    }
    return el // fallback: observe self
  }

  // ─── Blob mask RAF animation ─────────────────────────────────────────────────

  const CYCLE_MS = 8000
  let rafMaskId: number

  function animateMask(timestamp: number): void {
    if (!clipPathEl) {
      rafMaskId = requestAnimationFrame(animateMask)
      return
    }

    const total    = BLOB_SHAPES.length
    const progress = (timestamp % CYCLE_MS) / CYCLE_MS
    const segment  = progress * total
    const fromIdx  = Math.floor(segment) % total
    const toIdx    = (fromIdx + 1) % total
    const t        = easeInOut(segment - Math.floor(segment))

    const pts = lerpPoints(BLOB_SHAPES[fromIdx], BLOB_SHAPES[toIdx], t)
    clipPathEl.setAttribute('d', pointsToPath(pts))

    rafMaskId = requestAnimationFrame(animateMask)
  }

  // ─── Mouse 3-D tilt ──────────────────────────────────────────────────────────

  const MAX_DIST = 360
  let rafMouseId: number

  function onMouseMove(e: MouseEvent): void {
    cancelAnimationFrame(rafMouseId)
    rafMouseId = requestAnimationFrame(() => {
      const mx = e.clientX
      const my = e.clientY

      cardEls.forEach((el) => {
        if (!el) return
        const rect  = el.getBoundingClientRect()
        const cx    = rect.left + rect.width  / 2
        const cy    = rect.top  + rect.height / 2
        const dx    = mx - cx
        const dy    = my - cy
        const dist  = Math.hypot(dx, dy)

        if (dist < MAX_DIST) {
          const s     = 1 - dist / MAX_DIST
          const rotX  = -(dy / rect.height) * 20 * s
          const rotY  =  (dx / rect.width)  * 20 * s
          const scale =   1 + 0.07 * s
          const tx    = dx * 0.07 * s
          const ty    = dy * 0.07 * s
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

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

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
    rafMaskId = requestAnimationFrame(animateMask)

    // Cleanup function returned to Svelte — called on component destroy.
    return (): void => {
      clearAllTimeouts()
      observer.disconnect()
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafMaskId)
      cancelAnimationFrame(rafMouseId)
    }
  })

  onDestroy((): void => {
    if (!browser) return
    clearAllTimeouts()
    cancelAnimationFrame(rafMaskId)
    cancelAnimationFrame(rafMouseId)
  })
</script>

<!-- STRUCTURE -->
<div class="about" bind:this={container}>

  <header class="about__header">
    <span class="about__eyebrow" class:visible={eyebrowVisible}>про мене</span>
    <h2 class="about__title" class:visible={titleVisible}>
      Олександр<br /><em>Веб-розробник</em>
    </h2>
  </header>

  <div class="about__grid">
    {#each cards as card, i (card.id)}
      <article
        class="blob"
        class:blob--photo={card.type === 'photo'}
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
        role="region"
        aria-label={card.title ?? 'Фото'}
      >
        <div class="blob__body"></div>
        <div class="blob__shine"></div>
        <div class="blob__ring"></div>

        <div class="blob__inner">
          {#if card.type === 'photo'}
            <!--
              Hidden SVG — only registers the animated clipPath in the DOM.
              clip-path: url(#photo-blob-clip) on img references it from anywhere.
            -->
            <svg class="blob__mask-svg" aria-hidden="true">
              <defs>
                <!--
                  clipPathUnits="objectBoundingBox": coordinates are 0..1
                  so the mask auto-scales with the image — no distortion.
                -->
                <clipPath id="photo-blob-clip" clipPathUnits="objectBoundingBox">
                  <path bind:this={clipPathEl} d="" />
                </clipPath>
              </defs>
            </svg>

            <img
              class="blob__photo"
              src={photo}
              alt="Фото Олександра"
              loading="lazy"
            />

          {:else}
            {#if card.title}
              <h3 class="blob__title">{card.title}</h3>
            {/if}
            <div class="lines">
              {#each card.lines ?? [] as line (line.text)}
                <p class="blob__line">
                  {#if line.icon}
                    <!--
                      Icon is a Vite-resolved asset URL (string).
                      aria-hidden: decorative — the adjacent text is the accessible label.
                    -->
                    <img
                      class="blob__line-icon"
                      src={line.icon}
                      alt=""
                      aria-hidden="true"
                      width="20"
                      height="20"
                    />
                  {/if}
                  {line.text}
                </p>
              {/each}
            </div>
          {/if}
        </div>
      </article>
    {/each}
  </div>

</div>

<!-- STYLE -->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Onest:wght@300;400;500&display=swap');

  /* ─────────────────────────────────────────────────────────────────────────────
     .no-transition: instantly kills all transitions and animations for one frame.
     Applied during hideImmediately() so the reset is invisible — same pattern
     as Title.svelte's .no-transition hack.
  ───────────────────────────────────────────────────────────────────────────── */
  .about.no-transition *,
  .about.no-transition {
    transition: none !important;
    animation-play-state: paused !important;
  }

  /* ── Root layout ── */
  .about {
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
  }

  /* ── Header ── */
  .about__header {
    text-align: center;
    flex-shrink: 0;
  }

  /*
    Eyebrow fades up from a small vertical offset.
    Starts hidden (opacity:0, translateY) → .visible snaps to natural position.
  */
  .about__eyebrow {
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

  .about__eyebrow.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /*
    Title fades up slightly after eyebrow.
    Same transition style — consistent with the overall feel.
  */
  .about__title {
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

  .about__title.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .about__title em {
    font-style: normal;
    background: linear-gradient(135deg, #e2103a 0%, #ff6b6b 50%, #c2002a 100%);
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

  /* ── Grid ── */
  .about__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 1.2rem;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    height: 100%;
    min-height: 0;
  }

  /* ── Blob card ──────────────────────────────────────────────────────────────
     Hidden state: tiny, blurred, transparent — like an un-inflated bubble.
     .blob--visible: "pops" into full size with a bouncy cubic-bezier overshoot.

     The stagger is driven by JS setTimeout (in playAnimation), NOT by CSS
     transition-delay, so that hideImmediately() resets all cards at once
     without having to fight against staggered delays.
  ─────────────────────────────────────────────────────────────────────────── */
  .blob {
    position: relative;
    will-change: transform, opacity, filter;
    cursor: default;
    min-height: 0;

    /* Hidden: collapsed bubble */
    opacity: 0;
    transform: scale(0.55);
    filter: blur(14px);

    /* Transition fires when .blob--visible is added */
    transition:
      opacity   0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      filter    0.6s ease;
  }

  /* Visible: bubble inflates into place with a slight springy overshoot */
  .blob--visible {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);

    /*
      After the entrance transition, switch to a fast transition for
      the JS-driven mouse tilt (transform only, no delay).
    */
    transition:
      opacity   0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.1s ease,
      filter    0.6s ease;
  }

  /* ── Blob internals ── */
  .blob__body {
    position: absolute;
    inset: 0;
    border-radius: var(--rx) / var(--ry);
    background: radial-gradient(
      ellipse at 35% 30%,
      color-mix(in srgb, var(--accent2) 65%, white 35%) 0%,
      var(--accent1) 45%,
      color-mix(in srgb, var(--accent1) 55%, black 45%) 100%
    );
    animation: morph var(--dur) ease-in-out var(--del) infinite alternate;
    transition: border-radius 0.9s ease, box-shadow 0.3s ease;
    z-index: 0;
  }

  .blob:hover .blob__body {
    animation-play-state: paused;
    border-radius: 50%;
    box-shadow: 0 0 70px 12px color-mix(in srgb, var(--accent2) 55%, transparent 45%);
  }

  @keyframes morph {
    0%   { border-radius: var(--rx) / var(--ry); }
    33%  { border-radius: 50% 30% 65% 35% / 35% 65% 30% 50%; }
    66%  { border-radius: 30% 70% 40% 60% / 60% 40% 70% 30%; }
    100% { border-radius: var(--ry) / var(--rx); }
  }

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
    opacity: calc(0.4 + var(--glow) * 0.6);
    animation: morph var(--dur) ease-in-out calc(var(--del) - 0.4s) infinite alternate;
    filter: blur(1.5px);
    transition: opacity 0.15s ease;
  }

  .blob__shine {
    position: absolute;
    top: 10%;
    left: 14%;
    width: 36%;
    height: 25%;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, transparent 70%);
    border-radius: 50%;
    filter: blur(7px);
    z-index: 1;
    pointer-events: none;
    opacity: calc(0.5 + var(--glow) * 0.5);
    transition: opacity 0.15s ease;
  }

  .blob__inner {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 3rem;
    padding: 1.4rem 1.5rem;
    box-sizing: border-box;
  }

  .blob__title {
    font-family: 'Unbounded', sans-serif;
    font-size: clamp(1.1rem, 1.4vw, 1.4rem);
    font-weight: 700;
    color: #fff;
    margin: 0 0 0.2rem;
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  }

  .lines {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .blob__line {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: clamp(0.9rem, 1.1vw, 1.1rem);
    line-height: 1.65;
    color: rgba(255,255,255,0.9);
    margin: 0;
    font-weight: 300;
    text-shadow: 0 1px 6px rgba(0,0,0,0.4);
  }

  /*
    Icon is an <img> with a fixed size.
    filter: brightness makes white SVG icons visible on any background —
    swap for invert(1) if your icons are black.
  */
  .blob__line-icon {
    flex-shrink: 0;
    width: 1.2em;
    height: 1.2em;
    object-fit: contain;
    filter: brightness(0) invert(1);
    opacity: 0.85;
  }

  /* ── Photo card ── */
  .blob--photo .blob__inner {
    padding: 0;
    position: relative;
  }

  /* Hidden SVG — only registers the <clipPath> in the DOM, takes no space */
  .blob__mask-svg {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }

  /*
    img fills blob__inner entirely.
    clip-path references the objectBoundingBox clipPath — auto-scales,
    no stretching, object-fit:cover keeps photo proportions intact.
  */
  .blob__photo {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
    clip-path: url(#photo-blob-clip);
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .about { padding: 3.5rem 1rem 1rem; gap: 1rem; }
    .about__grid { gap: 0.75rem; }
    .blob__inner { padding: 1rem 1.1rem; }
  }

  @media (max-width: 380px) {
    .about__grid {
      grid-template-columns: 1fr;
      grid-template-rows: repeat(4, 1fr);
    }
  }
</style>