<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser }            from '$app/environment'
  import { activeSection }      from '$lib/stores/activeSection'
  import { mouse }              from '$lib/stores/mouse'

  export let fadeDelay    = 0
  export let fadeDuration = 1400
  export let bgColor      = '#000000'
  export let bgImage      = ''
  export let sectionId    = ''

  // ─── Config ──────────────────────────────────────────────────────────────────

  const COUNT         = 35
  const SPEED         = 1.0
  const SPEED_SPREAD  = 0.3
  const SIZE_MIN      = 14
  const SIZE_MAX      = 60
  const LINK_DIST     = 250
  const LINK_DIST_SQ  = LINK_DIST * LINK_DIST
  const CURSOR_RADIUS = 200
  const CURSOR_FORCE  = 0.55
  const MAX_SPEED     = 5.0
  const ROT_MIN       = 0.003
  const ROT_MAX       = 0.010

  // Pre-built colour strings — avoid template literal creation every frame
  const COLORS: [number, number, number][] = [
    [130, 155, 215], [160, 125, 225], [ 80, 190, 195],
    [220, 155, 100], [145, 215, 140], [225, 120, 155], [175, 175, 205],
  ]

  type ShapeKind = 'circle' | 'square' | 'triangle' | 'cross'
  const SHAPES: ShapeKind[] = ['circle', 'square', 'triangle', 'cross']

  interface Particle {
    x: number; y: number; vx: number; vy: number
    size: number; angle: number; rotSpeed: number
    shape: ShapeKind; r: number; g: number; b: number; alpha: number
    // Pre-built stroke string so we don't template-literal every frame
    stroke: string
    glow:   string
  }

  let canvas:  HTMLCanvasElement
  let ctx:     CanvasRenderingContext2D
  let visible  = false
  let rafId:   number
  let timer:   ReturnType<typeof setTimeout>
  let W = 0, H = 0
  let isActive = false

  // Read mouse from global store — no own listener
  let mouseX = -9999, mouseY = -9999
  $: { mouseX = $mouse.x; mouseY = $mouse.y }

  let particles: Particle[] = []

  function makeParticle(): Particle {
    const angle  = Math.random() * Math.PI * 2
    const speed  = SPEED + (Math.random() - 0.5) * SPEED_SPREAD
    const [r, g, b] = COLORS[Math.floor(Math.random() * COLORS.length)]
    const alpha  = 0.55 + Math.random() * 0.35
    return {
      x: Math.random() * W, y: Math.random() * H,
      vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      size: SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN),
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() < 0.5 ? 1 : -1) * (ROT_MIN + Math.random() * (ROT_MAX - ROT_MIN)),
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      r, g, b, alpha,
      // Cache colour strings — saves string interpolation each frame
      stroke: `rgba(${r},${g},${b},${alpha.toFixed(2)})`,
      glow:   `rgba(${r},${g},${b},0.55)`,
    }
  }

  function init(): void {
    W = canvas.width  = window.innerWidth
    H = canvas.height = window.innerHeight
    ctx = canvas.getContext('2d')!
    // Hint browser that we'll be using the canvas heavily for compositing
    ctx.imageSmoothingEnabled = false
    const count = W < 800 ? Math.floor(COUNT * 0.45) : COUNT
    particles = Array.from({ length: count }, makeParticle)
  }

  // ─── Shape renderer — shadowBlur only on cross (cheapest shape count) ────────

  function drawShape(p: Particle): void {
    const s = p.size
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.angle)

    // shadowBlur is expensive — only apply it, don't repeat ctx state changes
    ctx.shadowColor = p.glow
    ctx.shadowBlur  = 16
    ctx.strokeStyle = p.stroke
    ctx.lineJoin    = 'round'
    ctx.lineCap     = 'round'

    switch (p.shape) {
      case 'circle':
        ctx.lineWidth = 2.8
        ctx.beginPath()
        ctx.arc(0, 0, s, 0, Math.PI * 2)
        ctx.stroke()
        break
      case 'square':
        ctx.lineWidth = 2.8
        ctx.beginPath()
        ctx.rect(-s, -s, s * 2, s * 2)
        ctx.stroke()
        break
      case 'triangle': {
        ctx.lineWidth = 2.8
        const h = s * 1.15
        ctx.beginPath()
        ctx.moveTo(0, -h); ctx.lineTo(s, h * 0.55); ctx.lineTo(-s, h * 0.55)
        ctx.closePath(); ctx.stroke()
        break
      }
      case 'cross':
        ctx.lineWidth = 4.5
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke()
        break
    }

    ctx.restore()
  }

  function normaliseSpeed(p: Particle): void {
    const spd = p.vx * p.vx + p.vy * p.vy
    if (spd > MAX_SPEED * MAX_SPEED) {
      const s = MAX_SPEED / Math.sqrt(spd)
      p.vx *= s; p.vy *= s
    }
  }

  function update(): void {
    for (const p of particles) {
      const cdx = p.x - mouseX, cdy = p.y - mouseY
      const cdst = cdx * cdx + cdy * cdy
      if (cdst < CURSOR_RADIUS * CURSOR_RADIUS && cdst > 0.01) {
        const mag  = Math.sqrt(cdst)
        const norm = (1 - mag / CURSOR_RADIUS) ** 1.5
        p.vx += (cdx / mag) * CURSOR_FORCE * norm
        p.vy += (cdy / mag) * CURSOR_FORCE * norm
        p.rotSpeed += Math.sign(p.rotSpeed) * norm * 0.006
      }

      p.x += p.vx; p.y += p.vy; p.angle += p.rotSpeed

      const absRot = Math.abs(p.rotSpeed)
      if (absRot > ROT_MAX)        p.rotSpeed *= 0.985
      else if (absRot < ROT_MIN)   p.rotSpeed = Math.sign(p.rotSpeed) * ROT_MIN

      normaliseSpeed(p)

      const edge = p.size + 2
      if (p.x - edge < 0)  { p.x = edge;     p.vx =  Math.abs(p.vx); p.rotSpeed *= -0.9 }
      if (p.x + edge > W)  { p.x = W - edge; p.vx = -Math.abs(p.vx); p.rotSpeed *= -0.9 }
      if (p.y - edge < 0)  { p.y = edge;     p.vy =  Math.abs(p.vy); p.rotSpeed *= -0.9 }
      if (p.y + edge > H)  { p.y = H - edge; p.vy = -Math.abs(p.vy); p.rotSpeed *= -0.9 }
    }

    // O(n²) collision — 35 particles = 595 pairs, acceptable
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]
      for (let j = i + 1; j < particles.length; j++) {
        const b   = particles[j]
        const dx  = b.x - a.x, dy = b.y - a.y
        const d2  = dx * dx + dy * dy
        const minD = a.size + b.size + 2
        if (d2 < minD * minD && d2 > 0.01) {
          const dist = Math.sqrt(d2)
          const nx = dx / dist, ny = dy / dist
          const ov = (minD - dist) * 0.5
          a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov
          const dvx = a.vx - b.vx, dvy = a.vy - b.vy
          const dot = dvx * nx + dvy * ny
          if (dot > 0) {
            a.vx -= dot * nx; a.vy -= dot * ny
            b.vx += dot * nx; b.vy += dot * ny
            const spin = dot * 0.04
            a.rotSpeed += spin * (Math.random() < 0.5 ? 1 : -1)
            b.rotSpeed += spin * (Math.random() < 0.5 ? 1 : -1)
          }
          normaliseSpeed(a); normaliseSpeed(b)
        }
      }
    }
  }

  function draw(): void {
    ctx.clearRect(0, 0, W, H)

    // Batch all lines in one path per pair — fewer state switches
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]
      for (let j = i + 1; j < particles.length; j++) {
        const b  = particles[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const d2 = dx * dx + dy * dy
        if (d2 < LINK_DIST_SQ) {
          const prox = 1 - Math.sqrt(d2) / LINK_DIST
          // Use cached r/g/b values, single integer shift
          ctx.beginPath()
          ctx.strokeStyle = `rgba(${(a.r+b.r)>>1},${(a.g+b.g)>>1},${(a.b+b.b)>>1},${(prox * 0.20).toFixed(2)})`
          ctx.lineWidth   = 0.8 + prox * 0.7
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
    }

    // Reset shadow before lines to avoid glow on connection lines
    ctx.shadowBlur = 0
    for (const p of particles) drawShape(p)
  }

  function tick(): void {
    if (!isActive) return
    update()
    draw()
    rafId = requestAnimationFrame(tick)
  }

  // ─── Pause/resume based on active section ────────────────────────────────────

  $: if (sectionId) {
    const nowActive = $activeSection === sectionId
    if (nowActive && !isActive) {
      isActive = true
      rafId = requestAnimationFrame(tick)
    } else if (!nowActive && isActive) {
      isActive = false
      cancelAnimationFrame(rafId)
    }
  }

  function onResize(): void {
    if (!canvas) return
    const wasMobile = W < 800
    W = canvas.width  = window.innerWidth
    H = canvas.height = window.innerHeight
    const isMobileNow = W < 800
    // Re-create particles if we crossed the mobile threshold
    if (wasMobile !== isMobileNow) {
      const count = isMobileNow ? Math.floor(COUNT * 0.45) : COUNT
      particles = Array.from({ length: count }, makeParticle)
      return
    }
    for (const p of particles) {
      const e = p.size + 2
      p.x = Math.max(e, Math.min(W - e, p.x))
      p.y = Math.max(e, Math.min(H - e, p.y))
    }
  }

  onMount(() => {
    init()
    // If no sectionId, always run (backwards compat)
    if (!sectionId) {
      isActive = true
      rafId    = requestAnimationFrame(tick)
    }
    timer = setTimeout(() => { visible = true }, fadeDelay)
    window.addEventListener('resize', onResize)
    return () => {
      isActive = false
      cancelAnimationFrame(rafId)
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  })

  onDestroy(() => {
    if (!browser) return
    isActive = false
    cancelAnimationFrame(rafId)
    clearTimeout(timer)
  })
</script>

<div
  class="particle-bg"
  class:visible
  style="--fade: {fadeDuration}ms; background-color: {bgColor}; {bgImage ? `background-image: ${bgImage}` : ''}"
>
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .particle-bg {
    position: fixed; inset: 0; z-index: 0;
    opacity: 0;
    transition: opacity var(--fade, 1400ms) ease;
    pointer-events: none;
    /* Own layer prevents compositing interference with content above */
    will-change: opacity;
  }
  .particle-bg.visible { opacity: 1; }
  canvas { display: block; width: 100%; height: 100%; }
</style>