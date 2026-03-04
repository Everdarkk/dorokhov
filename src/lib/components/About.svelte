<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import photo from '$lib/assets/images/od.webp'
  import { cards } from '$lib/data/cards'
  import {
    findSnapSection,
    observeSection,
    createCardTiltHandler,
    resetCardTilts,
    startBlobMaskAnimation,
  } from '$lib/utils/animation'
  import { sectionAnimation } from '$lib/utils/sectionAnimation'
  import SectionHeader from '$lib/components/SectionHeader.svelte'
  import Pagination    from '$lib/components/Pagination.svelte'

  // ─── Constants ────────────────────────────────────────────────────────────

  const SLIDE_OUT_MS   = 300
  const DRAG_THRESHOLD = 50

  // ─── Reactive state ───────────────────────────────────────────────────────

  let eyebrowVisible         = false
  let titleVisible           = false
  let cardVisible: boolean[] = cards.map(() => false)

  // Mobile swipe state
  let isMobile    = false
  let currentPage = 0          // active card index on mobile (0 = cards[0])
  let pageDir: -1 | 1 = -1
  let slideOut    = false

  // On mobile: show only the current card. On desktop: show all.
  $: visibleCards = isMobile ? [cards[currentPage]] : cards
  $: pageCount    = isMobile ? cards.length : 1

  // ─── DOM refs ──────────────────────────────────────────────────────────────

  let container:  HTMLDivElement
  let cardEls:    HTMLElement[]         = []
  let clipPathEl: SVGPathElement | null = null

  // ─── Animation composable ─────────────────────────────────────────────────

  const anim = sectionAnimation(
    cards,
    { introDelay: 200, titleDelay: 180, cardsDelay: 480, cardStagger: 140, entranceMs: 600 },
    (s) => {
      eyebrowVisible = s.eyebrowVisible
      titleVisible   = s.titleVisible
      cardVisible    = s.cardVisible
    },
  )

  // ─── Entrance / hide ──────────────────────────────────────────────────────

  function playAnimation(): void {
    // Mobile: animate only 1 card; desktop: animate all cards
    anim.play(isMobile ? 1 : cards.length)
  }

  function hideImmediately(): void {
    anim.hide(isMobile ? 1 : cards.length, container)
    resetCardTilts(cardEls)
  }

  // ─── Mobile page navigation ───────────────────────────────────────────────

  function goToPage(idx: number): void {
    if (idx < 0 || idx >= pageCount || idx === currentPage) return
    pageDir  = idx > currentPage ? -1 : 1
    slideOut = true
    anim.queue.clear()

    anim.queue.schedule(() => {
      slideOut    = false
      currentPage = idx
      // Reset then fade-in the new card
      cardVisible = [false]
      anim.queue.schedule(() => { cardVisible = [true] }, 60)
    }, SLIDE_OUT_MS)
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  // ─── Touch / drag ─────────────────────────────────────────────────────────

  let touchStartX   = 0
  let dragStartX    = 0
  let dragCurrentX  = 0
  let isDragging    = false
  let dragDidChange = false

  const onTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX }
  const onTouchEnd   = (e: TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(delta) > DRAG_THRESHOLD) delta < 0 ? nextPage() : prevPage()
  }

  function onPointerDown(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest('nav')) return
    if (e.button !== 0 && e.pointerType === 'mouse') return
    isDragging = true; dragDidChange = false
    dragStartX = e.clientX; dragCurrentX = e.clientX
  }

  function onWindowPointerMove(e: PointerEvent): void {
    if (isDragging) dragCurrentX = e.clientX
  }

  function onWindowPointerUp(): void {
    if (!isDragging) return
    isDragging = false
    const delta = dragCurrentX - dragStartX
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      dragDidChange = true
      delta < 0 ? nextPage() : prevPage()
    }
  }

  // ─── Mouse tilt (desktop) ─────────────────────────────────────────────────

  const onMouseMove = createCardTiltHandler(() => cardEls, { maxRot: 20, maxScale: 0.07, maxTx: 0.07 })

  // ─── Responsive ───────────────────────────────────────────────────────────

  function checkMobile(): void {
    const was = isMobile
    isMobile   = window.innerWidth < 800
    if (was !== isMobile) {
      currentPage = 0
      // Re-run entrance for new layout
      anim.queue.clear()
      anim.play(isMobile ? 1 : cards.length)
    }
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  let stopMask:     () => void
  let stopObserver: () => void
  let isTouchDevice = false

  onMount(() => {
    isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    checkMobile()

    stopMask     = startBlobMaskAnimation(() => [clipPathEl])
    stopObserver = observeSection(findSnapSection(container), playAnimation, hideImmediately)

    if (!isTouchDevice) window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('resize',      checkMobile)
    window.addEventListener('pointermove', onWindowPointerMove)
    window.addEventListener('pointerup',   onWindowPointerUp)

    return () => {
      anim.queue.clear(); stopMask(); stopObserver()
      if (!isTouchDevice) window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize',      checkMobile)
      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup',   onWindowPointerUp)
    }
  })

  onDestroy(() => {
    if (!browser) return
    anim.queue.clear(); stopMask?.()
  })
</script>

<!-- STRUCTURE -->
<div class="about" bind:this={container}>

  <SectionHeader
    eyebrow="про мене"
    gradient="linear-gradient(135deg, #e2103a 0%, #ff6b6b 50%, #c2002a 100%)"
    visible={eyebrowVisible}
    titleVisible={titleVisible}
  >
    Олександр<br /><em>Веб-розробник</em>
  </SectionHeader>

  <!-- Pagination dots — mobile only -->
  {#if isMobile}
    <Pagination
      count={pageCount}
      current={currentPage}
      dotColor="#e2103a"
      trackColor="rgba(226,16,58,0.22)"
      on:change={(e) => goToPage(e.detail)}
    />
  {/if}

  <!-- Card area -->
  <div
    class="about__grid"
    class:about__grid--mobile={isMobile}
    style="--slide-dir: {pageDir}"
    on:pointerdown={onPointerDown}
    on:touchstart={onTouchStart}
    on:touchend={onTouchEnd}
    role="list"
    aria-label="Про мене — картки"
  >
    {#each visibleCards as card, i (card.id)}
      <article
        class="blob"
        class:blob--photo={card.type === 'photo'}
        class:blob--visible={cardVisible[i]}
        class:blob--mobile={isMobile}
        class:blob--slide-out={slideOut && isMobile}
        bind:this={cardEls[i]}
        style="
          --accent1: {card.accent1}; --accent2: {card.accent2};
          --rx: {card.rx}; --ry: {card.ry};
          --dur: {card.morphDuration}s; --del: {card.morphDelay}s;
          --glow: 0;
        "
        role="region"
        aria-label={card.title ?? 'Фото'}
      >
        <div
          class="blob__body"
          style="background: radial-gradient(ellipse at 35% 30%, color-mix(in srgb, var(--accent2) 65%, white 35%) 0%, var(--accent1) 45%, color-mix(in srgb, var(--accent1) 55%, black 45%) 100%)"
        ></div>
        <div class="blob__shine"></div>
        <div
          class="blob__ring"
          style="background: conic-gradient(from 0deg, var(--accent2), transparent 30%, var(--accent1) 60%, transparent 80%, var(--accent2))"
        ></div>

        <div class="blob__inner">
          {#if card.type === 'photo'}
            <svg class="blob__mask-svg" aria-hidden="true">
              <defs>
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
                <p class="blob__line" class:blob__line--mobile={isMobile}>
                  {#if line.icon}
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

<style>
  @import '$lib/styles/blob-card.css';

  /* ── Section ─────────────────────────────────────────────────────────────── */
  .about {
    width: 100%;
    height: 100dvh;
    display: grid;
    /* rows: header | cards  (pagination injected on mobile via grid-row) */
    grid-template-rows: auto 1fr;
    padding: 2rem 2rem 2rem;
    box-sizing: border-box;
    gap: 1.5rem;
    overflow: hidden;
    position: relative;
    z-index: 10;
  }

  /* When pagination is rendered, we have 3 rows */
  :global(.about:has(.pagination)) {
    grid-template-rows: auto auto 1fr;
    gap: 0.6rem;
  }

  /* ── Desktop: 2×2 grid ───────────────────────────────────────────────────── */
  .about__grid {
    display: grid;
    place-content: center;
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 1.2rem;
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    height: 100%;
    min-height: 0;
    user-select: none;
  }

  /* ── Mobile: single card ─────────────────────────────────────────────────── */
  .about__grid--mobile {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    max-width: min(440px, calc(100vw - 1.7rem));
    place-items: center;
    justify-self: center;
    overflow: hidden;
    height: 100%;
    padding: 1rem;
  }

  /* ── Blob transition (shared entrance) ───────────────────────────────────── */
  .blob {
    transition:
      opacity   0.55s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
      filter    0.45s ease;
  }

  .blob--mobile {
    pointer-events: none;
  }

  /* Desktop hidden state — slides up */
  .about__grid:not(.about__grid--mobile) .blob:not(.blob--visible) {
    opacity: 0;
    transform: scale(0.84) translateY(24px);
    filter: blur(4px);
  }

  /* Mobile hidden state — slides from direction */
  .about__grid--mobile .blob:not(.blob--visible):not(.blob--slide-out) {
    opacity: 0;
    transform: scale(0.84) translateX(calc(var(--slide-dir, -1) * -70px));
    filter: blur(4px);
  }

  /* Mobile slide-out */
  .about__grid--mobile .blob.blob--slide-out {
    opacity: 0;
    transform: scale(0.84) translateX(calc(var(--slide-dir, -1) * 90px));
    filter: blur(5px);
    transition:
      opacity   0.26s ease-in,
      transform 0.26s ease-in,
      filter    0.20s ease-in;
    pointer-events: none;
  }

  /* ── Card inner ──────────────────────────────────────────────────────────── */
  .blob__inner {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    padding: 1.4rem 1.5rem;
    box-sizing: border-box;
  }

  .blob__title {
    font-family: 'Unbounded', sans-serif;
    font-size: clamp(1rem, 1.4vw, 1.4rem);
    font-weight: 700;
    color: #fff;
    margin: 0 0 0.2rem;
    text-align: center;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
  }

  .lines {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    width: 80%;
  }

  .blob__line {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: clamp(0.82rem, 1.1vw, 1.05rem);
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    font-weight: 300;
    text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4);
  }

  .blob__line-icon {
    flex-shrink: 0;
    width: 1.15em;
    height: 1.15em;
    object-fit: contain;
    filter: brightness(0) invert(1);
    opacity: 0.85;
  }

  /* ── Photo blob ──────────────────────────────────────────────────────────── */
  .blob--photo .blob__inner {
    padding: 0;
    position: relative;
  }

  .blob__mask-svg {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }

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

  .blob:hover .blob__body {
    box-shadow: 0 0 70px 12px color-mix(in srgb, var(--accent2) 55%, transparent 45%);
  }

  /* ── Tablet ──────────────────────────────────────────────────────────────── */
  @media (max-height: 1000px) {
    .about__grid { place-self: center; place-items: center; height: fit-content; }
    .blob__body, .blob__ring, .blob__inner, .blob {
      height: clamp(18rem, 10vw, 23rem);
      width: clamp(20rem, 25vw, 26rem);
    }
    .blob__inner { gap: 0.5rem; }
    .blob__title { font-size: 1rem; }
    .blob__line  { font-size: 0.8rem; }
    .blob__photo { object-position: center; }
  }

  /* ── Mobile ──────────────────────────────────────────────────────────────── */
  @media (max-width: 800px) {
    .about {
      padding: 0.85rem 0.85rem;
      gap: 0.5rem;
      grid-template-rows: auto auto 1fr;
    }

    /* Single card: nice large size, centred */
    .about__grid--mobile .blob,
    .about__grid--mobile .blob__body,
    .about__grid--mobile .blob__ring,
    .about__grid--mobile .blob__inner {
      width:  min(88vw, 380px);
      height: min(72dvh, 480px);
    }

    .blob__title { font-size: clamp(0.95rem, 3.8vw, 1.2rem); text-align: center; }
    .blob__line  { font-size: clamp(0.78rem, 3vw, 0.95rem); }
    .blob__line-icon { width: 1em; height: 1em; }
    .blob__photo { object-position: center; }
  }

  @media (max-width: 480px) {
    .about { padding-top: 0.75rem; }
    .about__grid--mobile .blob,
    .about__grid--mobile .blob__body,
    .about__grid--mobile .blob__ring,
    .about__grid--mobile .blob__inner {
      width:  min(92vw, 340px);
      height: min(68dvh, 420px);
    }
    .blob__title { font-size: clamp(0.88rem, 4vw, 1.05rem); }
    .blob__line  { font-size: clamp(0.72rem, 3.2vw, 0.88rem); }
    .blob__inner { gap: 0.6rem; padding: 1.1rem 1rem; }
  }

  @media (max-width: 360px) {
    .about__grid--mobile .blob,
    .about__grid--mobile .blob__body,
    .about__grid--mobile .blob__ring,
    .about__grid--mobile .blob__inner {
      width:  92vw;
      height: min(65dvh, 360px);
    }
    .blob__title { font-size: 0.82rem; }
    .blob__line  { font-size: 0.68rem; }
  }
</style>