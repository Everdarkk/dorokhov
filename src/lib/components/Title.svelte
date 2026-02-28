<script lang="ts">
  import { onMount } from 'svelte'

  // ─── Types ───────────────────────────────────────────────────────────────────

  interface LetterState {
    /** The character to display */
    char:    string
    /** True for space characters — rendered as non-animated gaps */
    isSpace: boolean
    /** Drives the CSS .letter--visible class — triggers entrance transition */
    visible: boolean
    /**
     * Direction of the entrance drop.
     * true  = letter enters from ABOVE  (negative translateY → 0)
     * false = letter enters from BELOW  (positive translateY → 0)
     * Alternates per non-space letter so adjacent letters "zip" toward each other.
     */
    fromAbove: boolean
    /**
     * Per-letter phase offset for cursor-stretch noise (radians).
     * Baked at build time from the golden ratio for good spread across letters.
     */
    noisePhase: number
  }

  /** Lerped cursor-stretch offset for one letter, in viewport px */
  interface LetterOffset {
    ox: number
    oy: number
  }

  // ─── Props ───────────────────────────────────────────────────────────────────

  /** Main heading text */
  export let title:                 string = 'Welcome'
  /** Left subtitle */
  export let subtitle:              string = 'Something worth reading'
  /** Right subtitle */
  export let subtitle2:             string = 'And seeing by yourself'
  /** Delay before first letter appears (ms) */
  export let startDelay:            number = 400
  /** Time between successive letters (ms) */
  export let letterDelay:           number = 80
  /** Entrance travel distance (px) */
  export let dropDistance:          number = 48
  /** Max container tilt (deg) */
  export let maxTilt:               number = 6
  /** Lerp factor for container tilt */
  export let lerpFactor:            number = 0.055
  /** IntersectionObserver threshold */
  export let intersectionThreshold: number = 0.5

  // ─── State ───────────────────────────────────────────────────────────────────

  let letters:          LetterState[]  = []
  let letterOffsets:    LetterOffset[] = []
  let subtitleVisible:  boolean        = false
  let subtitle2Visible: boolean        = false
  /** Drives the glass blob entrance — appears first, before letters. */
  let blobVisible:      boolean        = false

  // Container 3-D tilt (lerped values and targets)
  let currentRotX = 0
  let currentRotY = 0
  let targetRotX  = 0
  let targetRotY  = 0

  // Raw cursor position in viewport px
  let cursorX = 0
  let cursorY = 0

  // ─── DOM refs ────────────────────────────────────────────────────────────────

  let container: HTMLDivElement
  let letterEls: (HTMLSpanElement | null)[] = []

  // ─── RAF + timeout handles ───────────────────────────────────────────────────

  let rafId:           number
  let pendingTimeouts: ReturnType<typeof setTimeout>[] = []

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }

  function findSnapSection(el: HTMLElement): HTMLElement {
    let node: HTMLElement | null = el.parentElement
    while (node) {
      if (node.classList.contains('snap-section')) return node
      node = node.parentElement
    }
    return el
  }

  /**
   * Builds the LetterState array from a string.
   * - fromAbove alternates for every non-space character
   * - noisePhase uses golden-ratio multiples for uniform spread
   */
  function buildLetters(text: string): LetterState[] {
    let letterCount = 0
    return text.split('').map((char): LetterState => {
      const isSpace = char === ' '
      const fromAbove = isSpace ? true : letterCount++ % 2 === 0
      return {
        char,
        isSpace,
        visible:    false,
        fromAbove,
        noisePhase: letterCount * 1.6180339887, // golden ratio → even spread
      }
    })
  }

  // ─── Entrance / exit ─────────────────────────────────────────────────────────

  /**
   * Plays the staggered entrance:
   *   letters appear one by one (alternating above/below)
   *   then subtitles slide in from opposite sides.
   */
  function playAnimation(): void {
    // Blob appears first — gives it time to "inflate" before letters arrive.
    const BLOB_DELAY = 80
    pendingTimeouts.push(
      setTimeout(() => { blobVisible = true }, BLOB_DELAY),
    )

    letters.forEach((_, i) => {
      const id = setTimeout(() => {
        letters[i].visible = true
        letters = [...letters]
      }, startDelay + i * letterDelay)
      pendingTimeouts.push(id)
    })

    const totalLetterMs = startDelay + letters.length * letterDelay

    pendingTimeouts.push(
      setTimeout(() => { subtitleVisible  = true }, totalLetterMs + 200),
      setTimeout(() => { subtitle2Visible = true }, totalLetterMs + 340),
    )
  }

  /**
   * Instantly resets everything to hidden without firing transitions.
   */
  function hideImmediately(): void {
    for (const id of pendingTimeouts) clearTimeout(id)
    pendingTimeouts = []

    if (container) container.classList.add('no-transition')

    letters          = buildLetters(title)
    letterOffsets    = letters.map(() => ({ ox: 0, oy: 0 }))
    subtitleVisible  = false
    subtitle2Visible = false
    blobVisible      = false

    requestAnimationFrame(() => {
      if (container) container.classList.remove('no-transition')
    })
  }

  // ─── Mouse handlers ──────────────────────────────────────────────────────────

  function handleMouseMove(e: MouseEvent): void {
    cursorX = e.clientX
    cursorY = e.clientY

    const nx = (e.clientX / window.innerWidth)  * 2 - 1
    const ny = (e.clientY / window.innerHeight) * 2 - 1
    targetRotX = -ny * maxTilt
    targetRotY =  nx * maxTilt
  }

  function handleMouseLeave(): void {
    targetRotX = 0
    targetRotY = 0
  }

  // ─── Main RAF loop ───────────────────────────────────────────────────────────

  /**
   * Runs every animation frame. Three layers of motion:
   *
   *  1. CONTAINER TILT — the whole block rotates toward the cursor (3-D).
   *
   *  2. PER-LETTER ATTRACTION — each letter is pulled toward the cursor
   *     with force = MAX_PULL / (1 + (dist/PULL_RADIUS)²).
   *     This is an inverse-square-like falloff: strong close, fades far.
   *
   *  3. PER-LETTER NOISE — sinusoidal oscillation with unique phase per letter.
   *     Amplitude scales with cursor proximity so letters only vibrate when
   *     the cursor is nearby. Separate frequencies on X/Y for chaotic feel.
   *
   *  Offsets are lerped so all motion is smooth and "floaty".
   *  CSS vars --ox/--oy on each <span> are written directly — no Svelte reactivity
   *  needed here, direct DOM write is intentional for 60 fps performance.
   */
  function tick(timestamp: number): void {
    // 1 — Container tilt
    currentRotX = lerp(currentRotX, targetRotX, lerpFactor)
    currentRotY = lerp(currentRotY, targetRotY, lerpFactor)
    if (container) {
      container.style.setProperty('--rot-x', `${currentRotX.toFixed(3)}deg`)
      container.style.setProperty('--rot-y', `${currentRotY.toFixed(3)}deg`)
    }

    // Tuning constants
    const PULL_RADIUS     = 240  // px — half-power distance for attraction
    const MAX_PULL        = 26   // px — max offset at zero distance
    const NOISE_RADIUS    = 320  // px — noise fades beyond this distance
    const MAX_NOISE_AMP   = 5    // px — peak sinusoidal noise amplitude
    const NOISE_FREQ_BASE = 0.0028 // oscillations per ms (≈ ~2.8 Hz base)
    const LERP_LETTER     = 0.085  // smoothing factor — lower = floatier

    letters.forEach((letter, i) => {
      if (letter.isSpace || !letterEls[i]) return

      const el = letterEls[i]!

      // Skip if element not yet in layout (entrance hasn't started)
      const rect = el.getBoundingClientRect()
      if (rect.width === 0) return

      const lx   = rect.left + rect.width  / 2
      const ly   = rect.top  + rect.height / 2
      const dx   = cursorX - lx
      const dy   = cursorY - ly
      const dist = Math.hypot(dx, dy)

      // 2 — Attraction toward cursor
      const force = MAX_PULL / (1 + (dist / PULL_RADIUS) ** 2)
      const ux    = dist > 0 ? dx / dist : 0
      const uy    = dist > 0 ? dy / dist : 0
      const attrX = ux * force
      const attrY = uy * force

      // 3 — Noise: amplitude proportional to proximity, phase unique per letter
      const noiseAmp  = MAX_NOISE_AMP * Math.max(0, 1 - dist / NOISE_RADIUS)
      const phaseX    = timestamp * NOISE_FREQ_BASE * (1 + (letter.noisePhase % 0.6)) + letter.noisePhase
      const phaseY    = timestamp * NOISE_FREQ_BASE * (0.7 + (letter.noisePhase % 0.4)) + letter.noisePhase + 1.3
      const noiseX    = noiseAmp * Math.sin(phaseX)
      const noiseY    = noiseAmp * Math.cos(phaseY)

      // Lerp toward target offset
      if (!letterOffsets[i]) letterOffsets[i] = { ox: 0, oy: 0 }
      letterOffsets[i].ox = lerp(letterOffsets[i].ox, attrX + noiseX, LERP_LETTER)
      letterOffsets[i].oy = lerp(letterOffsets[i].oy, attrY + noiseY, LERP_LETTER)

      // Write directly to DOM — bypasses Svelte reactivity for perf
      el.style.setProperty('--ox', `${letterOffsets[i].ox.toFixed(2)}px`)
      el.style.setProperty('--oy', `${letterOffsets[i].oy.toFixed(2)}px`)
    })

    rafId = requestAnimationFrame(tick)
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  onMount(() => {
    letters       = buildLetters(title)
    letterOffsets = letters.map(() => ({ ox: 0, oy: 0 }))

    // Initialise cursor to viewport centre so letters don't jerk on load
    cursorX = window.innerWidth  / 2
    cursorY = window.innerHeight / 2

    const target = findSnapSection(container)

    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            playAnimation()
          } else {
            hideImmediately()
          }
        }
      },
      { threshold: intersectionThreshold },
    )

    observer.observe(target)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    rafId = requestAnimationFrame(tick)

    return (): void => {
      for (const id of pendingTimeouts) clearTimeout(id)
      observer.disconnect()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(rafId)
    }
  })
</script>

<!-- STRUCTURE -->
<div
  class="container"
  bind:this={container}
  style="--rot-x: 0deg; --rot-y: 0deg;"
>

  <!--
    Glass blob sits at z-index 0, behind the title (z-index 1).
    Sized with clamp so it always wraps snugly around the title text
    regardless of viewport width.
    Animates border-radius slowly for organic breathing feel.
  -->
  <div class="glass-blob" class:glass-blob--visible={blobVisible} aria-hidden="true"></div>

  <h1 class="title" aria-label={title}>
    {#each letters as letter, i (i)}
      {#if letter.isSpace}
        <span class="letter letter--space">&nbsp;</span>
      {:else}
        <!--
          --drop: entrance direction (negative = from above, positive = from below)
          --ox, --oy: cursor-stretch offset written by RAF loop each frame
        -->
        <span
          class="letter"
          class:letter--visible={letter.visible}
          style="
            --drop: {letter.fromAbove ? `-${dropDistance}px` : `${dropDistance}px`};
            --ox: 0px;
            --oy: 0px;
          "
          bind:this={letterEls[i]}
        >{letter.char}</span>
      {/if}
    {/each}
  </h1>

  <!--
    Subtitles float freely — no blob, no border.
    Left one slides in from the left, right one from the right.
    Both use the same .subtitle--visible trigger.
  -->
  <p
    class="subtitle subtitle--left"
    class:subtitle--visible={subtitleVisible}
  >{subtitle}</p>

  <p
    class="subtitle subtitle--right"
    class:subtitle--visible={subtitle2Visible}
  >{subtitle2}</p>

</div>

<!-- STYLE -->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Onest:wght@300;400&display=swap');

  /* ── Transition kill — applied for one frame during hideImmediately() ── */
  .container.no-transition *,
  .container.no-transition {
    transition: none !important;
  }

  /* ── Root container ── */
  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    z-index: 100;
    padding: 2rem;
    width: 100%;

    /*
      3-D tilt: CSS vars --rot-x / --rot-y are written by the RAF loop
      every frame via container.style.setProperty — no Svelte reactivity needed.
    */
    transform: perspective(900px) rotateX(var(--rot-x)) rotateY(var(--rot-y));
    transform-style: preserve-3d;
    transform-origin: center center;
    will-change: transform;
  }

  /* ── Glass blob ─────────────────────────────────────────────────────────────
     Organic rounded rectangle centered behind the h1.
     Uses backdrop-filter for the frosted-glass look.
     z-index 0 keeps it below the title text (z-index 1).
  ─────────────────────────────────────────────────────────────────────────── */
  .glass-blob {
    position: absolute;
    width:  clamp(320px, 70vw, 920px);
    height: clamp(320px, 30vw, 650px);

    /* Organic rounded rect — not a circle */
    border-radius: 44% 56% 52% 48% / 55% 45% 55% 45%;

    /* Frosted glass */
    background: rgba(255, 255, 255, 0.045);
    backdrop-filter: blur(24px) saturate(1.25);
    -webkit-backdrop-filter: blur(24px) saturate(1.25);

    /* Luminous hairline border */
    border: 1px solid rgba(255, 255, 255, 0.10);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.13),
      0 8px 48px rgba(0, 0, 0, 0.22),
      0 2px 10px rgba(0, 0, 0, 0.15);

    z-index: 0;

    /* Slow organic shape breathe */
    animation: blob-breathe 14s ease-in-out infinite alternate;

    /* Hidden state — same "deflated bubble" pattern as About / Stack cards */
    opacity: 0;
    transform: scale(0.5);
    filter: blur(16px);
    transition:
      opacity   0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
      filter    0.7s ease;
  }

  /* Inflates into place with springy overshoot */
  .glass-blob--visible {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }

  @keyframes blob-breathe {
    0%   { border-radius: 44% 56% 52% 48% / 55% 45% 55% 45%; }
    25%  { border-radius: 55% 45% 44% 56% / 48% 52% 44% 56%; }
    50%  { border-radius: 48% 52% 58% 42% / 52% 48% 60% 40%; }
    75%  { border-radius: 38% 62% 50% 50% / 58% 42% 52% 48%; }
    100% { border-radius: 60% 40% 48% 52% / 44% 56% 48% 52%; }
  }

  /* ── Title ── */
  .title {
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin: 0;
    padding: 0.08em 0.5em;
    overflow: visible; /* letters can extend beyond heading box during stretch */

    font-family: 'Bulbasaur', sans-serif;
    font-size: clamp(2.8rem, 9vw, 8.5rem);
    font-weight: 900;
    letter-spacing: 0.09em;
    line-height: 1.05;
    color: #fff;
    text-shadow: 0 2px 28px rgba(0, 0, 0, 0.3);
  }

  /* ── Letter ─────────────────────────────────────────────────────────────────
     Hidden state:
       opacity: 0
       translateY(--drop)  = entrance direction (above or below)
       translate(--ox, --oy) = cursor offset (0 initially, updated by RAF)

     All three must be in a single transform — they compose.

     Once .letter--visible is added:
       opacity → 1
       translateY → 0
       translate(--ox, --oy) stays active and updated every frame

     After entrance transition ends (0.7s), only the cursor offset remains
     in the transform, driven by the RAF loop.
  ─────────────────────────────────────────────────────────────────────────── */
  .letter {
    display: inline-block;
    opacity: 0;
    transform:
      translateY(var(--drop, -48px))
      translate(var(--ox, 0px), var(--oy, 0px));
    transition:
      opacity   0.65s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }

  .letter--visible {
    opacity: 1;
    transform:
      translateY(0)
      translate(var(--ox, 0px), var(--oy, 0px));
  }

  .letter--space {
    opacity: 1;
    transform: none;
    transition: none;
    white-space: pre;
  }

  /* ── Subtitles ───────────────────────────────────────────────────────────────
     Left slides in from the left, right from the right.
     Both float freely without a blob.
  ─────────────────────────────────────────────────────────────────────────── */
  .subtitle {
    position: relative;
    text-align: center;
    z-index: 1;
    margin: 0;
    font-family: 'ICTV', sans-serif;
    font-size: clamp(1rem, 2vw, 2rem);
    font-weight: 100;
    color: rgba(255, 255, 255, 0.70);
    text-shadow: 0 1px 10px rgba(255, 255, 255, 0.12);
    white-space: nowrap;
    width: 100%;

    opacity: 0;
    transition:
      opacity   0.85s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .subtitle--left {
    transform: translateX(-50px);
  }

  .subtitle--right {
    transform: translateX(50px);
  }

  .subtitle--visible {
    opacity: 1;
    transform: translateX(0);
  }

  /* ── Responsive ── */
  @media (max-width: 600px) {
    .subtitle--left,
    .subtitle--right {
      text-align: center;
      padding-left: 1rem;
      padding-right: 1rem;
      white-space: normal;
    }
  }
</style>