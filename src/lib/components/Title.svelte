<script lang="ts">
  import { onMount } from 'svelte';

  interface LetterState {
    char: string;
    isSpace: boolean;
    visible: boolean;
  }

  // --- Props ---
  export let title: string = 'Welcome';
  export let subtitle: string = 'Something worth reading';
  export let subtitle2: string = 'And seeing by yourself';
  export let letterDelay: number = 200;
  export let startDelay: number = 400;
  export let dropDistance: number = 36;
  /** Max rotation in degrees */
  export let maxTilt: number = 10;
  /** How lazily the tilt follows the mouse (0 = instant, higher = lazier) */
  export let lerpFactor: number = 0.06;

  // --- Letter animation state ---
  let letters: LetterState[] = [];
  let subtitleVisible: boolean = false;
  let subtitle2Visible: boolean = false;

  // --- Tilt state ---
  let currentRotX: number = 0;
  let currentRotY: number = 0;
  let targetRotX: number = 0;
  let targetRotY: number = 0;

  let rafId: number;
  let container: HTMLDivElement;

  function buildLetters(text: string): LetterState[] {
    return text.split('').map((char) => ({
      char,
      isSpace: char === ' ',
      visible: false,
    }));
  }

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  function onMouseMove(e: MouseEvent): void {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotX = -ny * maxTilt;
    targetRotY = nx * maxTilt;
  }

  function onMouseLeave(): void {
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

  onMount(() => {
    letters = buildLetters(title);

    letters.forEach((_, i) => {
      setTimeout(() => {
        letters[i].visible = true;
        letters = [...letters];
      }, startDelay + i * letterDelay);
    });

    const totalLetterTime = startDelay + title.length * letterDelay;

    setTimeout(() => { subtitleVisible = true; }, totalLetterTime + 300);
    setTimeout(() => { subtitle2Visible = true; }, totalLetterTime + 800);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(rafId);
    };
  });
</script>

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