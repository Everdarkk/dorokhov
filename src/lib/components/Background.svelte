<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser }            from '$app/environment'
  import { activeSection }      from '$lib/stores/activeSection'
  import { mouse }              from '$lib/stores/mouse'

  export let colorBg1         = 'rgb(25, 11, 38)'
  export let colorBg2         = 'rgb(36, 6, 64)'
  export let color1           = '181,159,201'
  export let color2           = '157,127,183'
  export let color3           = '132,95,165'
  export let color4           = '114,83,113'
  export let color5           = '6,37,73'
  export let colorInteractive = '137,237,247'
  export let circleSize       = '80%'
  export let blending         = 'hard-light'
  export let fadeDelay        = 0
  export let fadeDuration     = 1800
  export let sectionId        = ''   // must match the parent Section's id

  let visible      = false
  let interBubble: HTMLDivElement
  let curX = 0, curY = 0
  let rafId: number
  let timer: ReturnType<typeof setTimeout>
  let active = false

  // ─── RAF loop — only runs when this section is active ────────────────────────

  function move(): void {
    // Lerp toward mouse using the global store values (no own listener needed)
    const tgX = $mouse.x
    const tgY = $mouse.y
    curX += (tgX - curX) / 20
    curY += (tgY - curY) / 20
    if (interBubble) {
      interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`
    }
    if (active) rafId = requestAnimationFrame(move)
  }

  // ─── React to which section is on screen ─────────────────────────────────────

  $: {
    if (sectionId) {
      const nowActive = $activeSection === sectionId
      if (nowActive && !active) {
        active = true
        rafId  = requestAnimationFrame(move)
      } else if (!nowActive && active) {
        active = false
        cancelAnimationFrame(rafId)
      }
    }
  }

  onMount(() => {
    // If no sectionId provided, fall back to always-on (backwards compat)
    if (!sectionId) {
      active = true
      rafId  = requestAnimationFrame(move)
    }
    timer = setTimeout(() => { visible = true }, fadeDelay)

    return () => {
      active = false
      cancelAnimationFrame(rafId)
      clearTimeout(timer)
    }
  })

  onDestroy(() => {
    if (!browser) return
    active = false
    cancelAnimationFrame(rafId)
    clearTimeout(timer)
  })
</script>

<!-- Hidden SVG registers the goo filter -->
<svg xmlns="http://www.w3.org/2000/svg" class="svg-filter" aria-hidden="true">
  <defs>
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
      <feColorMatrix in="blur" mode="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
      <feBlend in="SourceGraphic" in2="goo" />
    </filter>
  </defs>
</svg>

<div
  class="gradient-bg"
  class:visible
  style="
    --color-bg1: {colorBg1}; --color-bg2: {colorBg2};
    --color1: {color1}; --color2: {color2}; --color3: {color3};
    --color4: {color4}; --color5: {color5};
    --color-interactive: {colorInteractive};
    --circle-size: {circleSize}; --blending: {blending};
    --fade-duration: {fadeDuration}ms;
  "
>
  <div class="gradients-container">
    <div class="g1"></div>
    <div class="g2"></div>
    <div class="g3"></div>
    <div class="g4"></div>
    <div class="g5"></div>
    <div class="interactive" bind:this={interBubble}></div>
  </div>
</div>

<style>
  .svg-filter { display: none; }

  .gradient-bg {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: linear-gradient(40deg, var(--color-bg1), var(--color-bg2));
    z-index: 0;
    opacity: 0;
    transition: opacity var(--fade-duration, 1800ms) ease;
    /* Prevents repaints on the main layer when bubbles animate */
    isolation: isolate;
  }

  .gradient-bg.visible { opacity: 1; }

  .gradients-container {
    filter: url(#goo) blur(40px);
    width: 100%;
    height: 100%;
    position: relative;
    /* Own compositing layer so the filter doesn't repaint parent */
    will-change: contents;
  }

  .g1, .g2, .g3, .g4, .g5, .interactive {
    position: absolute;
    mix-blend-mode: var(--blending);
    border-radius: 50%;
    opacity: 1;
  }

  @keyframes moveInCircle {
    0%   { transform: rotate(0deg); }
    50%  { transform: rotate(180deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes moveVertical {
    0%   { transform: translateY(-50%); }
    50%  { transform: translateY(50%); }
    100% { transform: translateY(-50%); }
  }

  @keyframes moveHorizontal {
    0%   { transform: translateX(-50%) translateY(-10%); }
    50%  { transform: translateX(50%)  translateY(10%); }
    100% { transform: translateX(-50%) translateY(-10%); }
  }

  .g1 {
    background: radial-gradient(circle at center, rgba(var(--color1), 0.8) 0%, rgba(var(--color1), 0) 50%) no-repeat;
    width: var(--circle-size); height: var(--circle-size);
    top: calc(50% - var(--circle-size) / 2); left: calc(50% - var(--circle-size) / 2);
    animation: moveVertical 30s ease infinite;
    will-change: transform;
  }

  .g2 {
    background: radial-gradient(circle at center, rgba(var(--color2), 0.8) 0%, rgba(var(--color2), 0) 50%) no-replace;
    width: var(--circle-size); height: var(--circle-size);
    top: calc(50% - var(--circle-size) / 2); left: calc(50% - var(--circle-size) / 2);
    transform-origin: calc(50% - 400px);
    animation: moveInCircle 20s reverse infinite;
    will-change: transform;
  }

  .g3 {
    background: radial-gradient(circle at center, rgba(var(--color3), 0.8) 0%, rgba(var(--color3), 0) 50%) no-repeat;
    width: var(--circle-size); height: var(--circle-size);
    top: calc(50% - var(--circle-size) / 2 + 200px); left: calc(50% - var(--circle-size) / 2 - 500px);
    transform-origin: calc(50% + 400px);
    animation: moveInCircle 40s linear infinite;
    will-change: transform;
  }

  .g4 {
    background: radial-gradient(circle at center, rgba(var(--color4), 0.8) 0%, rgba(var(--color4), 0) 50%) no-repeat;
    width: var(--circle-size); height: var(--circle-size);
    top: calc(50% - var(--circle-size) / 2); left: calc(50% - var(--circle-size) / 2);
    transform-origin: calc(50% - 200px);
    animation: moveHorizontal 40s ease infinite;
    opacity: 0.7;
    will-change: transform;
  }

  .g5 {
    background: radial-gradient(circle at center, rgba(var(--color5), 0.8) 0%, rgba(var(--color5), 0) 50%) no-repeat;
    width: calc(var(--circle-size) * 2); height: calc(var(--circle-size) * 2);
    top: calc(50% - var(--circle-size)); left: calc(50% - var(--circle-size));
    transform-origin: calc(50% - 800px) calc(50% + 200px);
    animation: moveInCircle 20s ease infinite;
    will-change: transform;
  }

  .interactive {
    background: radial-gradient(circle at center,
      rgba(var(--color-interactive), 0.8) 0%, rgba(var(--color-interactive), 0) 50%) no-repeat;
    width: 100%; height: 100%;
    top: -50%; left: -50%;
    opacity: 0.7;
    will-change: transform;
  }
</style>