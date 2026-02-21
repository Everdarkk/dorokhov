<script lang="ts">
  /**
   * Section — a full-viewport snap section.
   *
   * Each section takes up 100dvh in the normal flow (powering the
   * scroll-snap + view-timeline), while its `.content` slot is
   * position: fixed so sections "replace" each other without visible scrolling.
   *
   * The entry/exit animation is controlled by the `effect` prop.
   */

  type ScrollEffect = 'blink' | 'slide' | 'zoom';

  export let effect: ScrollEffect = 'blink';
  export let id: string = '';
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
  /* ─────────────────────────────────────────────
     The section itself lives in normal flow:
     it takes up 100dvh, snaps to start, and
     powers the view-timeline that drives the
     content animation.
  ───────────────────────────────────────────── */
  .snap-section {
    scroll-snap-align: start;
    scroll-snap-stop: always;
    height: 100dvh;

    /* Named timeline — content below subscribes to this */
    view-timeline: --section;
  }

  /* ─────────────────────────────────────────────
     .content is torn out of flow and stacked
     full-screen. Only one is visible at a time
     because the animation hides all others.
  ───────────────────────────────────────────── */
  .content {
    position: fixed;
    inset: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    /* Must match the page background so sections
       fully cover each other during transitions  */
    background: var(--section-bg, #0b0c0e);

    /* Wire animation to the parent section's scroll position */
    animation-timeline: --section;
    animation-fill-mode: both;
    animation-timing-function: ease-in-out;
  }

  /* ── Effect: blink (blur + contrast) ── */
  .effect-blink .content {
    --blur: 0.6rem;
    --contrast: 5;
    animation-name: blink;
  }

  @keyframes blink {
    0%, 100% {
      filter: blur(var(--blur)) contrast(var(--contrast));
      opacity: 0;
      visibility: hidden;
    }
    50% {
      filter: blur(0) contrast(1);
      opacity: 1;
      visibility: visible;
    }
  }

  /* ── Effect: slide (horizontal) ── */
  .effect-slide .content {
    animation-name: slide;
  }

  @keyframes slide {
    0%   { transform: translate3d(100%, 0, 0);  opacity: 0; }
    50%  { transform: none;                     opacity: 1; }
    100% { transform: translate3d(-100%, 0, 0); opacity: 0; }
  }

  /* ── Effect: zoom ── */
  .effect-zoom .content {
    animation-name: zoom;
  }

  @keyframes zoom {
    0% {
      filter: blur(4rem);
      transform: scale(0.6);
      opacity: 0;
      visibility: hidden;
    }
    50% {
      filter: blur(0);
      transform: none;
      opacity: 1;
      visibility: visible;
    }
    100% {
      filter: blur(3rem);
      transform: scale(1.4);
      opacity: 0;
      visibility: hidden;
    }
  }
</style>