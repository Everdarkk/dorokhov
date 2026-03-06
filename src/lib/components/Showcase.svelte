<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { projects } from '$lib/data/showcase'
  import {
    findSnapSection,
    observeSection,
    createCardTiltHandler,
    resetCardTilts,
    startBlobMaskAnimation,
    startPopupLoop,
  } from '$lib/utils/animation'
  import { sectionAnimation } from '$lib/utils/sectionAnimation'
  import SectionHeader from '$lib/components/SectionHeader.svelte'
  import Pagination    from '$lib/components/Pagination.svelte'

  const PER_PAGE        = 4
  const PER_PAGE_MOBILE = 1
  const CARD_STAGGER    = 120
  const ENTRANCE_MS     = 700
  const SLIDE_OUT_MS    = 320
  const DRAG_THRESHOLD  = 60

  let eyebrowVisible         = false
  let titleVisible           = false
  let cardVisible: boolean[] = []
  let popupEnabled           = false
  let hoveredIndex: number | null = null

  let isMobile    = false
  let currentPage = 0
  let pageDir: -1 | 1 = -1
  let slideOut    = false

  let cursorX = 0, cursorY = 0

  let container:   HTMLDivElement
  let cardEls:     HTMLElement[]               = []
  let videoEls:    (HTMLVideoElement | null)[] = []
  let popupEl:     HTMLDivElement
  let clipPathEls: (SVGPathElement | null)[]   = []

  $: perPage      = isMobile ? PER_PAGE_MOBILE : PER_PAGE
  $: pageCount    = Math.ceil(projects.length / perPage)
  $: pageProjects = projects.slice(currentPage * perPage, currentPage * perPage + perPage)
  $: activeProject = hoveredIndex !== null ? pageProjects[hoveredIndex] ?? null : null

  const anim = sectionAnimation(
    projects,
    { introDelay: 200, titleDelay: 180, cardsDelay: 460, cardStagger: CARD_STAGGER, entranceMs: ENTRANCE_MS },
    (s) => {
      eyebrowVisible = s.eyebrowVisible
      titleVisible   = s.titleVisible
      cardVisible    = s.cardVisible
      popupEnabled   = s.popupEnabled
    },
  )

  function schedulePageEntrance(): void {
    const perPageCount = pageProjects.length
    cardVisible = Array(perPageCount).fill(false)

    for (let i = 0; i < perPageCount; i++) {
      const idx = i
      anim.queue.schedule(() => {
        const next = [...cardVisible]
        next[idx] = true
        cardVisible = next
      }, idx * CARD_STAGGER)
    }

    const lastMs = (perPageCount - 1) * CARD_STAGGER
    anim.queue.schedule(() => {
      popupEnabled = true
      if (isTouchDevice) videoEls.forEach((v) => v?.play().catch(() => {}))
    }, lastMs + ENTRANCE_MS)
  }

  function playAnimation(): void {
    anim.play(pageProjects.length)
    if (isTouchDevice) {
      const lastMs = 200 + 180 + 460 + (pageProjects.length - 1) * CARD_STAGGER + ENTRANCE_MS
      anim.queue.schedule(() => {
        videoEls.forEach((v) => v?.play().catch(() => {}))
      }, lastMs)
    }
  }

  function hideImmediately(): void {
    anim.hide(pageProjects.length, container)
    hoveredIndex = null
    videoEls.forEach((v) => { if (v) { v.pause(); v.currentTime = 0 } })
    resetCardTilts(cardEls)
  }

  function goToPage(idx: number): void {
    if (idx < 0 || idx >= pageCount || idx === currentPage) return
    pageDir      = idx > currentPage ? -1 : 1
    hoveredIndex = null
    popupEnabled = false

    if (isMobile) {
      videoEls.forEach((v) => { if (v) { v.pause(); v.currentTime = 0 } })
      slideOut = true
      anim.queue.clear()
      anim.queue.schedule(() => {
        slideOut    = false
        currentPage = idx
        schedulePageEntrance()
      }, SLIDE_OUT_MS)
    } else {
      anim.queue.clear()
      currentPage = idx
      requestAnimationFrame(() => schedulePageEntrance())
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)

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
    isMobile   = window.innerWidth < 800
    if (was !== isMobile) {
      currentPage = 0
      anim.queue.clear()
      schedulePageEntrance()
    }
  }

  let stopMask:     () => void
  let stopPopup:    () => void
  let stopObserver: () => void
  let isTouchDevice = false

  onMount(() => {
    isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    checkMobile()

    stopMask = startBlobMaskAnimation(() => clipPathEls)

    stopPopup = isTouchDevice
      ? () => {}
      : startPopupLoop(
          () => popupEl,
          () => ({ x: cursorX, y: cursorY }),
          () => hoveredIndex !== null,
          () => hoveredIndex !== null ? (pageProjects[hoveredIndex]?.accent2 ?? null) : null,
        )

    stopObserver = observeSection(findSnapSection(container), playAnimation, hideImmediately)

    if (!isTouchDevice) window.addEventListener('mousemove',   onMouseMove)
    window.addEventListener('resize',      checkMobile,            { passive: true })
    window.addEventListener('pointermove', onWindowPointerMove,   { passive: true })
    window.addEventListener('pointerup',   onWindowPointerUp)

    return () => {
      anim.queue.clear(); stopMask(); stopPopup(); stopObserver()
      if (!isTouchDevice) window.removeEventListener('mousemove',   onMouseMove)
      window.removeEventListener('resize',      checkMobile)
      window.removeEventListener('pointermove', onWindowPointerMove)
      window.removeEventListener('pointerup',   onWindowPointerUp)
    }
  })

  onDestroy(() => {
    if (!browser) return
    anim.queue.clear(); stopMask?.(); stopPopup?.()
  })
</script>

<div
  class="showcase"
  role="region"
  aria-label="Портфоліо — перегляд проєктів"
  bind:this={container}
>

  <SectionHeader
    eyebrow="портфоліо"
    eyebrowColor="#171717"
    eyebrowBorder="#171717"
    titleColor="#171717"
    gradient="linear-gradient(90deg, #fcff9e 0%, #c67700 100%)"
    visible={eyebrowVisible}
    titleVisible={titleVisible}
  >
    Мої <em>роботи</em>
  </SectionHeader>

  <Pagination
    count={pageCount}
    current={currentPage}
    on:change={(e) => goToPage(e.detail)}
  />

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
        class:blob--slide-out={slideOut && isMobile}
        class:blob--mobile={isMobile}
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
            muted playsinline loop preload="none"
            aria-hidden="true"
          ></video>
        </div>
      </a>
    {/each}
  </div>

  {#if !isTouchDevice}
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
  {/if}

</div>

<style>
  @import '$lib/styles/blob-card.css';

  .showcase {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto auto 1fr;
    padding: 2rem 2rem 1.5rem;
    box-sizing: border-box;
    gap: 0.6rem;
    overflow: hidden;
    position: relative;
    z-index: 10;
    font-family: 'ICTV', sans-serif;
    user-select: none;
  }

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
    max-width: min(440px, calc(100vw - 1.7rem));
  }

  .showcase__grid .blob {
    cursor: pointer;
    min-height: 0;
    z-index: 999;
    transition:
      opacity   0.55s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
      filter    0.45s ease;
  }

  .showcase__grid .blob:not(.blob--visible):not(.blob--slide-out) {
    opacity: 0;
    transform: scale(0.82) translateX(calc(var(--slide-dir, -1) * -60px));
    filter: blur(4px);
  }

  .showcase__grid--mobile .blob.blob--slide-out {
    opacity: 0;
    transform: scale(0.82) translateX(calc(var(--slide-dir, -1) * 90px));
    filter: blur(5px);
    transition:
      opacity   0.26s ease-in,
      transform 0.26s ease-in,
      filter    0.20s ease-in;
    pointer-events: none;
  }

  /* Glassmorphism blob body — prefixed for Safari */
  .blob__body {
    background: rgba(255, 255, 255, 0.06);
    -webkit-backdrop-filter: blur(12px) saturate(1.4);
    backdrop-filter: blur(12px) saturate(1.4);
    transition: border-radius 0.9s ease, box-shadow 0.3s ease, background 0.35s ease;
  }

  /* On mobile: skip backdrop-filter (expensive on older phones) */
  @media (max-width: 800px) {
    .blob__body {
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .blob:hover .blob__body,
  .blob:focus-visible .blob__body {
    background: rgba(255, 255, 255, 0.10);
    box-shadow:
      0 0 40px 8px rgba(0,0,0,0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .blob__ring {
    inset: 0;
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.28);
    z-index: 3;
  }

  .blob__mask-svg {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .blob__inner--video {
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: hidden;
  }

  .blob__video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    opacity: 0.45;
    transition: opacity 0.4s ease;
  }

  .blob:hover .blob__video,
  .blob:focus-visible .blob__video { opacity: 0.85; }

  .popup__summary { margin-bottom: 0.6rem; }

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
    /* color-mix fallback */
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.25);
    color: rgba(255, 255, 255, 0.85);
  }

  @media (max-width: 800px) {
    .showcase { padding: 0.85rem 0.85rem; gap: 0.4rem; }
    .showcase__grid { gap: 0.7rem; }
    .showcase__grid--mobile { max-width: min(440px, calc(100vw - 1.7rem)); }
    .blob__video { opacity: 0.7; }
  }

  @media (max-width: 450px) {
    .blob,
    .blob__body,
    .blob__ring,
    .blob__inner {
      height: 90%;
      align-self: center;
    }
  }
</style>