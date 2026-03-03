<script lang="ts">
  import { onMount }      from 'svelte'
  import { circlesColor } from '$lib/stores/circlesColor'

  interface NavDot {
    id:    string
    label: string
    el:    HTMLElement
  }

  export let size        = 10
  export let activeSize  = 16
  export let gap         = 20
  export let color       = 'rgba(255,255,255,0.35)'
  export let activeColor = 'azure'
  export let appearDelay = 0
  export let showLabel   = true
  export let threshold   = 0.5

  // Live colour driven by the store; falls back to the prop
  $: resolvedActiveColor = $circlesColor || activeColor

  let dots:    NavDot[] = []
  let activeId = ''
  let visible  = false

  function scrollTo(el: HTMLElement): void {
    el.scrollIntoView({ behavior: 'smooth' })
  }

  function onKeydown(e: KeyboardEvent, el: HTMLElement): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      scrollTo(el)
    }
  }

  onMount(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.snap-section'))
    dots = sections.map((el) => ({ id: el.id || '', label: el.id || '', el }))
    if (dots.length) activeId = dots[0].id

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) activeId = (entry.target as HTMLElement).id ?? ''
      },
      { threshold },
    )

    sections.forEach((el) => observer.observe(el))
    const tid = setTimeout(() => { visible = true }, appearDelay)
    return () => { observer.disconnect(); clearTimeout(tid) }
  })
</script>

<nav
  class="section-nav"
  class:visible
  style="--gap: {gap}px;"
  aria-label="Section navigation"
>
  {#each dots as dot (dot.id)}
    {@const isActive = dot.id === activeId}
    <button
      class="dot"
      class:active={isActive}
      style="
        --size: {size}px;
        --active-size: {activeSize}px;
        --color: {color};
        --active-color: {resolvedActiveColor};
      "
      aria-label="Go to section {dot.label || dot.id}"
      aria-current={isActive ? 'true' : undefined}
      tabindex="0"
      on:click={() => scrollTo(dot.el)}
      on:keydown={(e) => onKeydown(e, dot.el)}
    >
      {#if showLabel && dot.label}
        <span class="label">{dot.label}</span>
      {/if}
    </button>
  {/each}
</nav>

<style>
  .section-nav {
    position: fixed;
    left: 24px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--gap, 20px);
    opacity: 0;
    transition: opacity 0.6s ease;
  }

  .section-nav.visible { opacity: 1; }

  .dot {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--active-size);
    height: var(--active-size);
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    outline: none;
  }

  .dot::before {
    content: '';
    display: block;
    border-radius: 50%;
    background: var(--color);
    width: var(--size);
    height: var(--size);
    transition:
      width      0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
      height     0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
      background 0.35s ease,
      box-shadow 0.35s ease;
  }

  .dot:hover::before,
  .dot:focus-visible::before {
    width: calc(var(--size) + 4px);
    height: calc(var(--size) + 4px);
    background: color-mix(in srgb, var(--active-color) 60%, var(--color));
  }

  .dot.active::before {
    width: var(--active-size);
    height: var(--active-size);
    background: var(--active-color);
    box-shadow: 0 0 10px 2px color-mix(in srgb, var(--active-color) 50%, transparent);
  }

  .label {
    position: absolute;
    left: calc(100% + 10px);
    white-space: nowrap;
    font-size: 0.72rem;
    font-weight: bold;
    font-family: 'ICTV', sans-serif;
    color: var(--active-color);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0;
    transform: translateX(-4px);
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .dot:hover .label,
  .dot:focus-visible .label { opacity: 1; transform: translateX(0); }
  .dot.active .label         { opacity: 0.55; transform: translateX(0); }

  @media (max-width: 800px) {
    .section-nav {
      left: 12px;
      gap: 14px;
    }
    .label { display: none; }
  }
</style>