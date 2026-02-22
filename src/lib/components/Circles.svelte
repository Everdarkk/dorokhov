<script lang="ts">
  import { onMount } from 'svelte';

  // ─── Types ────────────────────────────────────────────────────────────────

  interface NavDot {
    id: string;
    label: string;
    el: HTMLElement;
  }

  // ─── Props ────────────────────────────────────────────────────────────────

  /** Dot diameter in px */
  export let size: number = 10;
  /** Active dot diameter in px */
  export let activeSize: number = 16;
  /** Gap between dots in px */
  export let gap: number = 20;
  /** Dot colour (inactive) */
  export let color: string = 'rgba(255,255,255,0.35)';
  /** Dot colour (active) */
  export let activeColor: string = 'azure';
  /** Delay before the nav fades in (ms) */
  export let appearDelay: number = 0;
  /** Show section id as a tooltip label on hover */
  export let showLabel: boolean = true;
  /** Fraction of section that must be visible to be "active" (0–1) */
  export let threshold: number = 0.5;

  // ─── State ────────────────────────────────────────────────────────────────

  let dots: NavDot[] = [];
  let activeId: string = '';
  let visible: boolean = false;
  let nav: HTMLElement;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function scrollToSection(el: HTMLElement): void {
    el.scrollIntoView({ behavior: 'smooth' });
  }

  function handleKeydown(e: KeyboardEvent, el: HTMLElement): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToSection(el);
    }
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onMount(() => {
    // Collect all snap-section elements in document order.
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>('.snap-section')
    );

    dots = sections.map((el): NavDot => ({
      id: el.id || '',
      label: el.id || '',
      el,
    }));

    if (dots.length > 0) activeId = dots[0].id;

    // Track which section is currently in view.
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            activeId = (entry.target as HTMLElement).id ?? '';
          }
        }
      },
      { threshold }
    );

    sections.forEach(el => observer.observe(el));

    // Fade the nav in after the optional delay.
    const tid = setTimeout(() => { visible = true; }, appearDelay);

    return () => {
      observer.disconnect();
      clearTimeout(tid);
    };
  });
</script>

<!-- STRUCTURE -->
<nav
  bind:this={nav}
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
        --size:        {size}px;
        --active-size: {activeSize}px;
        --color:       {color};
        --active-color:{activeColor};
      "
      aria-label="Go to section {dot.label || dot.id}"
      aria-current={isActive ? 'true' : undefined}
      tabindex="0"
      on:click={() => scrollToSection(dot.el)}
      on:keydown={(e) => handleKeydown(e, dot.el)}
    >
      {#if showLabel && dot.label}
        <span class="label">{dot.label}</span>
      {/if}
    </button>
  {/each}
</nav>

<!-- STYLE -->
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

  .section-nav.visible {
    opacity: 1;
  }

  /* ── Dot button ── */
  .dot {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    width: var(--active-size);   /* reserve the max size so layout never shifts */
    height: var(--active-size);

    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    outline: none;

    /* hit-area larger than the visual dot */
    /* (padding already provides it via the wrapper size) */
  }

  /* The actual circle — a pseudo-element so size/colour animate independently */
  .dot::before {
    content: '';
    display: block;
    border-radius: 50%;
    background: var(--color);
    width: var(--size);
    height: var(--size);
    transition:
      width  0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
      height 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
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

  /* ── Tooltip label ── */
  .label {
    position: absolute;
    left: calc(100% + 10px);
    white-space: nowrap;
    font-size: 0.72rem;
    font-family: inherit;
    color: var(--active-color);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    opacity: 0;
    transform: translateX(-4px);
    pointer-events: none;
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .dot:hover .label,
  .dot:focus-visible .label {
    opacity: 1;
    transform: translateX(0);
  }

  .dot.active .label {
    opacity: 0.55;
    transform: translateX(0);
  }
</style>