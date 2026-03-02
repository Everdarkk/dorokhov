<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { browser } from '$app/environment'

  // ─── Props ───────────────────────────────────────────────────────────────────

  export let fadeDelay    = 0
  export let fadeDuration = 1400

  export let bgColor: string = '#000000'
  export let bgImage: string

  // ─── Config ──────────────────────────────────────────────────────────────────

  const COUNT         = 35          // fewer → bigger, still performant
  const SPEED         = 1           // fixed cruise speed — all particles move at same pace
  const SPEED_SPREAD  = 0.3       // ±variance around SPEED
  const SIZE_MIN      = 14          // half-size for collision
  const SIZE_MAX      = 60          // visual diameter 28–38 px
  const LINK_DIST     = 250
  const LINK_DIST_SQ  = LINK_DIST * LINK_DIST
  const CURSOR_RADIUS = 200
  const CURSOR_FORCE  = 0.55        // stronger push so it's satisfying
  const MAX_SPEED     = 5.0         // cap after cursor hit
  const ROT_MIN       = 0.003       // rad/frame
  const ROT_MAX       = 0.010
  // NO global damping — particles coast at constant speed like billiard balls
  // Only rotational damping after cursor boost, then re-settles to natural spin

  // ─── Palette — muted neons, low saturation ────────────────────────────────────

  const COLORS: [number, number, number][] = [
    [130, 155, 215],   // steel blue
    [160, 125, 225],   // soft violet
    [ 80, 190, 195],   // teal
    [220, 155, 100],   // amber
    [145, 215, 140],   // sage green
    [225, 120, 155],   // rose
    [175, 175, 205],   // lavender grey
  ]

  type ShapeKind = 'circle' | 'square' | 'triangle' | 'cross'
  const SHAPES: ShapeKind[] = ['circle', 'square', 'triangle', 'cross']

  interface Particle {
    x: number; y: number
    vx: number; vy: number          // velocity — magnitude stays near SPEED
    size: number
    angle: number                   // current rotation
    rotSpeed: number                // rad/frame
    shape: ShapeKind
    r: number; g: number; b: number
    alpha: number
  }

  // ─── State ───────────────────────────────────────────────────────────────────

  let canvas:  HTMLCanvasElement
  let ctx:     CanvasRenderingContext2D
  let visible  = false
  let rafId:   number
  let timer:   ReturnType<typeof setTimeout>
  let W = 0, H = 0
  let mouseX = -9999, mouseY = -9999
  let particles: Particle[] = []

  // ─── Factory ─────────────────────────────────────────────────────────────────

  function makeParticle(x?: number, y?: number): Particle {
    const angle  = Math.random() * Math.PI * 2
    const speed  = SPEED + (Math.random() - 0.5) * SPEED_SPREAD
    const [r, g, b] = COLORS[Math.floor(Math.random() * COLORS.length)]
    return {
      x:        x ?? Math.random() * W,
      y:        y ?? Math.random() * H,
      vx:       Math.cos(angle) * speed,
      vy:       Math.sin(angle) * speed,
      size:     SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN),
      angle:    Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() < 0.5 ? 1 : -1) * (ROT_MIN + Math.random() * (ROT_MAX - ROT_MIN)),
      shape:    SHAPES[Math.floor(Math.random() * SHAPES.length)],
      r, g, b,
      alpha:    0.55 + Math.random() * 0.35,
    }
  }

  function init(): void {
    W = canvas.width  = window.innerWidth
    H = canvas.height = window.innerHeight
    ctx = canvas.getContext('2d')!
    particles = Array.from({ length: COUNT }, () => makeParticle())
  }

  // ─── Speed normaliser — keeps cruise speed after bounces ─────────────────────

  function normaliseSpeed(p: Particle): void {
    const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    if (spd < 0.001) return
    // Only clamp to max — don't restore minimum (let cursor kicks decay naturally)
    if (spd > MAX_SPEED) {
      const s = MAX_SPEED / spd
      p.vx *= s; p.vy *= s
    }
  }

  // ─── Shape renderer ──────────────────────────────────────────────────────────

  function drawShape(p: Particle): void {
    const s = p.size
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.angle)

    ctx.shadowColor = `rgba(${p.r},${p.g},${p.b},0.60)`
    ctx.shadowBlur  = 20
    ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${p.alpha.toFixed(2)})`
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
        ctx.closePath()
        ctx.stroke()
        break
      }

      case 'cross':
        ctx.lineWidth = 4.5
        ctx.beginPath()
        ctx.moveTo(0, -s); ctx.lineTo(0, s)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-s, 0); ctx.lineTo(s, 0)
        ctx.stroke()
        break
    }

    ctx.restore()
  }

  // ─── Physics ─────────────────────────────────────────────────────────────────

  function update(): void {
    for (const p of particles) {

      // ── Cursor repulsion ─────────────────────────────────────────────────────
      const cdx = p.x - mouseX, cdy = p.y - mouseY
      const cdst = cdx * cdx + cdy * cdy
      if (cdst < CURSOR_RADIUS * CURSOR_RADIUS && cdst > 0.01) {
        const mag  = Math.sqrt(cdst)
        const norm = (1 - mag / CURSOR_RADIUS) ** 1.5   // smoother falloff
        p.vx += (cdx / mag) * CURSOR_FORCE * norm
        p.vy += (cdy / mag) * CURSOR_FORCE * norm
        // Quick spin-up from cursor
        const spinBoost = norm * 0.006
        p.rotSpeed += Math.sign(p.rotSpeed) * spinBoost
      }

      // ── Integrate ────────────────────────────────────────────────────────────
      p.x     += p.vx
      p.y     += p.vy
      p.angle += p.rotSpeed

      // ── Rotation: slowly decay back toward natural speed after cursor boost ──
      const natRot   = ROT_MIN + (ROT_MAX - ROT_MIN) * 0.5   // midpoint of natural range
      const absRot   = Math.abs(p.rotSpeed)
      if (absRot > ROT_MAX) {
        // Above natural range → decay toward ROT_MAX
        p.rotSpeed *= 0.985
      } else if (absRot < ROT_MIN) {
        // Below natural range → nudge back to ROT_MIN
        p.rotSpeed = Math.sign(p.rotSpeed) * ROT_MIN
      }

      // ── Speed cap (no minimum damping — preserve cruise speed) ───────────────
      normaliseSpeed(p)

      // ── Wall bounce — reflect velocity, preserve speed ───────────────────────
      const edge = p.size + 2
      if (p.x - edge < 0)  { p.x = edge;     p.vx =  Math.abs(p.vx); p.rotSpeed *= -0.9 }
      if (p.x + edge > W)  { p.x = W - edge; p.vx = -Math.abs(p.vx); p.rotSpeed *= -0.9 }
      if (p.y - edge < 0)  { p.y = edge;     p.vy =  Math.abs(p.vy); p.rotSpeed *= -0.9 }
      if (p.y + edge > H)  { p.y = H - edge; p.vy = -Math.abs(p.vy); p.rotSpeed *= -0.9 }
    }

    // ── Particle–particle elastic collision ───────────────────────────────────
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const dst2 = dx * dx + dy * dy
        const minD = a.size + b.size + 2
        if (dst2 < minD * minD && dst2 > 0.01) {
          const dist = Math.sqrt(dst2)
          const nx = dx / dist, ny = dy / dist
          // Separate
          const ov = (minD - dist) * 0.5
          a.x -= nx * ov; a.y -= ny * ov
          b.x += nx * ov; b.y += ny * ov
          // Elastic exchange along normal
          const dvx = a.vx - b.vx, dvy = a.vy - b.vy
          const dot = dvx * nx + dvy * ny
          if (dot > 0) {
            a.vx -= dot * nx; a.vy -= dot * ny
            b.vx += dot * nx; b.vy += dot * ny
            // Small spin from impact
            const spin = dot * 0.04
            a.rotSpeed += spin * (Math.random() < 0.5 ? 1 : -1)
            b.rotSpeed += spin * (Math.random() < 0.5 ? 1 : -1)
          }
          // Re-normalise after collision so speed stays consistent
          normaliseSpeed(a)
          normaliseSpeed(b)
        }
      }
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  function draw(): void {
    ctx.clearRect(0, 0, W, H)

    // ── Connection lines — blended colour of both endpoints ───────────────────
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const d2 = dx * dx + dy * dy
        if (d2 < LINK_DIST_SQ) {
          const prox = 1 - Math.sqrt(d2) / LINK_DIST
          ctx.beginPath()
          ctx.strokeStyle = `rgba(${(a.r+b.r)>>1},${(a.g+b.g)>>1},${(a.b+b.b)>>1},${(prox * 0.20).toFixed(3)})`
          ctx.lineWidth   = 0.8 + prox * 0.7
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
    }

    // ── Shapes with neon glow ─────────────────────────────────────────────────
    for (const p of particles) drawShape(p)
  }

  // ─── Loop ────────────────────────────────────────────────────────────────────

  function tick(): void { update(); draw(); rafId = requestAnimationFrame(tick) }

  // ─── Events ──────────────────────────────────────────────────────────────────

  const onMouseMove  = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY }
  const onMouseLeave = ()              => { mouseX = -9999; mouseY = -9999 }
  const onTouchMove  = (e: TouchEvent) => { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY }

  function onResize(): void {
    if (!canvas) return
    W = canvas.width = window.innerWidth
    H = canvas.height = window.innerHeight
    for (const p of particles) {
      const e = p.size + 2
      p.x = Math.max(e, Math.min(W - e, p.x))
      p.y = Math.max(e, Math.min(H - e, p.y))
    }
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  onMount(() => {
    init()
    rafId = requestAnimationFrame(tick)
    timer = setTimeout(() => { visible = true }, fadeDelay)
    window.addEventListener('mousemove',  onMouseMove,  { passive: true })
    window.addEventListener('touchmove',  onTouchMove,  { passive: true })
    window.addEventListener('mouseleave', onMouseLeave, { passive: true })
    window.addEventListener('resize',     onResize)
    return () => {
      cancelAnimationFrame(rafId); clearTimeout(timer)
      window.removeEventListener('mousemove',  onMouseMove)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize',     onResize)
    }
  })

  onDestroy(() => { if (!browser) return; cancelAnimationFrame(rafId); clearTimeout(timer) })
</script>

<div class="particle-bg" class:visible style:background={bgImage} style="--fade: {fadeDuration}ms; background-color: {bgColor}; background-image:{bgImage}" >
  <canvas bind:this={canvas}></canvas>
</div>

<style>
  .particle-bg {
    position: fixed; inset: 0; z-index: 0;
    opacity: 0;
    transition: opacity var(--fade, 1400ms) ease;
    pointer-events: none;
    
  }
  .particle-bg.visible { opacity: 1; }
  canvas { display: block; width: 100%; height: 100%; }
</style>