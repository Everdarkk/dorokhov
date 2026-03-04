<script lang="ts">
  import { onMount } from 'svelte'

  // ─── Props ───────────────────────────────────────────────────────────────────

  /** 'first' = arrow down only | 'middle' = up + down | 'last' = up only */
  export let position:   'first' | 'middle' | 'last' = 'first'

  export let color       = 'rgba(255,255,255,0.75)'
  export let size        = 22          // px — arrow bounding box width
  export let strokeWidth = 2.2
  export let appearDelay = 2600        // ms before fade-in

  // ─── Visibility ──────────────────────────────────────────────────────────────

  let visible = false

  onMount(() => {
    const t = setTimeout(() => { visible = true }, appearDelay)
    return () => clearTimeout(t)
  })
</script>

<!-- STRUCTURE -->
<div
  class="indicator"
  class:visible
  class:is-first={position === 'first'}
  class:is-middle={position === 'middle'}
  class:is-last={position === 'last'}
  style="--color:{color}; --size:{size}px; --sw:{strokeWidth};"
  aria-hidden="true"
>

  {#if position === 'first'}
    <!-- ─ First section: cascade down ───────────────────────────────────────── -->
    <div class="group group-down">
      <svg class="arrow a1" viewBox="0 0 24 14" fill="none">
        <polyline points="2,2 12,12 22,2" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg class="arrow a2" viewBox="0 0 24 14" fill="none">
        <polyline points="2,2 12,12 22,2" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg class="arrow a3" viewBox="0 0 24 14" fill="none">
        <polyline points="2,2 12,12 22,2" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

  {:else if position === 'last'}
    <!-- ─ Last section: cascade up ──────────────────────────────────────────── -->
    <div class="group group-up">
      <svg class="arrow a3" viewBox="0 0 24 14" fill="none">
        <polyline points="2,12 12,2 22,12" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg class="arrow a2" viewBox="0 0 24 14" fill="none">
        <polyline points="2,12 12,2 22,12" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <svg class="arrow a1" viewBox="0 0 24 14" fill="none">
        <polyline points="2,12 12,2 22,12" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>

  {:else}
    <!-- ─ Middle sections: up on left, down on right ─────────────────────────── -->
    <div class="pair">
      <div class="group group-up">
        <svg class="arrow a3" viewBox="0 0 24 14" fill="none">
          <polyline points="2,12 12,2 22,12" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="arrow a2" viewBox="0 0 24 14" fill="none">
          <polyline points="2,12 12,2 22,12" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="arrow a1" viewBox="0 0 24 14" fill="none">
          <polyline points="2,12 12,2 22,12" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="group group-down">
        <svg class="arrow a1" viewBox="0 0 24 14" fill="none">
          <polyline points="2,2 12,12 22,2" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="arrow a2" viewBox="0 0 24 14" fill="none">
          <polyline points="2,2 12,12 22,2" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg class="arrow a3" viewBox="0 0 24 14" fill="none">
          <polyline points="2,2 12,12 22,2" stroke="currentColor" stroke-width="{strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  {/if}

</div>

<style>
  /* ── Wrapper ── */
  .indicator {
    position: absolute;
    bottom: 1.4rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;

    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--color);
    pointer-events: none;
    user-select: none;

    opacity: 0;
    transition: opacity 1s ease;
  }

  .indicator.visible { opacity: 1; }

  /* ── Middle layout: two groups side by side ── */
  .pair {
    display: flex;
    align-items: center;
    gap: clamp(18px, 4vw, 32px);
  }

  /* ── Arrow group: stacked chevrons ── */
  .group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .arrow {
    display: block;
    width: var(--size);
    height: calc(var(--size) * 0.58);
    flex-shrink: 0;
  }

  /* ─── Down: wave travels downward (a1 leads, a3 trails) ──────────────────── */

  .group-down .a1 { animation: wave-down 1.9s ease-in-out infinite 0s; }
  .group-down .a2 { animation: wave-down 1.9s ease-in-out infinite 0.20s; }
  .group-down .a3 { animation: wave-down 1.9s ease-in-out infinite 0.40s; }

  @keyframes wave-down {
    0%   { opacity: 0.12; transform: translateY(-3px); }
    40%  { opacity: 1.00; transform: translateY(2px);  }
    75%  { opacity: 0.50; transform: translateY(4px);  }
    100% { opacity: 0.12; transform: translateY(-3px); }
  }

  /* ─── Up: wave travels upward (a3 leads from bottom, a1 trails at top) ───── */

  .group-up .a3 { animation: wave-up 1.9s ease-in-out infinite 0s; }
  .group-up .a2 { animation: wave-up 1.9s ease-in-out infinite 0.20s; }
  .group-up .a1 { animation: wave-up 1.9s ease-in-out infinite 0.40s; }

  @keyframes wave-up {
    0%   { opacity: 0.12; transform: translateY(3px);  }
    40%  { opacity: 1.00; transform: translateY(-2px); }
    75%  { opacity: 0.50; transform: translateY(-4px); }
    100% { opacity: 0.12; transform: translateY(3px);  }
  }

  /* ─── Last section: slightly slower for "end of journey" feel ──────────── */
  .is-last .arrow { animation-duration: 2.6s !important; }

  @media (max-height: 850px) {
    .indicator { left: 3rem; }

    .arrow {
      width: calc(var(--size) * 0.82);
      height: calc(var(--size) * 0.82 * 0.58);
    }

    .pair { gap: 12px; }
  }

  /* ─── Mobile ── */
  @media (max-width: 480px) {
    .indicator { bottom: 0.9rem; }

    .arrow {
      width: calc(var(--size) * 0.82);
      height: calc(var(--size) * 0.82 * 0.58);
    }

    .pair { gap: 12px; }
  }

  /* Touch devices: snappier pulse */
  @media (hover: none) and (pointer: coarse) {
    .group-down .a1, .group-down .a2, .group-down .a3,
    .group-up .a1,   .group-up .a2,   .group-up .a3 {
      animation-duration: 1.4s !important;
    }
  }
</style>