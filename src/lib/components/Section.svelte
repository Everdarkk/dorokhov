<script lang="ts">
  import { onMount }        from 'svelte'
  import { circlesColor }   from '$lib/stores/circlesColor'
  import { activeSection }  from '$lib/stores/activeSection'

  type ScrollEffect = 'blink' | 'slide' | 'zoom'

  export let effect:   ScrollEffect       = 'blink'
  export let id:       string             = ''
  export let dotColor: string | undefined = undefined

  let sectionEl:  HTMLElement
  let inView      = false
  let mounted     = false

  onMount(() => {
    mounted = true

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (entry.isIntersecting) {
          activeSection.set(id)
          if (dotColor) circlesColor.set(dotColor)
        }
      },
      { threshold: 0.45 },
    )

    observer.observe(sectionEl)
    return () => observer.disconnect()
  })

  $: contentClass = [
    'content',
    `effect-${effect}`,
    inView   ? 'in-view'    : '',
    mounted  ? 'is-mounted' : '',
  ].filter(Boolean).join(' ')
</script>

<section
  class="snap-section"
  {id}
  bind:this={sectionEl}
>
  <div class={contentClass}>
    <slot />
  </div>
</section>

<style>
  .snap-section {
    scroll-snap-align: start;
    scroll-snap-stop: always;
    /* dvh with vh fallback */
    height: 100vh;
    height: 100dvh;
    position: relative;
  }

  .content {
    position: fixed;
    inset: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    opacity: 0;
    visibility: hidden;
    will-change: opacity;
  }

  /* Enable transitions only after JS mount (avoids FOUC) */
  .content.is-mounted {
    transition:
      opacity    0.5s ease,
      filter     0.5s ease,
      transform  0.5s ease,
      visibility 0s   linear 0.5s;
  }

  .content.in-view {
    opacity:    1;
    visibility: visible;
    transition:
      opacity    0.5s ease,
      filter     0.5s ease,
      transform  0.5s ease,
      visibility 0s   linear 0s;
  }

  /* ── blink ── */
  .effect-blink.is-mounted:not(.in-view) {
    filter:  blur(0.45rem) contrast(3);
    opacity: 0;
  }
  .effect-blink.in-view {
    filter:  blur(0) contrast(1);
  }

  /* ── slide ── */
  .effect-slide.is-mounted:not(.in-view) {
    transform: translate3d(50px, 0, 0);
    opacity: 0;
  }
  .effect-slide.in-view {
    transform: none;
  }

  /* ── zoom ── */
  .effect-zoom.is-mounted:not(.in-view) {
    filter:    blur(2.5rem);
    transform: scale(0.72);
    opacity:   0;
  }
  .effect-zoom.in-view {
    filter:    blur(0);
    transform: none;
  }

  /* Mobile: simpler fade + tiny lift — saves GPU */
  @media (max-width: 800px) {
    .effect-blink.is-mounted:not(.in-view),
    .effect-slide.is-mounted:not(.in-view),
    .effect-zoom.is-mounted:not(.in-view) {
      filter:    none;
      transform: translateY(14px);
      opacity:   0;
    }
    .effect-blink.in-view,
    .effect-slide.in-view,
    .effect-zoom.in-view {
      filter:    none;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .content,
    .content.is-mounted {
      transition: none !important;
    }
    .content { opacity: 0; visibility: hidden; }
    .content.in-view { opacity: 1; visibility: visible; filter: none; transform: none; }
  }
</style>