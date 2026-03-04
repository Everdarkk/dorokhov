<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import { contacts } from '$lib/data/contacts'
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
  let cardVisible: boolean[] = contacts.map(() => false)
  let popupEnabled           = false
  let hoveredIndex: number | null = null
  let cursorX = 0, cursorY = 0

  // ─── DOM refs ──────────────────────────────────────────────────────────────

  let container: HTMLDivElement
  let cardEls:   HTMLElement[]  = []
  let popupEl:   HTMLDivElement

  // ─── Animation composable ─────────────────────────────────────────────────

  const anim = sectionAnimation(
    contacts,
    { introDelay: 200, titleDelay: 180, cardsDelay: 420, cardStagger: 110, entranceMs: 700 },
    (s) => {
      eyebrowVisible = s.eyebrowVisible
      titleVisible   = s.titleVisible
      cardVisible    = s.cardVisible
      popupEnabled   = s.popupEnabled
    },
  )

  const playAnimation   = () => anim.play()
  const hideImmediately = () => { anim.hide(contacts.length, container); hoveredIndex = null; resetCardTilts(cardEls) }

  // ─── Card interactions ────────────────────────────────────────────────────

  const tiltHandler = createCardTiltHandler(() => cardEls, { maxRot: 20, maxScale: 0.07 })

  function onMouseMove(e: MouseEvent): void {
    cursorX = e.clientX; cursorY = e.clientY
    tiltHandler(e)
  }

  const onCardEnter = (i: number) => { if (!popupEnabled) return; hoveredIndex = i }
  const onCardLeave = ()          => { hoveredIndex = null }

  $: activeContact = hoveredIndex !== null ? contacts[hoveredIndex] : null

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
      () => hoveredIndex !== null ? (contacts[hoveredIndex]?.accent2 ?? null) : null,
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
<div class="contacts" bind:this={container}>

  <SectionHeader
    eyebrow="контакти"
    eyebrowColor="#171717"
    eyebrowBorder="#171717"
    titleColor="#171717"
    gradient="linear-gradient(90deg, #FC466B 0%, #3F5EFB 100%)"
    visible={eyebrowVisible}
    titleVisible={titleVisible}
  >
    Зв&apos;яжіться <em>зі мною</em>
  </SectionHeader>

  <div class="contacts__grid" role="list" aria-label="Соціальні мережі">
    {#each contacts as contact, i (contact.id)}
      <a
        href={contact.url}
        target="_blank"
        rel="noopener noreferrer"
        class="blob"
        class:blob--visible={cardVisible[i]}
        bind:this={cardEls[i]}
        style="
          --accent1: {contact.accent1}; --accent2: {contact.accent2};
          --rx: {contact.rx}; --ry: {contact.ry};
          --dur: {contact.morphDuration}s; --del: {contact.morphDelay}s;
          --glow: 0;
        "
        aria-label="{contact.name} — {contact.handle}"
        on:mouseenter={() => onCardEnter(i)}
        on:mouseleave={onCardLeave}
        on:focus={() => onCardEnter(i)}
        on:blur={onCardLeave}
      >
        <div class="blob__body"></div>
        <div class="blob__shine"></div>
        <div class="blob__ring"></div>
        <div class="blob__inner">
          <svg class="blob__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d={contact.icon} />
          </svg>
        </div>
      </a>
    {/each}
  </div>

  <div class="popup" bind:this={popupEl} aria-hidden="true">
    {#if activeContact}
      <span class="popup__name">{activeContact.name}</span>
      <p class="popup__summary">{activeContact.handle}</p>
    {/if}
  </div>

</div>

<style>
  @import '$lib/styles/blob-card.css';

  .contacts {
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

  .contacts__grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: center;
    gap: 1.4rem;
    width: 100%;
    max-width: 820px;
    margin: 0 auto;
    height: 100%;
    min-height: 0;
  }

  .blob {
    cursor: pointer;
    flex: 0 0 clamp(130px, 20vmin, 220px);
    aspect-ratio: 1;
    text-decoration: none;
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
      0 0 70px 10px color-mix(in srgb, var(--accent2) 40%, transparent 60%);
  }

  .blob--visible {
    transition:
      opacity   0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.1s ease,
      filter    0.6s ease;
  }

  .blob__inner {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .blob__icon {
    width: 42%; height: 42%;
    color: #fff;
    filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.45));
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .blob:hover .blob__icon,
  .blob:focus-visible .blob__icon { transform: scale(1.18); }

  .popup__summary { opacity: 0.65; }

  @media (max-width: 800px) {
    .contacts { padding: 0.85rem 0.85rem; gap: 0.65rem; }

    .contacts__grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.65rem;
      max-width: min(380px, calc(100vw - 1.7rem));
      height: auto;
      align-self: center;
    }

    .blob { flex: none; width: 100%; aspect-ratio: 1; }
  }

  @media (max-width: 380px) {
    .contacts__grid { gap: 0.5rem; max-width: calc(100vw - 1.7rem); }
  }
</style>