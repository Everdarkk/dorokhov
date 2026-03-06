<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { techCards } from '$lib/data/stack'
  import {
    findSnapSection,
    observeSection,
    createCardTiltHandler,
    resetCardTilts,
    startPopupLoop,
  } from '$lib/utils/animation'
  import { sectionAnimation } from '$lib/utils/sectionAnimation'
  import SectionHeader from '$lib/components/SectionHeader.svelte'

  // ─── State ────────────────────────────────────────────────────────────────

  let eyebrowVisible         = false
  let titleVisible           = false
  let cardVisible: boolean[] = techCards.map(() => false)
  let popupEnabled           = false
  let hoveredIndex: number | null = null
  let cursorX = 0, cursorY = 0

  // Mobile: which card has an open tap-tooltip + computed fixed position
  let tappedIndex: number | null = null
  let tooltipStyle = ''

  function computeTooltipStyle(blobEl: HTMLElement): string {
    const r   = blobEl.getBoundingClientRect()
    const TW  = Math.min(240, window.innerWidth - 24)
    const TH  = 80
    const GAP = 12
    let x = r.left + r.width / 2 - TW / 2
    x = Math.max(12, Math.min(x, window.innerWidth - TW - 12))
    let y = r.top - TH - GAP
    const caretUp = y < 12
    if (caretUp) y = r.bottom + GAP
    return `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${TW}px;--caret:${caretUp ? 'up' : 'down'};`
  }

  // ─── DOM refs ──────────────────────────────────────────────────────────────

  let container: HTMLDivElement
  let cardEls:   HTMLElement[]  = []
  let popupEl:   HTMLDivElement

  // ─── Animation ────────────────────────────────────────────────────────────

  const anim = sectionAnimation(
    techCards,
    { introDelay: 200, titleDelay: 180, cardsDelay: 460, cardStagger: 100, entranceMs: 700 },
    (s) => {
      eyebrowVisible = s.eyebrowVisible
      titleVisible   = s.titleVisible
      cardVisible    = s.cardVisible
      popupEnabled   = s.popupEnabled
    },
  )

  const playAnimation   = () => anim.play()
  const hideImmediately = () => {
    anim.hide(techCards.length, container)
    hoveredIndex = null
    tappedIndex  = null
    resetCardTilts(cardEls)
  }

  // ─── Desktop interactions ─────────────────────────────────────────────────

  const tiltHandler = createCardTiltHandler(() => cardEls, { maxRot: 18 })

  function onMouseMove(e: MouseEvent): void {
    cursorX = e.clientX; cursorY = e.clientY
    tiltHandler(e)
  }

  const onCardEnter = (i: number) => { if (!popupEnabled) return; hoveredIndex = i }
  const onCardLeave = ()          => { hoveredIndex = null }

  $: activeCard = hoveredIndex !== null
    ? techCards[hoveredIndex]
    : (tappedIndex !== null ? techCards[tappedIndex] : null)

  // ─── Mobile: tap to toggle tooltip ────────────────────────────────────────

  function onCardTap(i: number, blobEl: HTMLElement): void {
    if (!popupEnabled) return
    if (tappedIndex === i) { tappedIndex = null; return }
    tooltipStyle = computeTooltipStyle(blobEl)
    tappedIndex  = i
  }

  // Tap outside any card — close tooltip
  function onBackdropTap(e: TouchEvent): void {
    const t = e.target as HTMLElement
    if (!t.closest('.blob') && !t.closest('.mobile-tooltip')) {
      tappedIndex = null
    }
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  let stopPopup:    () => void
  let stopObserver: () => void
  let isTouchDevice = false

  onMount(() => {
    isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches

    stopPopup = isTouchDevice
      ? () => {}
      : startPopupLoop(
          () => popupEl,
          () => ({ x: cursorX, y: cursorY }),
          () => hoveredIndex !== null,
          () => hoveredIndex !== null ? (techCards[hoveredIndex]?.accent2 ?? null) : null,
        )

    stopObserver = observeSection(findSnapSection(container), playAnimation, hideImmediately)

    if (!isTouchDevice) {
      window.addEventListener('mousemove', onMouseMove)
    }

    return () => {
      anim.queue.clear(); stopPopup(); stopObserver()
      if (!isTouchDevice) window.removeEventListener('mousemove', onMouseMove)
    }
  })

  onDestroy(() => {
    if (!browser) return
    anim.queue.clear(); stopPopup?.()
  })
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="stack"
  bind:this={container}
  on:touchstart={onBackdropTap}
>

  <SectionHeader
    eyebrow="технології"
    gradient="linear-gradient(135deg, #d0d0d0 0%, #fff1a0 45%, #c3a4c3 100%)"
    visible={eyebrowVisible}
    titleVisible={titleVisible}
  >
    Мій <em>стек</em>
  </SectionHeader>

  <div class="stack__grid">
    {#each techCards as card, i (card.id)}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="blob"
        class:blob--visible={cardVisible[i]}
        class:blob--tapped={isTouchDevice && tappedIndex === i}
        bind:this={cardEls[i]}
        style="
          --accent1: {card.accent1}; --accent2: {card.accent2};
          --rx: {card.rx}; --ry: {card.ry};
          --dur: {card.morphDuration}s; --del: {card.morphDelay}s;
          --glow: 0;
        "
        role="button"
        tabindex="0"
        aria-label={card.name}
        aria-expanded={isTouchDevice ? tappedIndex === i : undefined}
        on:mouseenter={() => onCardEnter(i)}
        on:mouseleave={onCardLeave}
        on:focus={() => onCardEnter(i)}
        on:blur={onCardLeave}
        on:touchend|preventDefault={() => onCardTap(i, cardEls[i])}
      >
        <div class="blob__body"></div>
        <div class="blob__shine"></div>
        <div class="blob__ring"></div>
        <div class="blob__inner">
          <img
            class="blob__icon"
            src={card.icon}
            alt={card.name}
            width="48" height="48"
            loading="lazy"
          />
        </div>
      </div>
    {/each}
  </div>

  <!-- Desktop RAF popup -->
  {#if !isTouchDevice}
    <div class="popup" bind:this={popupEl} aria-hidden="true">
      {#if activeCard}
        <div class="popup__header">
          <img class="popup__icon" src={activeCard.icon} alt="" aria-hidden="true" width="22" height="22" />
          <span class="popup__name">{activeCard.name}</span>
        </div>
        <p class="popup__summary">{activeCard.summary}</p>
      {/if}
    </div>
  {/if}

  <!-- Mobile fixed tooltip — one element, repositioned on each tap -->
  {#if isTouchDevice}
    {@const tCard = tappedIndex !== null ? techCards[tappedIndex] : null}
    <div
      class="mobile-popup"
      class:mobile-popup--visible={tappedIndex !== null}
      style={tooltipStyle}
      aria-hidden="true"
    >
      {#if tCard}
        <div class="mobile-popup__header">
          <img class="mobile-popup__icon" src={tCard.icon} alt="" width="20" height="20" loading="lazy" />
          <span class="mobile-popup__name">{tCard.name}</span>
        </div>
        {#if tCard.summary}
          <p class="mobile-popup__summary">{tCard.summary}</p>
        {/if}
      {/if}
    </div>
  {/if}

</div>

<style>
  @import '$lib/styles/blob-card.css';

  /* ── Section wrapper ──────────────────────────────────────────────────────── */
  .stack {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    padding: 2rem;
    box-sizing: border-box;
    gap: 1.5rem;
    overflow: hidden;
    position: relative;
    z-index: 10;
    font-family: 'ICTV', sans-serif;
  }

  /* ── Grid ─────────────────────────────────────────────────────────────────── */
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

  /* ── Blob ─────────────────────────────────────────────────────────────────── */
  .blob {
    cursor: pointer;
    flex: 0 0 clamp(150px, 22vmin, 250px);
    aspect-ratio: 1;
    /* Needed so tooltip is positioned relative to blob */
    position: relative;
  }

  .blob__body {
    background: radial-gradient(
      ellipse at 35% 28%,
      var(--accent2, #888) 0%,
      var(--accent1, #444) 50%,
      #111 100%
    );
  }

  .blob__ring {
    inset: -3px;
    background: conic-gradient(
      from 0deg,
      var(--accent2), transparent 30%, var(--accent1) 60%, transparent 80%, var(--accent2)
    );
  }

  .blob:hover .blob__body,
  .blob:focus-visible .blob__body {
    box-shadow:
      0 0 0 2px var(--accent2, rgba(255,255,255,0.5)),
      0 0 60px 8px rgba(0,0,0,0.3);
  }

  /* Tapped state on mobile — subtle pulse */
  .blob--tapped .blob__body {
    box-shadow:
      0 0 0 2px var(--accent2, rgba(255,255,255,0.5)),
      0 0 40px 6px rgba(0,0,0,0.25);
  }

  .blob__inner {
    width: 100%; height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .blob__icon {
    width: 45%; height: 45%;
    object-fit: contain;
    display: block;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .blob:hover .blob__icon,
  .blob:focus-visible .blob__icon { transform: scale(1.15); }

  /* ── Desktop popup extras ─────────────────────────────────────────────────── */
  .popup__header {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    margin-bottom: 0.5rem;
  }

  .popup__icon {
    width: 22px; height: 22px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.4));
  }

  /* ── Mobile fixed tooltip (mirrors desktop popup look) ───────────────────── */
  /*
   * position:fixed — coordinates computed from getBoundingClientRect() on tap,
   * clamped to viewport. Zero RAF, zero IntersectionObserver, pure CSS fade.
   * --caret: 'up' (arrow on top) or 'down' (arrow on bottom) set inline.
   */
  .mobile-popup {
    position: fixed;
    z-index: 9999;
    pointer-events: none;

    /* Same look as desktop popup (from blob-card.css base) */
    background: rgba(12, 12, 16, 0.90);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 14px;
    padding: 0.65rem 0.9rem 0.55rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset;
    -webkit-backdrop-filter: blur(14px);
    backdrop-filter: blur(14px);

    opacity: 0;
    transform: scale(0.92) translateY(4px);
    transition:
      opacity   0.2s ease,
      transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);

    /* Caret — toggled by --caret var */
    &::before {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      border: 7px solid transparent;
    }
    /* Caret down (tooltip is above blob) */
    &:not([style*='up'])::before {
      top: 100%;
      border-top-color: rgba(12, 12, 16, 0.90);
    }
    /* Caret up (tooltip is below blob) */
    &[style*='up']::before {
      bottom: 100%;
      border-bottom-color: rgba(12, 12, 16, 0.90);
    }
  }

  .mobile-popup--visible {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1) translateY(0);
  }

  .mobile-popup__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.3rem;
  }

  .mobile-popup__icon {
    width: 20px; height: 20px;
    object-fit: contain;
    flex-shrink: 0;
    filter: drop-shadow(0 1px 4px rgba(0,0,0,0.5));
  }

  .mobile-popup__name {
    font-family: 'Unbounded', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.03em;
    white-space: nowrap;
  }

  .mobile-popup__summary {
    margin: 0;
    font-size: 0.67rem;
    line-height: 1.45;
    color: rgba(255,255,255,0.58);
  }

  /* ── Mobile overrides ─────────────────────────────────────────────────────── */
  @media (max-width: 800px) {
    .stack { padding: 0.85rem; gap: 0.75rem; }
    .stack__grid { gap: 0.65rem; }
    .blob { flex: 0 0 clamp(90px, 26vw, 140px); }
  }

  @media (max-width: 380px) {
    .blob { flex: 0 0 clamp(80px, 28vw, 110px); }
  }
</style>