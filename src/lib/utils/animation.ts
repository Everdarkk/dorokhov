// ─── Math ─────────────────────────────────────────────────────────────────────

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// ─── DOM ──────────────────────────────────────────────────────────────────────

/** Walks up the DOM tree to find the nearest `.snap-section` ancestor. */
export function findSnapSection(el: HTMLElement): HTMLElement {
  let node: HTMLElement | null = el.parentElement
  while (node) {
    if (node.classList.contains('snap-section')) return node
    node = node.parentElement
  }
  return el
}

// ─── Timeout queue ────────────────────────────────────────────────────────────

/** Creates a managed timeout queue that can be fully cancelled at once. */
export function createTimeoutQueue() {
  const ids: ReturnType<typeof setTimeout>[] = []

  return {
    schedule(fn: () => void, delay: number): void {
      ids.push(setTimeout(fn, delay))
    },
    clear(): void {
      for (const id of ids) clearTimeout(id)
      ids.length = 0
    },
  }
}

// ─── Intersection observer ────────────────────────────────────────────────────

/**
 * Observes `target` and calls `onEnter`/`onLeave` when it crosses
 * the given `threshold`. Returns a cleanup function.
 */
export function observeSection(
  target: HTMLElement,
  onEnter: () => void,
  onLeave: () => void,
  threshold = 0.5,
): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onEnter()
        else onLeave()
      }
    },
    { threshold },
  )
  observer.observe(target)
  return () => observer.disconnect()
}

// ─── Blob SVG mask ────────────────────────────────────────────────────────────

type PointList = readonly number[]

export const BLOB_SHAPES: PointList[] = [
  [71.4,19.3, 88.2,24.9, 97.8,44.6, 92.5,62.2, 87.2,79.8, 69.6,96.2,
   50,96.4, 30.4,96.5, 12.8,81.9, 8.3,63.3, 3.6,43.7, 12.8,21.6,
   29.6,11.7, 44.7,1.0, 59.6,8.2, 71.4,19.3],
  [80.4,25.6, 96.2,31.4, 96.2,53.4, 87.4,69.2, 78.6,87.1, 56.4,98.0,
   38.0,93.7, 19.2,87.4, 3.0,69.6, 4.8,52.0, 6.5,31.4, 18.8,16.6,
   36.9,7.3, 55.0,1.0, 68.9,14.6, 80.4,25.6],
  [65.2,12.5, 83.7,18.3, 96.0,35.7, 94.2,55.5, 92.5,75.4, 76.6,94.5,
   57.2,96.2, 37.7,98.0, 17.3,87.4, 9.7,69.2, 2.2,50.2, 9.3,28.1,
   25.1,16.6, 40.0,1.0, 55.0,5.5, 65.2,12.5],
] as const

function lerpPoints(from: PointList, to: PointList, t: number): number[] {
  return Array.from(from, (v, i) => lerp(v, to[i], t))
}

/**
 * Converts a flat [x0,y0, …] point list into a smooth closed SVG path
 * via Catmull-Rom → cubic Bézier. Divides by 100 for `objectBoundingBox`.
 */
export function pointsToPath(pts: number[]): string {
  const n  = (pts.length / 2) - 1
  const px = (i: number) => pts[((i % n) * 2      + pts.length * 100) % pts.length] / 100
  const py = (i: number) => pts[((i % n) * 2 + 1  + pts.length * 100) % pts.length] / 100

  let d = `M ${px(0)},${py(0)}`
  for (let i = 0; i < n; i++) {
    const cp1x = px(i)     + (px(i + 1) - px(i - 1)) / 6
    const cp1y = py(i)     + (py(i + 1) - py(i - 1)) / 6
    const cp2x = px(i + 1) - (px(i + 2) - px(i))     / 6
    const cp2y = py(i + 1) - (py(i + 2) - py(i))     / 6
    d += ` C ${cp1x.toFixed(4)},${cp1y.toFixed(4)}`
      +  ` ${cp2x.toFixed(4)},${cp2y.toFixed(4)}`
      +  ` ${px(i + 1).toFixed(4)},${py(i + 1).toFixed(4)}`
  }
  return d + ' Z'
}

/**
 * Returns an RAF loop that morphs a set of SVG `<path>` elements through
 * `BLOB_SHAPES`. Call the returned `stop()` to cancel.
 */
export function startBlobMaskAnimation(
  getEls: () => (SVGPathElement | null)[],
  cycleMs = 8000,
): () => void {
  let rafId: number

  function tick(timestamp: number): void {
    const total    = BLOB_SHAPES.length
    const progress = (timestamp % cycleMs) / cycleMs
    const segment  = progress * total
    const fromIdx  = Math.floor(segment) % total
    const toIdx    = (fromIdx + 1) % total
    const t        = easeInOut(segment - Math.floor(segment))
    const pts      = lerpPoints(BLOB_SHAPES[fromIdx], BLOB_SHAPES[toIdx], t)
    const d        = pointsToPath(pts)

    for (const el of getEls()) {
      if (el) el.setAttribute('d', d)
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(rafId)
}

// ─── Card 3-D mouse tilt ─────────────────────────────────────────────────────

export interface TiltOptions {
  maxDist?:  number  // px — radius of influence
  maxRot?:   number  // deg — max tilt angle
  maxScale?: number  // additive scale on hover (0.06 = 6%)
  maxTx?:    number  // translation multiplier
}

/**
 * Applies 3-D tilt + glow to each element based on cursor proximity.
 * Returns an RAF-scheduled mousemove handler — attach to `window`.
 */
export function createCardTiltHandler(
  getEls: () => HTMLElement[],
  options: TiltOptions = {},
): (e: MouseEvent) => void {
  const { maxDist = 340, maxRot = 18, maxScale = 0.06, maxTx = 0.06 } = options
  let rafId: number

  return function onMouseMove(e: MouseEvent): void {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      for (const el of getEls()) {
        if (!el) continue
        const rect = el.getBoundingClientRect()
        const cx   = rect.left + rect.width  / 2
        const cy   = rect.top  + rect.height / 2
        const dx   = e.clientX - cx
        const dy   = e.clientY - cy
        const dist = Math.hypot(dx, dy)

        if (dist < maxDist) {
          const s    = 1 - dist / maxDist
          const rotX = -(dy / rect.height) * maxRot  * s
          const rotY =  (dx / rect.width)  * maxRot  * s
          const sc   =   1 + maxScale * s
          const tx   = dx * maxTx * s
          const ty   = dy * maxTx * s
          el.style.transform =
            `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${sc}) translate(${tx}px,${ty}px)`
          el.style.setProperty('--glow', String(s))
        } else {
          el.style.transform = ''
          el.style.setProperty('--glow', '0')
        }
      }
    })
  }
}

/** Resets transform and glow on a list of elements. */
export function resetCardTilts(els: HTMLElement[]): void {
  for (const el of els) {
    if (!el) continue
    el.style.transform = ''
    el.style.setProperty('--glow', '0')
  }
}

// ─── Popup RAF loop ───────────────────────────────────────────────────────────

export interface PopupState {
  x:       number
  y:       number
  tiltX:   number
  tiltY:   number
  opacity: number
}

export interface PopupLoopOptions {
  lerpPos?:     number  // position lag (default 0.10)
  lerpOpacity?: number  // fade speed  (default 0.08)
  lerpTilt?:    number  // tilt speed  (default 0.08)
  maxTiltDeg?:  number  // max lean    (default 10)
}

/**
 * Creates a self-contained popup RAF loop.
 *
 * Caller provides:
 *   - `getEl()`      — returns the popup DOM element
 *   - `getCursor()`  — returns current { x, y } cursor position
 *   - `isVisible()`  — returns true when popup should be shown
 *   - `getAccent()`  — returns CSS colour string for `--pop-accent`
 *
 * Returns `stop()` to cancel the loop.
 */
export function startPopupLoop(
  getEl:       () => HTMLDivElement | undefined,
  getCursor:   () => { x: number; y: number },
  isVisible:   () => boolean,
  getAccent:   () => string | null,
  opts: PopupLoopOptions = {},
): () => void {
  const {
    lerpPos     = 0.10,
    lerpOpacity = 0.08,
    lerpTilt    = 0.08,
    maxTiltDeg  = 10,
  } = opts

  const s: PopupState = { x: 0, y: 0, tiltX: 0, tiltY: 0, opacity: 0 }
  let rafId: number

  function tick(): void {
    const el      = getEl()
    const cursor  = getCursor()
    const target  = isVisible() ? 1 : 0
    const accent  = getAccent()

    s.x       = lerp(s.x,       cursor.x, lerpPos)
    s.y       = lerp(s.y,       cursor.y, lerpPos)
    s.opacity = lerp(s.opacity, target,   lerpOpacity)

    if (el) {
      const pw = el.offsetWidth  || 260
      const ph = el.offsetHeight || 110
      const vw = window.innerWidth
      const vh = window.innerHeight
      const OX =  20
      const OY = -ph - 16

      let x = s.x + OX
      let y = s.y + OY

      if (x + pw > vw - 12) x = s.x - pw - OX
      if (y < 12)            y = s.y + 24
      x = Math.max(12, Math.min(x, vw - pw - 12))
      y = Math.max(12, Math.min(y, vh - ph - 12))

      const tiltTargetY =  ((cursor.x - (x + pw / 2)) / (pw / 2)) * maxTiltDeg
      const tiltTargetX = -((cursor.y - (y + ph / 2)) / (ph / 2)) * maxTiltDeg
      s.tiltX = lerp(s.tiltX, tiltTargetX, lerpTilt)
      s.tiltY = lerp(s.tiltY, tiltTargetY, lerpTilt)

      const scale = 0.82 + s.opacity * 0.18
      const blur  = (1 - s.opacity) * 6

      el.style.transform  = `translate(${x}px,${y}px) perspective(600px) rotateX(${s.tiltX}deg) rotateY(${s.tiltY}deg) scale(${scale})`
      el.style.opacity    = String(Math.max(0, Math.min(1, s.opacity)))
      el.style.filter     = `blur(${blur.toFixed(2)}px)`
      el.style.visibility = s.opacity > 0.01 ? 'visible' : 'hidden'

      if (accent) el.style.setProperty('--pop-accent', accent)
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(rafId)
}