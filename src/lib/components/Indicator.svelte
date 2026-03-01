<script lang="ts">
  import { onMount } from 'svelte'
  import Scroll from './Scroll.svelte'
  import Swipe  from './Swipe.svelte'

  export let appearDelay       = 2000
  export let crossfadeDuration = 800
  export let holdDuration      = 2800
  export let color             = 'azure'
  export let width             = 32
  export let size              = 32
  export let showLabel         = false

  type Hint = 'scroll' | 'swipe'

  let active:        Hint   = 'scroll'
  let scrollOpacity  = 0
  let swipeOpacity   = 0

  function fadeTo(hint: Hint): void {
    active        = hint
    scrollOpacity = hint === 'scroll' ? 1 : 0
    swipeOpacity  = hint === 'swipe'  ? 1 : 0
  }

  onMount(() => {
    const t = setTimeout(() => {
      fadeTo('scroll')
      const cycle = setInterval(
        () => fadeTo(active === 'scroll' ? 'swipe' : 'scroll'),
        holdDuration + crossfadeDuration,
      )
      return () => clearInterval(cycle)
    }, appearDelay)

    return () => clearTimeout(t)
  })
</script>

<div class="indicator">
  <!-- Both slots overlap via CSS grid; only one is opaque at a time -->
  <div
    class="slot"
    style="opacity: {scrollOpacity}; transition: opacity {crossfadeDuration}ms ease; pointer-events: {active === 'scroll' ? 'auto' : 'none'};"
  >
    <Scroll {color} {width} {showLabel} appearDelay={3000} />
  </div>

  <div
    class="slot"
    style="opacity: {swipeOpacity}; transition: opacity {crossfadeDuration}ms ease; pointer-events: {active === 'swipe' ? 'auto' : 'none'};"
  >
    <Swipe {color} {size} {showLabel} appearDelay={3000} />
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