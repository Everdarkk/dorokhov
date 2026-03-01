<script lang="ts">
  type ScrollEffect = 'blink' | 'slide' | 'zoom'

  export let effect: ScrollEffect = 'blink'
  export let id: string = ''
</script>

<!-- Each section occupies 100dvh in normal flow (scroll-snap + view-timeline). -->
<!-- Its .content is position:fixed so sections cross-fade during scroll. -->
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
  /* Takes up 100dvh in flow — powers scroll-snap and view-timeline */
  .snap-section {
    scroll-snap-align: start;
    scroll-snap-stop: always;
    height: 100dvh;
    view-timeline: --section;
  }

  /* Fixed full-screen layer — only one visible at a time via animation */
  .content {
    position: fixed;
    inset: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    background: var(--section-bg, #0b0c0e);

    animation-timeline: --section;
    animation-fill-mode: both;
    animation-timing-function: ease-in-out;
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