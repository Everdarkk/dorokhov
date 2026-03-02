<script lang="ts">
  import { onMount }    from 'svelte'
  import { lerp, findSnapSection } from '$lib/utils/animation'
  import { mouse }      from '$lib/stores/mouse'

  interface Letter {
    char:       string
    isSpace:    boolean
    visible:    boolean
    fromAbove:  boolean
    noisePhase: number
  }

  // ─── Props ───────────────────────────────────────────────────────────────────

  export let title                  = 'Welcome'
  export let subtitle               = 'Something worth reading'
  export let subtitle2              = 'And seeing by yourself'
  export let startDelay             = 400
  export let letterDelay            = 80
  export let dropDistance           = 48
  export let maxTilt                = 6
  export let lerpFactor             = 0.055
  export let intersectionThreshold  = 0.5

  // ─── State ───────────────────────────────────────────────────────────────────

  let letters:         Letter[]   = []
  let letterOffsets:   { ox: number; oy: number }[] = []
  let subtitleVisible  = false
  let subtitle2Visible = false
  let blobVisible      = false

  let currentRotX = 0, currentRotY = 0
  let targetRotX  = 0, targetRotY  = 0

  let container: HTMLDivElement
  let letterEls: (HTMLSpanElement | null)[] = []

  let rafId:   number
  let pending: ReturnType<typeof setTimeout>[] = []

  // ─── Rect cache — updated lazily, not every frame ────────────────────────────
  // getBoundingClientRect() is a layout read that forces reflow.
  // We cache rects and only invalidate on resize.

  let cachedRects: (DOMRect | null)[] = []
  let rectsDirty = true

  function invalidateRects(): void { rectsDirty = true }

  function refreshRects(): void {
    for (let i = 0; i < letterEls.length; i++) {
      const el = letterEls[i]
      cachedRects[i] = el ? el.getBoundingClientRect() : null
    }
    rectsDirty = false
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  function buildLetters(text: string): Letter[] {
    let count = 0
    return text.split('').map((char): Letter => {
      const isSpace = char === ' '
      const fromAbove = isSpace ? true : count++ % 2 === 0
      return { char, isSpace, visible: false, fromAbove, noisePhase: count * 1.6180339887 }
    })
  }

  // ─── Entrance / exit ─────────────────────────────────────────────────────────

  function playAnimation(): void {
    pending.push(setTimeout(() => { blobVisible = true }, 80))
    letters.forEach((_, i) => {
      pending.push(setTimeout(() => {
        letters[i].visible = true
        letters = [...letters]
      }, startDelay + i * letterDelay))
    })
    const afterLetters = startDelay + letters.length * letterDelay
    pending.push(
      setTimeout(() => { subtitleVisible  = true }, afterLetters + 200),
      setTimeout(() => { subtitle2Visible = true }, afterLetters + 340),
    )
    // Letters moved — invalidate cached rects after entrance
    setTimeout(invalidateRects, afterLetters + 400)
  }

  function hideImmediately(): void {
    for (const id of pending) clearTimeout(id)
    pending = []
    container?.classList.add('no-transition')
    letters          = buildLetters(title)
    letterOffsets    = letters.map(() => ({ ox: 0, oy: 0 }))
    subtitleVisible  = false
    subtitle2Visible = false
    blobVisible      = false
    requestAnimationFrame(() => container?.classList.remove('no-transition'))
  }

  // ─── RAF loop ────────────────────────────────────────────────────────────────

  function tick(timestamp: number): void {
    const cx = $mouse.x
    const cy = $mouse.y

    // 1 — Container tilt
    targetRotX = -((cy / window.innerHeight) * 2 - 1) * maxTilt
    targetRotY =  ((cx / window.innerWidth)  * 2 - 1) * maxTilt
    currentRotX = lerp(currentRotX, targetRotX, lerpFactor)
    currentRotY = lerp(currentRotY, targetRotY, lerpFactor)
    container?.style.setProperty('--rot-x', `${currentRotX.toFixed(3)}deg`)
    container?.style.setProperty('--rot-y', `${currentRotY.toFixed(3)}deg`)

    // Refresh rects once per dirty cycle (e.g. after entrance animation)
    if (rectsDirty) refreshRects()

    const PULL_RADIUS  = 240
    const MAX_PULL     = 26
    const NOISE_RADIUS = 320
    const MAX_NOISE    = 5
    const NOISE_FREQ   = 0.0028
    const LERP_LETTER  = 0.085

    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i]
      if (letter.isSpace || !letterEls[i]) continue

      const rect = cachedRects[i]
      if (!rect || rect.width === 0) continue

      const lx   = rect.left + rect.width  / 2
      const ly   = rect.top  + rect.height / 2
      const dx   = cx - lx
      const dy   = cy - ly
      const dist = Math.hypot(dx, dy)

      const force = MAX_PULL / (1 + (dist / PULL_RADIUS) ** 2)
      const ux    = dist > 0 ? dx / dist : 0
      const uy    = dist > 0 ? dy / dist : 0

      const noiseAmp = MAX_NOISE * Math.max(0, 1 - dist / NOISE_RADIUS)
      const phaseX   = timestamp * NOISE_FREQ * (1 + (letter.noisePhase % 0.6)) + letter.noisePhase
      const phaseY   = timestamp * NOISE_FREQ * (0.7 + (letter.noisePhase % 0.4)) + letter.noisePhase + 1.3

      if (!letterOffsets[i]) letterOffsets[i] = { ox: 0, oy: 0 }
      letterOffsets[i].ox = lerp(letterOffsets[i].ox, ux * force + noiseAmp * Math.sin(phaseX), LERP_LETTER)
      letterOffsets[i].oy = lerp(letterOffsets[i].oy, uy * force + noiseAmp * Math.cos(phaseY), LERP_LETTER)

      const el = letterEls[i]!
      el.style.setProperty('--ox', `${letterOffsets[i].ox.toFixed(2)}px`)
      el.style.setProperty('--oy', `${letterOffsets[i].oy.toFixed(2)}px`)
    }

    rafId = requestAnimationFrame(tick)
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  onMount(() => {
    letters       = buildLetters(title)
    letterOffsets = letters.map(() => ({ ox: 0, oy: 0 }))
    cachedRects   = letters.map(() => null)

    const target   = findSnapSection(container)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) playAnimation()
          else                      hideImmediately()
        }
      },
      { threshold: intersectionThreshold },
    )

    observer.observe(target)
    window.addEventListener('resize', invalidateRects, { passive: true })
    rafId = requestAnimationFrame(tick)

    return (): void => {
      for (const id of pending) clearTimeout(id)
      observer.disconnect()
      window.removeEventListener('resize', invalidateRects)
      cancelAnimationFrame(rafId)
    }
  })
</script>

<div
  class="container"
  bind:this={container}
  style="--rot-x: 0deg; --rot-y: 0deg;"
>
  <div class="glass-blob" class:glass-blob--visible={blobVisible} aria-hidden="true">
    <div class="glass-blob__body"></div>
    <div class="glass-blob__shine"></div>
    <div class="glass-blob__ring"></div>
  </div>

  <h1 class="title" aria-label={title}>
    {#each letters as letter, i (i)}
      {#if letter.isSpace}
        <span class="letter letter--space">&nbsp;</span>
      {:else}
        <span
          class="letter"
          class:letter--visible={letter.visible}
          style="--drop: {letter.fromAbove ? `-${dropDistance}px` : `${dropDistance}px`}; --ox: 0px; --oy: 0px;"
          bind:this={letterEls[i]}
        >{letter.char}</span>
      {/if}
    {/each}
  </h1>

  <p class="subtitle subtitle--left"  class:subtitle--visible={subtitleVisible}>{subtitle}</p>
  <p class="subtitle subtitle--right" class:subtitle--visible={subtitle2Visible}>{subtitle2}</p>
</div>

<style>
  .container.no-transition *,
  .container.no-transition { transition: none !important; }

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
    transform: perspective(900px) rotateX(var(--rot-x)) rotateY(var(--rot-y));
    transform-style: preserve-3d;
    transform-origin: center center;
    will-change: transform;
  }

  .glass-blob {
    position: absolute;
    width:  clamp(320px, 70vw, 920px);
    height: clamp(320px, 30vw, 650px);
    --rx: 58% 42% 52% 48%; --ry: 44% 56% 42% 58%; --dur: 11s; --del: 0s;
    z-index: 0;
    pointer-events: none;
    opacity: 0;
    transform: scale(0.5);
    filter: blur(16px);
    transition:
      opacity   0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
      transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1),
      filter    0.7s ease;
  }

  .glass-blob--visible { opacity: 1; transform: scale(1); filter: blur(0); }

  .glass-blob__body {
    position: absolute; inset: 0;
    border-radius: var(--rx) / var(--ry);
    background: rgba(255,255,255,0.06);
    backdrop-filter: blur(12px) saturate(1.4);
    -webkit-backdrop-filter: blur(12px) saturate(1.4);
    animation: blob-morph var(--dur) ease-in-out var(--del) infinite alternate;
    z-index: 0;
    will-change: border-radius;
  }

  .glass-blob__shine {
    position: absolute;
    top: 10%; left: 14%; width: 36%; height: 25%;
    background: radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, transparent 70%);
    border-radius: 50%; filter: blur(10px); z-index: 1; pointer-events: none; opacity: 0.55;
  }

  .glass-blob__ring {
    position: absolute; inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.14), inset 0 1px 0 rgba(255,255,255,0.22);
    z-index: 2; pointer-events: none;
    animation: blob-morph var(--dur) ease-in-out calc(var(--del) - 0.4s) infinite alternate;
    will-change: border-radius;
  }

  @keyframes blob-morph {
    0%   { border-radius: var(--rx) / var(--ry); }
    33%  { border-radius: 50% 30% 65% 35% / 35% 65% 30% 50%; }
    66%  { border-radius: 30% 70% 40% 60% / 60% 40% 70% 30%; }
    100% { border-radius: var(--ry) / var(--rx); }
  }

  .title {
    position: relative; z-index: 1;
    display: flex; flex-wrap: wrap; justify-content: center;
    margin: 0; padding: 0.08em 0.5em; overflow: visible;
    font-family: 'Bulbasaur', sans-serif;
    font-size: clamp(2.8rem, 9vw, 8.5rem);
    font-weight: 900; letter-spacing: 0.09em; line-height: 1.05;
    color: #fff; text-shadow: 0 2px 28px rgba(0,0,0,0.3);
  }

  .letter {
    display: inline-block;
    opacity: 0;
    transform: translateY(var(--drop, -48px)) translate(var(--ox, 0px), var(--oy, 0px));
    transition:
      opacity   0.65s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform, opacity;
  }

  .letter--visible {
    opacity: 1;
    transform: translateY(0) translate(var(--ox, 0px), var(--oy, 0px));
  }

  .letter--space { opacity: 1; transform: none; transition: none; white-space: pre; }

  .subtitle {
    position: relative; text-align: center; z-index: 1;
    margin: 0; font-family: 'ICTV', sans-serif;
    font-size: clamp(1rem, 2vw, 2rem); font-weight: 100;
    color: rgba(255,255,255,0.70); text-shadow: 0 1px 10px rgba(255,255,255,0.12);
    white-space: nowrap; width: 100%; opacity: 0;
    transition:
      opacity   0.85s cubic-bezier(0.22, 1, 0.36, 1),
      transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .subtitle--left  { transform: translateX(-50px); }
  .subtitle--right { transform: translateX(50px); }
  .subtitle--visible { opacity: 1; transform: translateX(0); }

  @media (max-width: 600px) {
    .subtitle--left,
    .subtitle--right { text-align: center; padding-inline: 1rem; white-space: normal; }
  }
</style>