<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  // ─── Props ────────────────────────────────────────────────────────────────

  export let colorBg1: string = 'rgb(25, 11, 38)';
  export let colorBg2: string = 'rgb(36, 6, 64)';

  export let color1: string = '181,159,201';
  export let color2: string = '157,127,183';
  export let color3: string = '132,95,165';
  export let color4: string = '114,83,113';
  export let color5: string = '6,37,73';
  export let colorInteractive: string = '137,237,247';

  export let circleSize: string = '80%';
  export let blending: string = 'hard-light';

  /** Delay in ms before the fade-in starts */
  export let fadeDelay: number = 0;
  /** Duration of the fade-in in ms */
  export let fadeDuration: number = 1800;

  // ─── Fade-in state ────────────────────────────────────────────────────────

  let visible: boolean = false;

  // ─── Interactive blob tracking ────────────────────────────────────────────

  let curX: number = 0;
  let curY: number = 0;
  let tgX: number = 0;
  let tgY: number = 0;
  let rafId: number;
  let interBubble: HTMLDivElement;

  function move(): void {
    curX += (tgX - curX) / 20;
    curY += (tgY - curY) / 20;
    interBubble.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
    rafId = requestAnimationFrame(move);
  }

  function onMouseMove(e: MouseEvent): void {
    tgX = e.clientX;
    tgY = e.clientY;
  }

  let timer: ReturnType<typeof setTimeout>;

  onMount((): void => {
    move();
    window.addEventListener('mousemove', onMouseMove);

    // Small timeout so the browser has painted the initial opacity: 0
    // state before we flip visible — guarantees the transition fires
    timer = setTimeout(() => { visible = true; }, fadeDelay);
  });

  onDestroy((): void => {
    if (!browser) return;
    clearTimeout(timer);
    cancelAnimationFrame(rafId);
    window.removeEventListener('mousemove', onMouseMove);
  });
</script>

<svg xmlns="http://www.w3.org/2000/svg" class="svg-filter">
  <defs>
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
      <feColorMatrix
        in="blur"
        mode="matrix"
        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
        result="goo"
      />
      <feBlend in="SourceGraphic" in2="goo" />
    </filter>
  </defs>
</svg>

<div
  class="gradient-bg"
  class:visible
  style="
    --color-bg1: {colorBg1};
    --color-bg2: {colorBg2};
    --color1: {color1};
    --color2: {color2};
    --color3: {color3};
    --color4: {color4};
    --color5: {color5};
    --color-interactive: {colorInteractive};
    --circle-size: {circleSize};
    --blending: {blending};
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
  .svg-filter {
    display: none;
  }

  .gradient-bg {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    background: linear-gradient(40deg, var(--color-bg1), var(--color-bg2));
    z-index: 0;

    /* Fade-in */
    opacity: 0;
    transition: opacity var(--fade-duration, 1800ms) ease;
  }

  .gradient-bg.visible {
    opacity: 1;
  }

  .gradients-container {
    filter: url(#goo) blur(40px);
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
    background: radial-gradient(circle at center,
      rgba(var(--color1), 0.8) 0%, rgba(var(--color1), 0) 50%) no-repeat;
    width: var(--circle-size);
    height: var(--circle-size);
    top:  calc(50% - var(--circle-size) / 2);
    left: calc(50% - var(--circle-size) / 2);
    transform-origin: center center;
    animation: moveVertical 30s ease infinite;
  }

  .g2 {
    background: radial-gradient(circle at center,
      rgba(var(--color2), 0.8) 0%, rgba(var(--color2), 0) 50%) no-repeat;
    width: var(--circle-size);
    height: var(--circle-size);
    top:  calc(50% - var(--circle-size) / 2);
    left: calc(50% - var(--circle-size) / 2);
    transform-origin: calc(50% - 400px);
    animation: moveInCircle 20s reverse infinite;
  }

  .g3 {
    background: radial-gradient(circle at center,
      rgba(var(--color3), 0.8) 0%, rgba(var(--color3), 0) 50%) no-repeat;
    width: var(--circle-size);
    height: var(--circle-size);
    top:  calc(50% - var(--circle-size) / 2 + 200px);
    left: calc(50% - var(--circle-size) / 2 - 500px);
    transform-origin: calc(50% + 400px);
    animation: moveInCircle 40s linear infinite;
  }

  .g4 {
    background: radial-gradient(circle at center,
      rgba(var(--color4), 0.8) 0%, rgba(var(--color4), 0) 50%) no-repeat;
    width: var(--circle-size);
    height: var(--circle-size);
    top:  calc(50% - var(--circle-size) / 2);
    left: calc(50% - var(--circle-size) / 2);
    transform-origin: calc(50% - 200px);
    animation: moveHorizontal 40s ease infinite;
    opacity: 0.7;
  }

  .g5 {
    background: radial-gradient(circle at center,
      rgba(var(--color5), 0.8) 0%, rgba(var(--color5), 0) 50%) no-repeat;
    width:  calc(var(--circle-size) * 2);
    height: calc(var(--circle-size) * 2);
    top:  calc(50% - var(--circle-size));
    left: calc(50% - var(--circle-size));
    transform-origin: calc(50% - 800px) calc(50% + 200px);
    animation: moveInCircle 20s ease infinite;
  }

  .interactive {
    background: radial-gradient(circle at center,
      rgba(var(--color-interactive), 0.8) 0%,
      rgba(var(--color-interactive), 0)   50%) no-repeat;
    width: 100%;
    height: 100%;
    top:  -50%;
    left: -50%;
    opacity: 0.7;
  }
</style>