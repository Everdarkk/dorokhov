<script lang="ts">
  import { onMount }        from 'svelte'
  import { circlesColor }   from '$lib/stores/circlesColor'
  import { activeSection }  from '$lib/stores/activeSection'

  type ScrollEffect = 'blink' | 'slide' | 'zoom'

  export let effect:    ScrollEffect      = 'blink'
  export let id:        string            = ''

  /**
   * Optional colour for the Circles nav dots while this section is active.
   * Accepts any CSS colour — e.g. 'azure', '#ff6b6b', 'rgba(255,100,50,0.9)'.
   */
  export let dotColor:  string | undefined = undefined

  onMount(() => {
    const el = document.getElementById(id)
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          activeSection.set(id)
          if (dotColor) circlesColor.set(dotColor)
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  })
</script>

<section
  class="snap-section"
  class:effect-blink={effect === 'blink'}
  class:effect-slide={effect === 'slide'}
  class:effect-zoom={effect === 'zoom'}
  {id}
>
  <div class="content">
    <slot />
  </div>
</section>

<style>
  .snap-section {
    scroll-snap-align: start;
    scroll-snap-stop: always;
    height: 100dvh;
    view-timeline: --section;
  }

  .content {
    position: fixed;
    inset: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;

    animation-timeline: --section;
    animation-fill-mode: both;
    animation-timing-function: ease-in-out;

    /* Promote to its own compositor layer once — cheaper than per-frame repaints */
    will-change: opacity, filter;
  }

  /* ── Effect: blink ── */
  .effect-blink .content {
    --blur: 0.6rem;
    --contrast: 5;
    animation-name: blink;
  }

  @keyframes blink {
    0%, 100% { filter: blur(var(--blur)) contrast(var(--contrast)); opacity: 0; visibility: hidden; }
    50%       { filter: blur(0) contrast(1); opacity: 1; visibility: visible; }
  }

  /* ── Effect: slide ── */
  .effect-slide .content { animation-name: slide; }

  @keyframes slide {
    0%   { transform: translate3d(100%, 0, 0);  opacity: 0; }
    50%  { transform: none;                     opacity: 1; }
    100% { transform: translate3d(-100%, 0, 0); opacity: 0; }
  }

  /* ── Effect: zoom ── */
  .effect-zoom .content { animation-name: zoom; }

  @keyframes zoom {
    0%   { filter: blur(4rem); transform: scale(0.6); opacity: 0; visibility: hidden; }
    50%  { filter: blur(0);    transform: none;       opacity: 1; visibility: visible; }
    100% { filter: blur(3rem); transform: scale(1.4); opacity: 0; visibility: hidden; }
  }
</style>