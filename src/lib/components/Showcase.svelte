<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { projects } from '$lib/data/showcase'
  import {
    findSnapSection,
    observeSection,
    createTimeoutQueue,
    createCardTiltHandler,
    resetCardTilts,
    startBlobMaskAnimation,
    startPopupLoop,
  } from '$lib/utils/animation'
  import SectionHeader from '$lib/components/SectionHeader.svelte'

  const PER_PAGE        = 4
  const PER_PAGE_MOBILE = 1
  const INTRO_DELAY     = 200
  const TITLE_DELAY     = 180
  const CARDS_DELAY     = 460
  const CARD_STAGGER    = 120
  const ENTRANCE_MS     = 700
  const DRAG_THRESHOLD  = 60

  let eyebrowVisible         = false
  let titleVisible           = false
  let cardVisible: boolean[] = []
  let popupEnabled           = false
  let hintVisible            = false
  let hoveredIndex: number | null = null

  let isMobile    = false
  let currentPage = 0
  let pageDir: -1 | 1 = -1

  let cursorX = 0, cursorY = 0

  let container:   HTMLDivElement
  let cardEls:     HTMLElement[]              = []
  let videoEls:    (HTMLVideoElement | null)[] = []
  let popupEl:     HTMLDivElement
  let clipPathEls: (SVGPathElement | null)[]  = []

  const queue = createTimeoutQueue()

  $: perPage       = isMobile ? PER_PAGE_MOBILE : PER_PAGE
  $: pageCount     = Math.ceil(projects.length / perPage)
  $: pageProjects  = projects.slice(currentPage * perPage, currentPage * perPage + perPage)
  $: activeProject = hoveredIndex !== null ? pageProjects[hoveredIndex] ?? null : null

  function goToPage(idx: number): void {
    if (idx < 0 || idx >= pageCount || idx === currentPage) return
    pageDir      = idx > currentPage ? -1 : 1
    hoveredIndex = null
    popupEnabled = false
    currentPage  = idx
    requestAnimationFrame(() => {
      cardVisible = pageProjects.map(() => false)
      schedulePageEntrance()
    })
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

  function schedulePageEntrance(): void {
    pageProjects.forEach((_, i) => {
      queue.schedule(() => { cardVisible[i] = true; cardVisible = [...cardVisible] }, i * CARD_STAGGER)
    })
    const lastStart = (pageProjects.length - 1) * CARD_STAGGER
    queue.schedule(() => { popupEnabled = true }, lastStart + ENTRANCE_MS)
  }

  function playAnimation(): void {
    queue.schedule(() => { eyebrowVisible = true }, INTRO_DELAY)
    queue.schedule(() => { hintVisible    = true }, INTRO_DELAY + 800)
    queue.schedule(() => { titleVisible   = true }, INTRO_DELAY + TITLE_DELAY)

    const cardsStart = INTRO_DELAY + TITLE_DELAY + CARDS_DELAY
    pageProjects.forEach((_, i) => {
      queue.schedule(() => { cardVisible[i] = true; cardVisible = [...cardVisible] }, cardsStart + i * CARD_STAGGER)
    })
    const lastStart = cardsStart + (pageProjects.length - 1) * CARD_STAGGER
    queue.schedule(() => { popupEnabled = true }, lastStart + ENTRANCE_MS)
  }

  function hideImmediately(): void {
    queue.clear()
    container?.classList.add('no-transition')
    eyebrowVisible = false
    titleVisible   = false
    cardVisible    = pageProjects.map(() => false)
    hoveredIndex   = null
    popupEnabled   = false
    hintVisible    = false
    videoEls.forEach((v) => { if (v) { v.pause(); v.currentTime = 0 } })
    resetCardTilts(cardEls)
    requestAnimationFrame(() => container?.classList.remove('no-transition'))
  }

  const tiltHandler = createCardTiltHandler(() => cardEls, { maxRot: 18 })

  function onMouseMove(e: MouseEvent): void {
    cursorX = e.clientX; cursorY = e.clientY
    tiltHandler(e)
  }

  function onCardEnter(i: number): void {
    if (!popupEnabled) return
    hoveredIndex = i
    videoEls[i]?.play().catch(() => {})
  }

  function onCardLeave(i: number): void {
    hoveredIndex = null
    const v = videoEls[i]
    if (v) { v.pause(); v.currentTime = 0 }
  }

  let isDragging    = false
  let dragStartX    = 0
  let dragCurrentX  = 0
  let dragDidChange = false

  function onGridPointerDown(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest('.pagination')) return
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
      dragDidChange = true; hintVisible = false
      delta < 0 ? nextPage() : prevPage()
    } else {
      dragDidChange = false
    }
  }

  function onLinkClick(e: MouseEvent): void {
    if (dragDidChange) { e.preventDefault(); dragDidChange = false }
  }

  let touchStartX = 0
  const onTouchStart = (e: TouchEvent) => { touchStartX = e.touches[0].clientX }
  const onTouchEnd   = (e: TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(delta) > 50) delta < 0 ? nextPage() : prevPage()
  }

  function checkMobile(): void {
    const was = isMobile
    isMobile = window.innerWidth < 640
    if (was !== isMobile) {
      currentPage = 0
      cardVisible = pageProjects.map(() => false)
      schedulePageEntrance()
    }
  }

  let stopMask:     () => void
  let stopPopup:    () => void
  let stopObserver: () => void

  onMount(() => {
    checkMobile()
    stopMask  = startBlobMaskAnimation(() => clipPathEls)
    stopPopup = startPopupLoop(
      () => popupEl,
      () => ({ x: cursorX, y: cursorY }),
      () => hoveredIndex !== null,
      () => hoveredIndex !== null ? (pageProjects[hoveredIndex]?.accent2 ?? null) : null,
    )
    stopObserver = observeSection(findSnapSection(container), playAnimation, hideImmediately)
    window.addEventListener('mousemove',   onMouseMove)
    window.addEventListener('resize',      checkMobile)
    window.addEventListener('pointermove', onWindowPointerMove)
    window.addEventListener('pointerup',   onWindowPointerUp)
    return () => {
      queue.clear(); stopMask(); stopPopup(); stopObserver()
      window.removeEventListener('mousemove',   onMouseMove)
      window.removeEventListener('resize',      checkMobile)
      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup',   onWindowPointerUp)
    }
  })

  onDestroy(() => {
    if (!browser) return
    queue.clear(); stopMask?.(); stopPopup?.()
  })
</script>

<!-- STRUCTURE -->
<div
  class="showcase"
  role="region"
  aria-label="Портфоліо — перегляд проєктів"
  bind:this={container}
>

  <SectionHeader
    eyebrow="портфоліо"
    eyebrowColor='#171717'
    eyebrowBorder='#171717'
    titleColor='#171717'
    gradient="linear-gradient(90deg, #fcff9e 0%, #c67700 100%)"
    visible={eyebrowVisible}
    titleVisible={titleVisible}
  >
    Мої <em>роботи</em>
  </SectionHeader>

  <!-- Pagination sits directly under the header, centered -->
  {#if pageCount > 1}
    <nav class="pagination" aria-label="Сторінки проєктів">
      {#each { length: pageCount } as _, i}
        <button
          class="pagination__dot"
          class:pagination__dot--active={i === currentPage}
          on:click={() => { goToPage(i); hintVisible = false }}
          aria-label="Сторінка {i + 1}"
          aria-current={i === currentPage ? 'page' : undefined}
        ></button>
      {/each}
    </nav>
  {/if}

  <div
    class="showcase__grid"
    class:showcase__grid--mobile={isMobile}
    style="--slide-dir: {pageDir}"
    on:pointerdown={onGridPointerDown}
    on:touchstart={onTouchStart}
    on:touchend={onTouchEnd}
    role="list"
    aria-label="Проєкти"
  >
    {#each pageProjects as project, i (project.id)}
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        class="blob blob--has-link"
        aria-label={project.name}
        class:blob--visible={cardVisible[i]}
        bind:this={cardEls[i]}
        style="
          --accent1: {project.accent1}; --accent2: {project.accent2};
          --rx: {project.rx}; --ry: {project.ry};
          --dur: {project.morphDuration}s; --del: {project.morphDelay}s;
          --glow: 0;
        "
        on:click={onLinkClick}
        on:mouseenter={() => onCardEnter(i)}
        on:mouseleave={() => onCardLeave(i)}
        on:focus={() => onCardEnter(i)}
        on:blur={() => onCardLeave(i)}
      >
        <div class="blob__body"></div>
        <div class="blob__shine"></div>
        <div class="blob__ring"></div>

        <svg class="blob__mask-svg" aria-hidden="true">
          <defs>
            <clipPath id="showcase-clip-{project.id}" clipPathUnits="objectBoundingBox">
              <path bind:this={clipPathEls[i]} d="" />
            </clipPath>
          </defs>
        </svg>

        <div class="blob__inner blob__inner--video">
          <video
            class="blob__video"
            style="clip-path: url(#showcase-clip-{project.id})"
            bind:this={videoEls[i]}
            src={project.video}
            poster={project.poster}
            muted playsinline loop preload="metadata"
            aria-hidden="true"
          ></video>
        </div>
      </a>
    {/each}
  </div>

  <div class="popup" bind:this={popupEl} aria-hidden="true">
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

<style>
  @import '$lib/styles/blob-card.css';

  .showcase {
    width: 100%;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto auto 1fr;
    padding: 3.5rem 2rem 1.5rem;
    box-sizing: border-box;
    gap: 0.6rem;
    overflow: hidden;
    position: relative;
    z-index: 10;
    font-family: 'Onest', sans-serif;
    user-select: none;
  }

  /* ── Pagination — horizontal row under header ── */
  .pagination {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    padding: 0.45rem 0.9rem;
    background: rgba(0, 0, 0, 0.06);
    backdrop-filter: blur(8px);
    border-radius: 100px;
    border: 1px solid rgba(0, 0, 0, 0.08);
    /* self-center so it doesn't stretch full width */
    justify-self: center;
    z-index: 20;
  }

  .pagination__dot {
    appearance: none; border: none; padding: 0;
    background: rgba(0, 0, 0, 0.22);
    border-radius: 50%;
    width: 7px; height: 7px;
    cursor: pointer;
    transition:
      background  0.25s ease,
      transform   0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      width       0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .pagination__dot:hover { background: rgba(0, 0, 0, 0.5); transform: scale(1.3); }
  .pagination__dot--active { background: #171717; width: 22px; border-radius: 100px; transform: none; }

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

  .showcase__grid--mobile {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    max-width: 360px;
  }

  .showcase__grid .blob { --tx-enter: calc(var(--slide-dir, -1) * -40px); cursor: pointer; min-height: 0; z-index: 999; }
  .showcase__grid .blob:not(.blob--visible) { transform: scale(0.55) translateX(var(--tx-enter, -40px)); }

  .blob__body {
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(12px) saturate(1.4);
    -webkit-backdrop-filter: blur(12px) saturate(1.4);
    transition: border-radius 0.9s ease, box-shadow 0.3s ease, background 0.35s ease;
  }

  .blob:hover .blob__body,
  .blob:focus-visible .blob__body {
    background: rgba(255,255,255,0.10);
    box-shadow:
      0 0 40px 8px color-mix(in srgb, var(--accent2) 30%, transparent 70%),
      inset 0 1px 0 rgba(255,255,255,0.18);
  }

  .blob__ring {
    inset: 0;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,0.18),
      inset 0 1px 0 rgba(255,255,255,0.28);
    z-index: 3;
  }

  .blob__mask-svg { position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none; }

  .blob__inner--video { position: absolute; inset: 0; z-index: 2; overflow: hidden; }

  .blob__video {
    position: absolute;
    inset: 0; width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    opacity: 0.45;
    transition: opacity 0.4s ease;
  }

  .blob:hover .blob__video,
  .blob:focus-visible .blob__video { opacity: 0.85; }

  .popup__summary { margin-bottom: 0.6rem; }
  .popup__tags { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-bottom: 0.55rem; }

  .popup__tag {
    font-size: 0.65rem; font-weight: 500; letter-spacing: 0.06em;
    padding: 0.2em 0.65em; border-radius: 100px;
    background: color-mix(in srgb, var(--pop-accent, #fff) 18%, transparent 82%);
    border: 1px solid color-mix(in srgb, var(--pop-accent, #fff) 35%, transparent 65%);
    color: rgba(255,255,255,0.85);
  }

  @media (max-width: 640px) {
    .showcase { padding: 3.5rem 1rem 1rem; gap: 0.5rem; }
    .pagination { gap: 0.4rem; padding: 0.35rem 0.7rem; }
    .pagination__dot { width: 6px; height: 6px; }
    .pagination__dot--active { width: 18px; }
  }
</style>