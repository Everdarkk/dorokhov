<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'
  import photo from '$lib/assets/images/od.webp'
  import { cards } from '$lib/data/cards'
  import {
    findSnapSection,
    observeSection,
    createTimeoutQueue,
    createCardTiltHandler,
    resetCardTilts,
    startBlobMaskAnimation,
  } from '$lib/utils/animation'
  import SectionHeader from '$lib/components/SectionHeader.svelte'

  const INTRO_DELAY  = 200
  const TITLE_DELAY  = 180
  const CARDS_DELAY  = 480
  const CARD_STAGGER = 140

  let eyebrowVisible         = false
  let titleVisible           = false
  let cardVisible: boolean[] = cards.map(() => false)

  let container:  HTMLDivElement
  let cardEls:    HTMLElement[]         = []
  let clipPathEl: SVGPathElement | null = null

  const queue = createTimeoutQueue()

  function playAnimation(): void {
    queue.schedule(() => { eyebrowVisible = true }, INTRO_DELAY)
    queue.schedule(() => { titleVisible   = true }, INTRO_DELAY + TITLE_DELAY)
    const start = INTRO_DELAY + TITLE_DELAY + CARDS_DELAY
    cards.forEach((_, i) => {
      queue.schedule(() => { cardVisible[i] = true; cardVisible = [...cardVisible] }, start + i * CARD_STAGGER)
    })
  }

  function hideImmediately(): void {
    queue.clear()
    container?.classList.add('no-transition')
    eyebrowVisible = false
    titleVisible   = false
    cardVisible    = cards.map(() => false)
    resetCardTilts(cardEls)
    requestAnimationFrame(() => container?.classList.remove('no-transition'))
  }

  const onMouseMove = createCardTiltHandler(() => cardEls, { maxRot: 20, maxScale: 0.07, maxTx: 0.07 })

  let stopMask:     () => void
  let stopObserver: () => void

  onMount(() => {
    stopMask     = startBlobMaskAnimation(() => [clipPathEl])
    stopObserver = observeSection(findSnapSection(container), playAnimation, hideImmediately)
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      queue.clear(); stopMask(); stopObserver()
      window.removeEventListener('mousemove', onMouseMove)
    }
  })

  onDestroy(() => {
    if (!browser) return
    queue.clear(); stopMask?.()
  })
</script>

<div class="about" bind:this={container}>

  <SectionHeader
    eyebrow="про мене"
    gradient="linear-gradient(135deg, #e2103a 0%, #ff6b6b 50%, #c2002a 100%)"
    visible={eyebrowVisible}
    titleVisible={titleVisible}
  >
    Олександр<br /><em>Веб-розробник</em>
  </SectionHeader>

  <div class="about__grid">
    {#each cards as card, i (card.id)}
      <article
        class="blob"
        class:blob--photo={card.type === 'photo'}
        class:blob--visible={cardVisible[i]}
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
        <div class="blob__body" style="background: radial-gradient(ellipse at 35% 30%, color-mix(in srgb, var(--accent2) 65%, white 35%) 0%, var(--accent1) 45%, color-mix(in srgb, var(--accent1) 55%, black 45%) 100%)"></div>
        <div class="blob__shine"></div>
        <div class="blob__ring" style="background: conic-gradient(from 0deg, var(--accent2), transparent 30%, var(--accent1) 60%, transparent 80%, var(--accent2))"></div>

        <div class="blob__inner">
          {#if card.type === 'photo'}
            <svg class="blob__mask-svg" aria-hidden="true">
              <defs>
                <clipPath id="photo-blob-clip" clipPathUnits="objectBoundingBox">
                  <path bind:this={clipPathEl} d="" />
                </clipPath>
              </defs>
            </svg>
            <img class="blob__photo" src={photo} alt="Фото Олександра" loading="lazy" />
          {:else}
            {#if card.title}
              <h3 class="blob__title">{card.title}</h3>
            {/if}
            <div class="lines">
              {#each card.lines ?? [] as line (line.text)}
                <p class="blob__line">
                  {#if line.icon}
                    <img class="blob__line-icon" src={line.icon} alt="" aria-hidden="true" width="20" height="20" />
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

  .blob__inner {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 3rem;
    padding: 1.4rem 1.5rem;
    box-sizing: border-box;
  }

  .blob--visible {
    transition:
      opacity   0.7s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.1s ease,
      filter    0.6s ease;
  }

  .blob__title {
    font-family: 'Unbounded', sans-serif;
    font-size: clamp(1.1rem, 1.4vw, 1.4rem);
    font-weight: 700;
    color: #fff;
    margin: 0 0 0.2rem;
    text-shadow: 0 2px 10px rgba(0,0,0,0.5);
  }

  .lines { display: flex; flex-direction: column; gap: 0.5rem; }

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

  .blob__line-icon {
    flex-shrink: 0;
    width: 1.2em; height: 1.2em;
    object-fit: contain;
    filter: brightness(0) invert(1);
    opacity: 0.85;
  }

  .blob--photo .blob__inner { padding: 0; position: relative; }

  .blob__mask-svg { position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none; }

  .blob__photo {
    position: absolute;
    inset: 0; width: 100%; height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
    clip-path: url(#photo-blob-clip);
  }

  .blob:hover .blob__body { box-shadow: 0 0 70px 12px color-mix(in srgb, var(--accent2) 55%, transparent 45%); }

  @media (max-width: 640px) {
    .about { padding: 3.5rem 1rem 1rem; gap: 1rem; }
    .about__grid { gap: 0.75rem; }
    .blob__inner { padding: 1rem 1.1rem; }
  }

  @media (max-width: 380px) {
    .about__grid { grid-template-columns: 1fr; grid-template-rows: repeat(4, 1fr); }
  }
</style>