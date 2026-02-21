<script lang="ts">
  import { onMount } from 'svelte';

  export let color: string = 'azure';
  export let label: string = 'swipe up';
  export let showLabel: boolean = true;
  export let appearDelay: number = 3000;
  export let appearDuration: number = 1000;
  export let size: number = 48;

  let visible: boolean = false;

  onMount(() => {
    const timer = setTimeout(() => { visible = true; }, appearDelay);
    return () => clearTimeout(timer);
  });
</script>

<div
  class="swipe-hint"
  class:visible
  role="img"
  aria-label="Swipe up indicator"
  style="--color: {color}; --size: {size}px; --appear-duration: {appearDuration}ms;"
>
  <div class="icon-wrap">

    <!-- Motion lines — three arcs that streak upward behind the finger -->
    <div class="motion-lines" aria-hidden="true">
      <svg class="motion-svg" viewBox="0 0 48 40" fill="none">
        <path class="mline ml-1"
          d="M14 38 Q14 20 18 4"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round"/>
        <path class="mline ml-2"
          d="M24 38 Q24 20 24 4"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round"/>
        <path class="mline ml-3"
          d="M34 38 Q34 20 30 4"
          stroke="currentColor" stroke-width="2"
          stroke-linecap="round"/>
      </svg>
    </div>

    <!-- The finger: just a rounded pill shape sliding upward -->
    <div class="finger-wrap">
      <svg class="finger-svg" viewBox="0 0 48 72" fill="none">
        <!-- Fingernail detail -->
        <rect x="17" y="10" width="14" height="9" rx="4"
          stroke="currentColor" stroke-width="1.5" opacity="0.45"/>
        <!-- Finger body — one clean rounded rect -->
        <rect x="13" y="8" width="22" height="50" rx="11"
          stroke="currentColor" stroke-width="3"
          stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Single knuckle crease -->
        <line x1="15" y1="38" x2="33" y2="38"
          stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" opacity="0.4"/>
      </svg>
    </div>

  </div>

  {#if showLabel}
    <span class="label">{label}</span>
  {/if}

  <!-- Chevrons pointing upward -->
  <div class="arrows" aria-hidden="true">
    <svg class="arrow arrow-2" viewBox="0 0 24 12" fill="none">
      <polyline points="2,10 12,2 22,10" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <svg class="arrow arrow-1" viewBox="0 0 24 12" fill="none">
      <polyline points="2,10 12,2 22,10" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
</div>

<style>
  .swipe-hint {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: var(--color);
    user-select: none;
    opacity: 0;
    transform: translateY(8px);
    transition:
      opacity   var(--appear-duration, 1000ms) ease,
      transform var(--appear-duration, 1000ms) cubic-bezier(0.22, 1, 0.36, 1);
  }
  .swipe-hint.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Icon container — stacks motion lines behind finger ── */
  .icon-wrap {
    position: relative;
    width: var(--size);
    height: calc(var(--size) * 2.4);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  /* ── Motion lines ── */
  .motion-lines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 60%;
  }
  .motion-svg {
    width: 100%;
    height: 100%;
  }

  .mline {
    stroke-dasharray: 60;
    stroke-dashoffset: 60;
    opacity: 0;
  }
  .ml-1 { animation: streak 2s ease-in-out 0.1s  infinite; }
  .ml-2 { animation: streak 2s ease-in-out 0.0s  infinite; }
  .ml-3 { animation: streak 2s ease-in-out 0.2s  infinite; }

  @keyframes streak {
    0%   { stroke-dashoffset: 60; opacity: 0;   }
    15%  { opacity: 0.6; }
    45%  { stroke-dashoffset: 0;  opacity: 0.5; }
    70%  { stroke-dashoffset: 0;  opacity: 0;   }
    100% { stroke-dashoffset: 60; opacity: 0;   }
  }

  /* ── Finger wrapper — slides up and back ── */
  .finger-wrap {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    animation: swipe-up 2s cubic-bezier(0.4, 0, 0.25, 1) infinite;
  }
  .finger-svg {
    width: var(--size);
    height: calc(var(--size) * 1.5);
    display: block;
  }

  @keyframes swipe-up {
    0%   { transform: translateX(-50%) translateY(0); }
    35%  { transform: translateX(-50%) translateY(calc(var(--size) * -0.7)); }
    62%  { transform: translateX(-50%) translateY(calc(var(--size) * -0.7)); }
    100% { transform: translateX(-50%) translateY(0); }
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
    0%, 100% { opacity: 0.35; }
    50%      { opacity: 0.7;  }
  }

  /* ── Chevrons ── */
  .arrows {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }
  .arrow { width: 20px; height: 10px; display: block; }
  .arrow-1 { animation: bounce-arrow 2s ease-in-out infinite; }
  .arrow-2 { animation: bounce-arrow 2s ease-in-out 0.22s infinite; opacity: 0.4; }

  @keyframes bounce-arrow {
    0%, 100% { transform: translateY(3px);  opacity: 0.25; }
    50%      { transform: translateY(-3px); opacity: 1;    }
  }
</style>