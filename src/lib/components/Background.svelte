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
  export let sectionId        = ''

  let visible      = false
  let interBubble: HTMLDivElement
  let curX = 0, curY = 0
  let rafId: number
  let timer: ReturnType<typeof setTimeout>
  let active       = false
  let isTouchDevice = false

  function move(): void {
    // Touch devices: no interactive bubble — saves a RAF loop
    if (!isTouchDevice) {
      curX += ($mouse.x - curX) / 20
      curY += ($mouse.y - curY) / 20
      if (interBubble) {
        interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`
      }
    }
    if (active) rafId = requestAnimationFrame(move)
  }

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
    isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches

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

<!-- Hidden SVG registers the goo filter — one copy is fine (id is global) -->
<svg xmlns="http://www.w3.org/2000/svg" class="svg-filter" aria-hidden="true">
  <defs>
    <filter id="goo-{sectionId || 'default'}">
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
    --goo-filter: url(#goo-{sectionId || 'default'});
  "
>
  <div class="gradients-container">
    <div class="g1"></div>
    <div class="g2"></div>
    <div class="g3"></div>
    <div class="g4"></div>
    <div class="g5"></div>
    {#if !isTouchDevice}
      <div class="interactive" bind:this={interBubble}></div>
    {/if}
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
    /* isolation:isolate removed — it breaks stacking on iOS Safari in fixed els */
  }

  .gradient-bg.visible { opacity: 1; }

  .gradients-container {
    filter: var(--goo-filter) blur(40px);
    width: 100%;
    height: 100%;
    position: relative;
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
    background: radial-gradient(circle at center, rgba(var(--color2), 0.8) 0%, rgba(var(--color2), 0) 50%) no-repeat;
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

  /* On mobile: reduce animation count to save battery/GPU */
  @media (max-width: 800px) {
    .g3, .g5 { display: none; }
    .g1 { animation-duration: 40s; }
    .g2 { animation-duration: 28s; }
    .g4 { animation-duration: 52s; }
  }

  @media (prefers-reduced-motion: reduce) {
    .g1, .g2, .g3, .g4, .g5 { animation: none; }
  }
</style>