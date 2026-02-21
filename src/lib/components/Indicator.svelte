<script lang="ts">
  import { onMount } from 'svelte';
  import Scroll from './Scroll.svelte'
  import Swipe from './Swipe.svelte'

  export let appearDelay: number = 2000;
  export let crossfadeDuration: number = 800;
  export let holdDuration: number = 2800;
  export let color: string = 'azure';
  export let width: number = 32;
  export let size: number = 32;
  export let showLabel: boolean = false;

  type ActiveHint = 'scroll' | 'swipe';

  let mounted: boolean = false;
  let active: ActiveHint = 'scroll';

  // Each slot opacity is driven independently so the crossfade
  // can overlap (one fading out while the other fades in).
  let scrollOpacity: number = 0;
  let swipeOpacity: number = 0;

  function fadeTo(hint: ActiveHint): void {
    active = hint;
    if (hint === 'scroll') {
      scrollOpacity = 1;
      swipeOpacity  = 0;
    } else {
      scrollOpacity = 0;
      swipeOpacity  = 1;
    }
  }

  onMount(() => {
    // Initial appear after delay
    const appearTimer = setTimeout(() => {
      mounted = true;
      fadeTo('scroll');

      // Start the alternating loop
      const cycle = setInterval(() => {
        fadeTo(active === 'scroll' ? 'swipe' : 'scroll');
      }, holdDuration + crossfadeDuration);

      return () => clearInterval(cycle);
    }, appearDelay);

    return () => clearTimeout(appearTimer);
  });
</script>

<div class="indicator">
  <div
    class="slot"
    style="
      opacity: {scrollOpacity};
      transition: opacity {crossfadeDuration}ms ease;
      pointer-events: {active === 'scroll' ? 'auto' : 'none'};
    "
  >
    <Scroll
      {color}
      {width}
      {showLabel}
      appearDelay={3000}
    />
  </div>

  <div
    class="slot"
    style="
      opacity: {swipeOpacity};
      transition: opacity {crossfadeDuration}ms ease;
      pointer-events: {active === 'swipe' ? 'auto' : 'none'};
    "
  >
    <Swipe
      {color}
      {size}
      {showLabel}
      appearDelay={3000}
    />
  </div>
</div>

<style>
  .indicator {
    position: absolute;
    bottom: 1rem;
    margin-inline: auto;
    display: inline-grid;
  }

  /* Stack both slots on top of each other */
  .slot {
    grid-area: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>