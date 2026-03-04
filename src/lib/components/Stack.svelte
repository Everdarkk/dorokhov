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

  // ─── Reactive state ───────────────────────────────────────────────────────

  let eyebrowVisible         = false
  let titleVisible           = false
  let cardVisible: boolean[] = techCards.map(() => false)
  let popupEnabled           = false
  let hoveredIndex: number | null = null
  let cursorX = 0, cursorY = 0

  // ─── DOM refs ──────────────────────────────────────────────────────────────

  let container: HTMLDivElement
  let cardEls:   HTMLElement[]  = []
  let popupEl:   HTMLDivElement

  // ─── Animation composable ─────────────────────────────────────────────────

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

  const playAnimation  = () => anim.play()
  const hideImmediately = () => { anim.hide(techCards.length, container); hoveredIndex = null; resetCardTilts(cardEls) }

  // ─── Card interactions ────────────────────────────────────────────────────

  const tiltHandler = createCardTiltHandler(() => cardEls, { maxRot: 18 })

  function onMouseMove(e: MouseEvent): void {
    cursorX = e.clientX; cursorY = e.clientY
    tiltHandler(e)
  }

  const onCardEnter = (i: number) => { if (!popupEnabled) return; hoveredIndex = i }
  const onCardLeave = ()          => { hoveredIndex = null }

  $: activeCard = hoveredIndex !== null ? techCards[hoveredIndex] : null

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  let stopPopup:    () => void
  let stopObserver: () => void
  let isTouchDevice = false

  onMount(() => {
    isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    stopPopup = startPopupLoop(
      () => popupEl,
      () => ({ x: cursorX, y: cursorY }),
      () => hoveredIndex !== null,
      () => hoveredIndex !== null ? (techCards[hoveredIndex]?.accent2 ?? null) : null,
    )
    stopObserver = observeSection(findSnapSection(container), playAnimation, hideImmediately)
    if (!isTouchDevice) window.addEventListener('mousemove', onMouseMove)
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

<!-- STRUCTURE -->
<div class="stack" bind:this={container}>

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
      <div
        class="blob"
        class:blob--visible={cardVisible[i]}
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
        on:mouseenter={() => onCardEnter(i)}
        on:mouseleave={onCardLeave}
        on:focus={() => onCardEnter(i)}
        on:blur={onCardLeave}
      >
        <div class="blob__body"></div>
        <div class="blob__shine"></div>
        <div class="blob__ring"></div>
        <div class="blob__inner">
          <img class="blob__icon" src={card.icon} alt={card.name} width="48" height="48" loading="lazy" />
        </div>
      </div>
    {/each}
  </div>

  <div class="popup" bind:this={popupEl} aria-hidden="true">
    {#if activeCard}
      <div class="popup__header">
        <img class="popup__icon" src={activeCard.icon} alt="" aria-hidden="true" width="22" height="22" />
        <span class="popup__name">{activeCard.name}</span>
      </div>
      <p class="popup__summary">{activeCard.summary}</p>
    {/if}
  </div>

</div>

<style>
  @import '$lib/styles/blob-card.css';

  .stack {
    width: 100%;
    height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    padding: 2rem 2rem 2rem;
    box-sizing: border-box;
    gap: 1.5rem;
    overflow: hidden;
    position: relative;
    z-index: 10;
    font-family: 'ICTV', sans-serif;
  }

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

  .blob {
    cursor: pointer;
    flex: 0 0 clamp(150px, 22vmin, 250px);
    aspect-ratio: 1;
  }

  .blob__body {
    background: radial-gradient(
      ellipse at 35% 28%,
      color-mix(in srgb, var(--accent2) 60%, white 40%) 0%,
      var(--accent1) 50%,
      color-mix(in srgb, var(--accent1) 50%, black 50%) 100%
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
      0 0 0 2px color-mix(in srgb, var(--accent2) 70%, transparent 30%),
      0 0 60px 8px color-mix(in srgb, var(--accent2) 45%, transparent 55%);
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

  @media (max-width: 800px) {
    .stack { padding: 0.85rem 0.85rem; gap: 0.75rem; }
    .stack__grid { gap: 0.6rem; }
    .blob { flex: 0 0 clamp(90px, 26vw, 140px); }
  }

  @media (max-width: 380px) {
    .blob { flex: 0 0 clamp(80px, 28vw, 110px); }
  }
</style>