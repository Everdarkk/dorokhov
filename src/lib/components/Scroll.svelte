<script lang="ts">
  import { onMount } from "svelte"

  // Props let the parent tweak colours and sizing.

  export let color: string = 'azure';
  export let width: number = 30;
  /** Controls how tall the mouse body is relative to width */
  export let aspectRatio: number = 1.65;
  /** Label shown beneath the icon */
  export let label: string = 'scroll down';
  /** Hide label entirely */
  export let showLabel: boolean = true;
  /** Appear delay */
  export let appearDelay: number = 3000

  let scrollHint: boolean = false

  $: height = Math.round(width * aspectRatio);
  $: borderRadius = Math.round(width * 0.5);
  $: wheelW = Math.round(width * 0.18);
  $: wheelH = Math.round(height * 0.22);
  $: wheelTop = Math.round(height * 0.18);

  // Lifecycle
  onMount(() => {
    // Delay before appear
    setTimeout(() => { scrollHint = true; }, appearDelay);
  })
</script>

<div
  class="scroll-hint"
  class:visible={scrollHint}
  role="img"
  aria-label="Scroll down indicator"
  style="--color: {color}; --w: {width}px; --h: {height}px; --br: {borderRadius}px;
         --whl-w: {wheelW}px; --whl-h: {wheelH}px; --whl-top: {wheelTop}px;"
>
  <!-- Mouse body drawn entirely with CSS / div -->
  <div class="mouse">
    <!-- Left click zone -->
    <div class="click-zone left"></div>
    <!-- Right click zone -->
    <div class="click-zone right"></div>
    <!-- Centre divide line -->
    <div class="divider"></div>
    <!-- Animated scroll wheel -->
    <div class="wheel-track">
      <div class="wheel"></div>
    </div>
  </div>

  {#if showLabel}
    <span class="label">{label}</span>
  {/if}

  <!-- Bouncing arrow chevrons -->
  <div class="arrows" aria-hidden="true">
    <svg class="arrow arrow-1" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="2,2 12,10 22,2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg class="arrow arrow-2" viewBox="0 0 24 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="2,2 12,10 22,2" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</div>

<style>
  /* ── Wrapper ── */
  .scroll-hint {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: var(--color);
    user-select: none;
    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity 0.9s ease,
      transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .scroll-hint.visible {
    opacity: 1;
    transform: translateY(0px);
    transition:
      opacity 0.9s ease,
      transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* ── Mouse body ── */
  .mouse {
    position: relative;
    width: var(--w);
    height: var(--h);
    border: 2px solid var(--color);
    border-radius: var(--br);
    overflow: hidden;
    opacity: 0.9;
  }

  /* ── Click zones (top half split) ── */
  .click-zone {
    position: absolute;
    top: 0;
    height: 42%;
    width: 50%;
    border-bottom: 1.5px solid var(--color);
    opacity: 0.35;
  }
  .click-zone.left  { left: 0;   border-right: 0.75px solid var(--color); }
  .click-zone.right { right: 0;  border-left:  0.75px solid var(--color); }

  /* ── Centre vertical divider (bottom half) ── */
  .divider {
    position: absolute;
    top: 42%;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 1.5px;
    background: var(--color);
    opacity: 0.2;
  }

  /* ── Wheel track (clipping container) ── */
  .wheel-track {
    position: absolute;
    top: var(--whl-top);
    left: 50%;
    transform: translateX(-50%);
    width: var(--whl-w);
    height: var(--whl-h);
    border-radius: 999px;
    overflow: hidden;
    /* subtle inner-glow so the track is visible */
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color) 40%, transparent);
  }

  /* ── Scroll wheel pill ── */
  .wheel {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    /* pill is slightly shorter than the track so it visibly slides */
    height: 55%;
    border-radius: 999px;
    background: var(--color);
    animation: scroll-wheel 1.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  }

  @keyframes scroll-wheel {
    0%   { top: -55%; opacity: 0; }
    20%  { opacity: 1; }
    80%  { opacity: 1; }
    100% { top: 100%;  opacity: 0; }
  }

  /* ── Label ── */
  .label {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    opacity: 0.55;
    font-family: 'Lato', 'Helvetica Neue', sans-serif;
    animation: fade-pulse 2s ease-in-out infinite;
  }

  @keyframes fade-pulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.75; }
  }

  /* ── Chevron arrows ── */
  .arrows {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    margin-top: -4px;
  }

  .arrow {
    width: 20px;
    height: 10px;
    display: block;
  }

  .arrow-1 {
    animation: bounce-arrow 1.6s ease-in-out infinite;
  }
  .arrow-2 {
    animation: bounce-arrow 1.6s ease-in-out 0.22s infinite;
    opacity: 0.45;
  }

  @keyframes bounce-arrow {
    0%, 100% { transform: translateY(-3px); opacity: 0.3; }
    50%       { transform: translateY(3px);  opacity: 1;   }
  }
</style>