<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { projects, type ShowcaseProject } from '$lib/data/showcase'

  // ─── Types ───────────────────────────────────────────────────────────────────

  type PointList = readonly number[]

  // ─── Constants ───────────────────────────────────────────────────────────────

  /** How many cards are shown per page on desktop */
  const CARDS_PER_PAGE = 4

  /** How many cards are shown per page on mobile */
  const CARDS_PER_PAGE_MOBILE = 1

  // ─── Blob mask shapes (same as About.svelte) ─────────────────────────────────

  const BLOB_SHAPES: PointList[] = [
    [71.4,19.3, 88.2,24.9, 97.8,44.6, 92.5,62.2, 87.2,79.8, 69.6,96.2,
     50,96.4, 30.4,96.5, 12.8,81.9, 8.3,63.3, 3.6,43.7, 12.8,21.6,
     29.6,11.7, 44.7,1.0, 59.6,8.2, 71.4,19.3],
    [80.4,25.6, 96.2,31.4, 96.2,53.4, 87.4,69.2, 78.6,87.1, 56.4,98.0,
     38.0,93.7, 19.2,87.4, 3.0,69.6, 4.8,52.0, 6.5,31.4, 18.8,16.6,
     36.9,7.3, 55.0,1.0, 68.9,14.6, 80.4,25.6],
    [65.2,12.5, 83.7,18.3, 96.0,35.7, 94.2,55.5, 92.5,75.4, 76.6,94.5,
     57.2,96.2, 37.7,98.0, 17.3,87.4, 9.7,69.2, 2.2,50.2, 9.3,28.1,
     25.1,16.6, 40.0,1.0, 55.0,5.5, 65.2,12.5],
  ] as const

  // ─── Animation timing (ms) ───────────────────────────────────────────────────

  const INTRO_START_DELAY   = 200
  const TITLE_AFTER_EYEBROW = 180
  const CARDS_AFTER_HEADER  = 460
  const CARD_STAGGER        = 120
  const ENTRANCE_TRANSITION = 700

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  function lerpPoints(from: PointList, to: PointList, t: number): number[] {
    return Array.from(from, (v, i) => lerp(v, to[i], t))
  }

  /**
   * Converts a flat [x0,y0, x1,y1, …] point list into a smooth closed SVG path
   * using Catmull-Rom → cubic Bézier. Divides by 100 for objectBoundingBox (0..1).
   */
  function pointsToPath(pts: number[]): string {
    const n = (pts.length / 2) - 1

    const px = (i: number): number =>
      pts[((i % n) * 2      + pts.length * 100) % pts.length] / 100
    const py = (i: number): number =>
      pts[((i % n) * 2 + 1 + pts.length * 100) % pts.length] / 100

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

  function findSnapSection(el: HTMLElement): HTMLElement {
    let node: HTMLElement | null = el.parentElement
    while (node) {
      if (node.classList.contains('snap-section')) return node
      node = node.parentElement
    }
    return el
  }

  // ─── Pagination ───────────────────────────────────────────────────────────────

  /** Whether the viewport is narrow enough for mobile single-card mode */
  let isMobile = false

  /** Zero-based index of the currently visible page */
  let currentPage = 0

  $: perPage   = isMobile ? CARDS_PER_PAGE_MOBILE : CARDS_PER_PAGE
  $: pageCount = Math.ceil(projects.length / perPage)

  /** The slice of projects shown on the active page */
  $: pageProjects = projects.slice(
    currentPage * perPage,
    currentPage * perPage + perPage,
  )

  function goToPage(idx: number): void {
    if (idx < 0 || idx >= pageCount) return
    if (idx === currentPage) return

    // Reset card visibility so entrance animations replay on new page
    cardVisible = pageProjects.map(() => false)
    popupEnabled = false
    hoveredIndex = null

    currentPage = idx

    // Briefly yield to let Svelte update pageProjects, then replay entrance
    requestAnimationFrame(() => {
      cardVisible = pageProjects.map(() => false)
      schedulePageEntrance()
    })
  }

  function nextPage(): void { goToPage(currentPage + 1) }
  function prevPage(): void { goToPage(currentPage - 1) }

  // ─── Entrance animation state ─────────────────────────────────────────────────

  let eyebrowVisible            = false
  let titleVisible              = false
  /** Per-card visibility — drives .blob--visible; reset on each page change */
  let cardVisible: boolean[]    = projects.slice(0, CARDS_PER_PAGE).map(() => false)

  /**
   * Popup is gated by this flag. Only becomes true after the last card's
   * entrance transition completes — prevents popup appearing mid-animation.
   */
  let popupEnabled = false

  function schedulePageEntrance(): void {
    const count = pageProjects.length
    const cardsStart = 0

    pageProjects.forEach((_, i) => {
      scheduleTimeout(() => {
        cardVisible[i] = true
        cardVisible = [...cardVisible]
      }, cardsStart + i * CARD_STAGGER)
    })

    const lastCardDelay = cardsStart + (count - 1) * CARD_STAGGER
    scheduleTimeout(
      () => { popupEnabled = true },
      lastCardDelay + ENTRANCE_TRANSITION,
    )
  }

  function playAnimation(): void {
    scheduleTimeout(() => { eyebrowVisible = true }, INTRO_START_DELAY)
    scheduleTimeout(() => { titleVisible   = true }, INTRO_START_DELAY + TITLE_AFTER_EYEBROW)

    const cardsStart = INTRO_START_DELAY + TITLE_AFTER_EYEBROW + CARDS_AFTER_HEADER

    pageProjects.forEach((_, i) => {
      scheduleTimeout(() => {
        cardVisible[i] = true
        cardVisible = [...cardVisible]
      }, cardsStart + i * CARD_STAGGER)
    })

    const lastCardDelay = cardsStart + (pageProjects.length - 1) * CARD_STAGGER
    scheduleTimeout(
      () => { popupEnabled = true },
      lastCardDelay + ENTRANCE_TRANSITION,
    )
  }

  function hideImmediately(): void {
    clearAllTimeouts()

    if (container) container.classList.add('no-transition')

    eyebrowVisible = false
    titleVisible   = false
    cardVisible    = pageProjects.map(() => false)
    hoveredIndex   = null
    popupEnabled   = false

    // Stop all playing videos
    videoEls.forEach((v) => { if (v) { v.pause(); v.currentTime = 0 } })

    cardEls.forEach((el) => {
      if (!el) return
      el.style.transform = ''
      el.style.setProperty('--glow', '0')
    })

    requestAnimationFrame(() => {
      if (container) container.classList.remove('no-transition')
    })
  }

  // ─── Pending timeouts ────────────────────────────────────────────────────────

  let pendingTimeouts: ReturnType<typeof setTimeout>[] = []

  function scheduleTimeout(fn: () => void, delay: number): void {
    pendingTimeouts.push(setTimeout(fn, delay))
  }

  function clearAllTimeouts(): void {
    for (const id of pendingTimeouts) clearTimeout(id)
    pendingTimeouts = []
  }

  // ─── Popup state ─────────────────────────────────────────────────────────────

  let hoveredIndex: number | null = null

  let popupX       = 0
  let popupY       = 0
  let cursorX      = 0
  let cursorY      = 0
  let popupTiltX   = 0
  let popupTiltY   = 0
  let popupOpacity = 0

  $: activeProject = hoveredIndex !== null ? pageProjects[hoveredIndex] ?? null : null

  // ─── DOM refs ────────────────────────────────────────────────────────────────

  let container:  HTMLDivElement
  let cardEls:    HTMLElement[]          = []
  let videoEls:   (HTMLVideoElement | null)[] = []
  let popupEl:    HTMLDivElement
  /** One clipPath <path> element per card on the current page */
  let clipPathEls: (SVGPathElement | null)[] = []

  // ─── RAF handles ─────────────────────────────────────────────────────────────

  let rafMouseId:  number
  let rafPopupId:  number
  let rafMaskId:   number

  // ─── Blob mask animation ──────────────────────────────────────────────────────

  const CYCLE_MS = 8000

  function animateMask(timestamp: number): void {
    const total    = BLOB_SHAPES.length
    const progress = (timestamp % CYCLE_MS) / CYCLE_MS
    const segment  = progress * total
    const fromIdx  = Math.floor(segment) % total
    const toIdx    = (fromIdx + 1) % total
    const t        = easeInOut(segment - Math.floor(segment))
    const pts      = lerpPoints(BLOB_SHAPES[fromIdx], BLOB_SHAPES[toIdx], t)
    const d        = pointsToPath(pts)

    clipPathEls.forEach((el) => { if (el) el.setAttribute('d', d) })

    rafMaskId = requestAnimationFrame(animateMask)
  }

  // ─── Mouse 3-D tilt ──────────────────────────────────────────────────────────

  const MAX_DIST = 340

  function onMouseMove(e: MouseEvent): void {
    cursorX = e.clientX
    cursorY = e.clientY

    cancelAnimationFrame(rafMouseId)
    rafMouseId = requestAnimationFrame(() => {
      cardEls.forEach((el) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const cx   = rect.left + rect.width  / 2
        const cy   = rect.top  + rect.height / 2
        const dx   = cursorX - cx
        const dy   = cursorY - cy
        const dist = Math.hypot(dx, dy)

        if (dist < MAX_DIST) {
          const s    = 1 - dist / MAX_DIST
          const rotX = -(dy / rect.height) * 18 * s
          const rotY =  (dx / rect.width)  * 18 * s
          const sc   =   1 + 0.06 * s
          const tx   = dx * 0.06 * s
          const ty   = dy * 0.06 * s
          el.style.transform =
            `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${sc}) translate(${tx}px,${ty}px)`
          el.style.setProperty('--glow', String(s))
        } else {
          el.style.transform = ''
          el.style.setProperty('--glow', '0')
        }
      })
    })
  }

  // ─── Popup RAF loop ───────────────────────────────────────────────────────────

  function tickPopup(): void {
    const LERP_POS     = 0.10
    const LERP_OPACITY = 0.08
    const LERP_TILT    = 0.08
    const MAX_TILT_DEG = 10

    popupX = lerp(popupX, cursorX, LERP_POS)
    popupY = lerp(popupY, cursorY, LERP_POS)

    const opacityTarget = hoveredIndex !== null ? 1 : 0
    popupOpacity = lerp(popupOpacity, opacityTarget, LERP_OPACITY)

    if (popupEl) {
      const pw = popupEl.offsetWidth  || 280
      const ph = popupEl.offsetHeight || 120
      const vw = window.innerWidth
      const vh = window.innerHeight
      const OX = 20
      const OY = -ph - 16

      let x = popupX + OX
      let y = popupY + OY

      if (x + pw > vw - 12) x = popupX - pw - OX
      if (y < 12)           y = popupY + 24
      x = Math.max(12, Math.min(x, vw - pw - 12))
      y = Math.max(12, Math.min(y, vh - ph - 12))

      const pcx = x + pw / 2
      const pcy = y + ph / 2
      const tiltTargetY =  ((cursorX - pcx) / (pw / 2)) * MAX_TILT_DEG
      const tiltTargetX = -((cursorY - pcy) / (ph / 2)) * MAX_TILT_DEG

      popupTiltX = lerp(popupTiltX, tiltTargetX, LERP_TILT)
      popupTiltY = lerp(popupTiltY, tiltTargetY, LERP_TILT)

      const scaleVal = 0.82 + popupOpacity * 0.18
      const blurVal  = (1 - popupOpacity) * 6

      popupEl.style.transform  =
        `translate(${x}px, ${y}px) ` +
        `perspective(600px) rotateX(${popupTiltX}deg) rotateY(${popupTiltY}deg) ` +
        `scale(${scaleVal})`
      popupEl.style.opacity    = String(Math.max(0, Math.min(1, popupOpacity)))
      popupEl.style.filter     = `blur(${blurVal.toFixed(2)}px)`
      popupEl.style.visibility = popupOpacity > 0.01 ? 'visible' : 'hidden'

      const proj = hoveredIndex !== null ? pageProjects[hoveredIndex] : null
      if (proj) {
        popupEl.style.setProperty('--pop-accent', proj.accent2)
      }
    }

    rafPopupId = requestAnimationFrame(tickPopup)
  }

  // ─── Video hover handlers ─────────────────────────────────────────────────────

  function onCardMouseEnter(i: number): void {
    if (!popupEnabled) return

    hoveredIndex = i
    popupX = cursorX
    popupY = cursorY

    const vid = videoEls[i]
    if (vid) {
      vid.currentTime = 0
      vid.play().catch(() => { /* autoplay policy — silently ignored */ })
    }
  }

  function onCardMouseLeave(i: number): void {
    hoveredIndex = null

    const vid = videoEls[i]
    if (vid) {
      vid.pause()
      vid.currentTime = 0
    }
  }

  /**
   * Guard the click from drag
   */
  function onCardClickGuard(e: MouseEvent): void {
  if (dragDidChange) {
    e.preventDefault()
    e.stopPropagation()
    dragDidChange = false
  }
}

  // ─── Drag-to-paginate (desktop) ───────────────────────────────────────────────

  /** Minimum horizontal drag distance (px) to trigger a page change */
  const DRAG_THRESHOLD = 60

  let isDragging       = false
  let dragStartX       = 0
  let dragCurrentX     = 0
  /** True when the drag resolved to a page change — suppresses click events */
  let dragDidChange    = false

  function onPointerDown(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest('.pagination')) return
    isDragging    = true
    dragDidChange = false
    dragStartX    = e.clientX
    dragCurrentX  = e.clientX
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent): void {
    if (!isDragging) return
    dragCurrentX = e.clientX
  }

  function onPointerUp(e: PointerEvent): void {
    if (!isDragging) return
    isDragging = false

    const delta = dragCurrentX - dragStartX
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      dragDidChange = true
      if (delta < 0) nextPage()
      else           prevPage()
    }
  }

  // ─── Touch swipe (mobile) ────────────────────────────────────────────────────

  let touchStartX = 0

  function onTouchStart(e: TouchEvent): void {
    touchStartX = e.touches[0].clientX
  }

  function onTouchEnd(e: TouchEvent): void {
    const delta = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(delta) > 50) {
      if (delta < 0) nextPage()
      else           prevPage()
    }
  }

  // ─── Resize detection ────────────────────────────────────────────────────────

  function checkMobile(): void {
    const was = isMobile
    isMobile = window.innerWidth < 640

    if (was !== isMobile) {
      // Re-page when viewport crosses the breakpoint
      currentPage = 0
      cardVisible = pageProjects.map(() => false)
      schedulePageEntrance()
    }
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  onMount(() => {
    checkMobile()

    const target = findSnapSection(container)

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting) playAnimation()
          else                      hideImmediately()
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(target)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('resize',    checkMobile)

    rafMaskId  = requestAnimationFrame(animateMask)
    rafPopupId = requestAnimationFrame(tickPopup)

    return (): void => {
      clearAllTimeouts()
      observer.disconnect()
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize',    checkMobile)
      cancelAnimationFrame(rafMouseId)
      cancelAnimationFrame(rafPopupId)
      cancelAnimationFrame(rafMaskId)
    }
  })

  onDestroy((): void => {
    if (!browser) return
    clearAllTimeouts()
    cancelAnimationFrame(rafMouseId)
    cancelAnimationFrame(rafPopupId)
    cancelAnimationFrame(rafMaskId)
  })
</script>

<!-- STRUCTURE -->
<div
  class="showcase"
  role="region"
  aria-label="Портфоліо — перегляд проєктів"
  bind:this={container}
  on:pointerdown={onPointerDown}
  on:pointermove={onPointerMove}
  on:pointerup={onPointerUp}
  on:touchstart={onTouchStart}
  on:touchend={onTouchEnd}
>

  <!-- Header -->
  <header class="showcase__header">
    <span class="showcase__eyebrow" class:visible={eyebrowVisible}>портфоліо</span>
    <h2 class="showcase__title" class:visible={titleVisible}>
      Мої <em>роботи</em>
    </h2>
  </header>

  <!-- Card grid -->
  <div class="showcase__grid" class:showcase__grid--mobile={isMobile}>
    {#each pageProjects as project, i (project.id)}
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        class="blob blob--has-link"
        role="button"
        tabindex="0"
        aria-label={project.name}
        class:blob--visible={cardVisible[i]}
        bind:this={cardEls[i]}
        style="
          --accent1: {project.accent1};
          --accent2: {project.accent2};
          --rx: {project.rx};
          --ry: {project.ry};
          --dur: {project.morphDuration}s;
          --del: {project.morphDelay}s;
          --glow: 0;
        "
        on:click={onCardClickGuard}
        on:mouseenter={() => onCardMouseEnter(i)}
        on:mouseleave={() => onCardMouseLeave(i)}
        on:focus={() => onCardMouseEnter(i)}
        on:blur={() => onCardMouseLeave(i)}
      >
        <div class="blob__body"></div>
        <div class="blob__shine"></div>
        <div class="blob__ring"></div>

        <!--
          Hidden SVG — registers a unique clipPath per card.
          Id is card-scoped to avoid collisions when multiple cards render.
          clipPathUnits="objectBoundingBox" → mask auto-scales with the element.
        -->
        <svg class="blob__mask-svg" aria-hidden="true">
          <defs>
            <clipPath
              id="showcase-clip-{project.id}"
              clipPathUnits="objectBoundingBox"
            >
              <path bind:this={clipPathEls[i]} d="" />
            </clipPath>
          </defs>
        </svg>

        <!--
          Video fills the blob, clipped by the animated SVG mask.
          Paused by default — plays on hover via JS.
          poster shows a static frame while paused.
          muted + playsinline required for autoplay policy compliance.
        -->
        <div class="blob__inner blob__inner--video">
          <video
            class="blob__video"
            style="clip-path: url(#showcase-clip-{project.id})"
            bind:this={videoEls[i]}
            src={project.video}
            poster={project.poster}
            muted
            playsinline
            loop
            preload="metadata"
            aria-hidden="true"
          ></video>


        </div>
      </a>
    {/each}
  </div>

  <!-- Pagination dots -->
  {#if pageCount > 1}
    <nav class="pagination" aria-label="Сторінки проєктів">
      {#each { length: pageCount } as _, i}
        <button
          class="pagination__dot"
          class:pagination__dot--active={i === currentPage}
          on:click={() => goToPage(i)}
          aria-label="Сторінка {i + 1}"
          aria-current={i === currentPage ? 'page' : undefined}
        ></button>
      {/each}
    </nav>
  {/if}

  <!--
    Cursor-following popup — identical architecture to Stack.svelte.
    All visual state driven by tickPopup RAF loop.
  -->
  <div
    class="popup"
    bind:this={popupEl}
    aria-hidden="true"
  >
    {#if activeProject}
      <p class="popup__name">{activeProject.name}</p>
      <p class="popup__summary">{activeProject.summary}</p>
      <div class="popup__tags">
        {#each activeProject.tags as tag (tag)}
          <span class="popup__tag">{tag}</span>
        {/each}
      </div>
    {/if}
  </div>

</div>

<!-- STYLE -->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700&family=Onest:wght@300;400;500&display=swap');

  /* ── Transition kill ── */
  .showcase.no-transition *,
  .showcase.no-transition {
    transition: none !important;
    animation-play-state: paused !important;
  }

  /* ── Root layout ── */
  .showcase {
    width: 100%;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    padding: 3.5rem 2rem 1.5rem;
    box-sizing: border-box;
    gap: 1rem;
    overflow: hidden;
    position: relative;
    z-index: 10;
    font-family: 'Onest', sans-serif;
    /* Prevent text selection during drag */
    user-select: none;
  }

  /* ── Header ── */
  .showcase__header {
    text-align: center;
    flex-shrink: 0;
  }

  .showcase__eyebrow {
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

  .showcase__eyebrow.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .showcase__title {
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

  .showcase__title.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .showcase__title em {
    font-style: normal;
    background: linear-gradient(135deg, #a0c4ff 0%, #bde0fe 50%, #cdb4db 100%);
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
  .showcase__grid {
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

  /* Mobile: single card centred */
  .showcase__grid--mobile {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    max-width: 360px;
  }

  /* ── Blob card ── */
  .blob {
    position: relative;
    will-change: transform, opacity, filter;
    cursor: default;
    min-height: 0;

    opacity: 0;
    transform: scale(0.55);
    filter: blur(14px);

    transition:
      opacity   0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      filter    0.6s ease;
  }

  .blob--visible {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);

    transition:
      opacity   0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.1s ease,
      filter    0.6s ease;
  }

  /* Cursor changes only for cards with a URL */
  .blob--has-link {
    cursor: pointer;
  }

  /* Glass body — frosted, semi-transparent */
  .blob__body {
    position: absolute;
    inset: 0;
    border-radius: var(--rx) / var(--ry);
    /* Very subtle tinted fill — lets the Background gradient show through */
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px) saturate(1.4);
    -webkit-backdrop-filter: blur(12px) saturate(1.4);
    animation: morph var(--dur) ease-in-out var(--del) infinite alternate;
    transition: border-radius 0.9s ease, box-shadow 0.3s ease, background 0.35s ease;
    z-index: 0;
  }

  .blob:hover .blob__body,
  .blob:focus-visible .blob__body {
    animation-play-state: paused;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.10);
    box-shadow:
      0 0 40px 8px color-mix(in srgb, var(--accent2) 30%, transparent 70%),
      inset 0 1px 0 rgba(255,255,255,0.18);
  }

  @keyframes morph {
    0%   { border-radius: var(--rx) / var(--ry); }
    33%  { border-radius: 50% 30% 65% 35% / 35% 65% 30% 50%; }
    66%  { border-radius: 30% 70% 40% 60% / 60% 40% 70% 30%; }
    100% { border-radius: var(--ry) / var(--rx); }
  }

  /* Ring — thin luminous glass border */
  .blob__ring {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    /* 1px border via box-shadow — inherits blob morph shape exactly */
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.18),
      inset 0 1px 0 rgba(255,255,255,0.28);
    z-index: 3;
    opacity: calc(0.5 + var(--glow) * 0.5);
    animation: morph var(--dur) ease-in-out calc(var(--del) - 0.4s) infinite alternate;
    pointer-events: none;
    transition: opacity 0.15s ease;
  }

  /* Shine */
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

  /* Hidden SVG mask — takes no space */
  .blob__mask-svg {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }

  /* ── Video inner ── */
  .blob__inner--video {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: hidden;
  }

  /*
    Video fills the entire card and is clipped by the animated SVG mask
    (clip-path: url(#showcase-clip-{id}) applied inline).
    object-fit: cover prevents letterboxing.
    opacity transitions: 0.5 paused → 1.0 playing for a subtle "reveal" effect.
  */
  .blob__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    /* Slightly dimmed on pause so the glass tint reads clearly */
    opacity: 0.45;
    transition: opacity 0.4s ease;
  }

  .blob:hover .blob__video,
  .blob:focus-visible .blob__video {
    opacity: 0.85;
  }



  /* ── Pagination ── */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    padding: 0.4rem 0;
  }

  .pagination__dot {
    appearance: none;
    border: none;
    padding: 0;
    background: rgba(255,255,255,0.25);
    border-radius: 50%;
    width: 8px;
    height: 8px;
    cursor: pointer;
    transition:
      background  0.25s ease,
      transform   0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      width       0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .pagination__dot:hover {
    background: rgba(255,255,255,0.55);
    transform: scale(1.25);
  }

  /* Active dot stretches into a pill */
  .pagination__dot--active {
    background: #fff;
    width: 24px;
    border-radius: 100px;
    transform: none;
  }

  /* ── Popup ── */
  .popup {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    width: max-content;
    max-width: 300px;
    min-width: 200px;
    pointer-events: none;

    background: rgba(16, 14, 24, 0.80);
    backdrop-filter: blur(20px) saturate(1.6);
    -webkit-backdrop-filter: blur(20px) saturate(1.6);
    border-radius: 18px;
    padding: 1rem 1.2rem;

    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--pop-accent, #fff) 35%, transparent 65%),
      inset 0 0 0 1px color-mix(in srgb, var(--pop-accent, #fff) 8%, transparent 92%),
      0 12px 40px rgba(0,0,0,0.55),
      0 3px 10px rgba(0,0,0,0.35);

    transform-style: preserve-3d;
    transform-origin: center bottom;

    opacity: 0;
    visibility: hidden;
  }

  .popup__name {
    font-family: 'Unbounded', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.02em;
    margin: 0 0 0.45rem;
    color: color-mix(in srgb, var(--pop-accent, #fff) 90%, white 10%);
    text-shadow: 0 0 12px color-mix(in srgb, var(--pop-accent, #fff) 40%, transparent 60%);
  }

  .popup__summary {
    font-family: 'Onest', sans-serif;
    font-size: 0.78rem;
    line-height: 1.6;
    color: rgba(255,255,255,0.72);
    margin: 0 0 0.6rem;
    font-weight: 300;
  }

  .popup__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin-bottom: 0.55rem;
  }

  .popup__tag {
    font-size: 0.65rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    padding: 0.2em 0.65em;
    border-radius: 100px;
    background: color-mix(in srgb, var(--pop-accent, #fff) 18%, transparent 82%);
    border: 1px solid color-mix(in srgb, var(--pop-accent, #fff) 35%, transparent 65%);
    color: rgba(255,255,255,0.85);
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .showcase {
      padding: 3.5rem 1rem 1rem;
      gap: 0.75rem;
    }
  }
</style>