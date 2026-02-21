<script lang="ts">
  import { onMount } from 'svelte';

  // ─── Types ────────────────────────────────────────────────────────────────

  interface LetterState {
    char: string;
    isSpace: boolean;
    visible: boolean;
  }

  // ─── Props ────────────────────────────────────────────────────────────────

  export let title: string = 'Welcome';
  export let subtitle: string = 'Something worth reading';
  export let subtitle2: string = 'And seeing by yourself';
  export let letterDelay: number = 200;
  export let startDelay: number = 400;
  export let dropDistance: number = 36;
  export let maxTilt: number = 10;
  export let lerpFactor: number = 0.06;
  export let intersectionThreshold: number = 0.5;

  // ─── State ────────────────────────────────────────────────────────────────

  let letters: LetterState[] = [];
  let subtitleVisible: boolean = false;
  let subtitle2Visible: boolean = false;

  let currentRotX: number = 0;
  let currentRotY: number = 0;
  let targetRotX: number = 0;
  let targetRotY: number = 0;

  let container: HTMLDivElement;
  let rafId: number;
  let observer: IntersectionObserver;
  let pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function buildLetters(text: string): LetterState[] {
    return text.split('').map((char): LetterState => ({
      char,
      isSpace: char === ' ',
      visible: false,
    }));
  }

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function findSnapSection(el: HTMLElement): HTMLElement {
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      if (node.classList.contains('snap-section')) return node;
      node = node.parentElement;
    }
    return el;
  }

  // ─── Animation ────────────────────────────────────────────────────────────

  /**
   * Cancel timeouts and snap everything to hidden — no transitions fire.
   * Called when the section LEAVES the viewport so the next entry starts clean.
   */
  function hideImmediately(): void {
    for (const id of pendingTimeouts) clearTimeout(id);
    pendingTimeouts = [];

    // Temporarily disable transitions so the reset is instant / invisible.
    if (container) container.classList.add('no-transition');

    letters = buildLetters(title);
    subtitleVisible = false;
    subtitle2Visible = false;

    // Re-enable transitions on the next frame so the enter animation plays smoothly.
    requestAnimationFrame(() => {
      if (container) container.classList.remove('no-transition');
    });
  }

  /** Animate letters in — called when the section ENTERS the viewport. */
  function playAnimation(): void {
    letters.forEach((_, i) => {
      const id = setTimeout(() => {
        letters[i].visible = true;
        letters = [...letters];
      }, startDelay + i * letterDelay);
      pendingTimeouts.push(id);
    });

    const totalLetterTime = startDelay + title.length * letterDelay;

    pendingTimeouts.push(
      setTimeout(() => { subtitleVisible = true; }, totalLetterTime + 300),
      setTimeout(() => { subtitle2Visible = true; }, totalLetterTime + 800),
    );
  }

  // ─── Tilt ─────────────────────────────────────────────────────────────────

  function handleMouseMove(e: MouseEvent): void {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotX = -ny * maxTilt;
    targetRotY = nx * maxTilt;
  }

  function handleMouseLeave(): void {
    targetRotX = 0;
    targetRotY = 0;
  }

  function tick(): void {
    currentRotX = lerp(currentRotX, targetRotX, lerpFactor);
    currentRotY = lerp(currentRotY, targetRotY, lerpFactor);

    if (container) {
      container.style.transform =
        `perspective(900px) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
    }

    rafId = requestAnimationFrame(tick);
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onMount(() => {
    // Start with letters hidden and ready.
    letters = buildLetters(title);

    const target = findSnapSection(container);

    observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Section entered — play the drop-in animation.
            playAnimation();
          } else {
            // Section left — instantly reset so next entry starts from hidden.
            hideImmediately();
          }
        }
      },
      { threshold: intersectionThreshold },
    );

    observer.observe(target);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      for (const id of pendingTimeouts) clearTimeout(id);
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(rafId);
    };
  });
</script>

<!-- ─── Markup ─────────────────────────────────────────────────────────── -->
<div class="container" bind:this={container}>
  <h1 class="title" aria-label={title}>
    {#each letters as letter, i (i)}
      {#if letter.isSpace}
        <span class="letter space">&nbsp;</span>
      {:else}
        <span
          class="letter"
          class:visible={letter.visible}
          style="--drop: {dropDistance}px;"
        >{letter.char}</span>
      {/if}
    {/each}
  </h1>

  <p class="subtitle" class:visible={subtitleVisible}>
    {subtitle}
  </p>

  <p class="subtitle2" class:visible={subtitle2Visible}>
    {subtitle2}
  </p>
</div>

<!-- ─── Styles ────────────────────────────────────────────────────────── -->
<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 100;
    padding: 1rem;
    will-change: transform;
    transform-style: preserve-3d;
    transform-origin: center center;
  }

  /* Suppress all child transitions during an instant reset. */
  .container.no-transition *,
  .container.no-transition {
    transition: none !important;
  }

  .title {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    overflow: hidden;
    padding-bottom: 0.05em;
    font-size: 150px;
    text-transform: uppercase;
    color: azure;
  }

  .letter {
    display: inline-block;
    opacity: 0;
    transform: translateY(calc(-1 * var(--drop, 36px)));
    transition:
      opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .letter.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .letter.space {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .subtitle {
    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity 0.9s ease,
      transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
    font-size: 50px;
    color: azure;
  }

  .subtitle.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .subtitle2 {
    opacity: 0;
    transform: translateY(10px);
    transition:
      opacity 0.9s ease,
      transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
    font-size: 40px;
    color: azure;
  }

  .subtitle2.visible {
    opacity: 1;
    transform: translateY(0);
  }
</style>