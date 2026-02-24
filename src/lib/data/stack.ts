// Tech icon imports — Vite resolves and hashes these at build time.
// Place SVG files at: src/lib/assets/icons/tech/
import icTs         from '$lib/assets/icons/typescript.svg'
import icCss        from '$lib/assets/icons/css.svg'
import icReact      from '$lib/assets/icons/react.svg'
import icSvelte     from '$lib/assets/icons/svelte.svg'
import icSupabase   from '$lib/assets/icons/supabase.svg'
import icGit        from '$lib/assets/icons/git.svg'
import icVercel     from '$lib/assets/icons/vercel.svg'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TechCard {
  /** Unique identifier */
  id: number
  /** Display name shown in popup title */
  name: string
  /** Vite-resolved icon URL */
  icon: string
  /** One-liner shown in popup — what it is and why it's great */
  summary: string
  /** Organic blob border-radius — horizontal axis */
  rx: string
  /** Organic blob border-radius — vertical axis */
  ry: string
  /** CSS morph animation duration in seconds */
  morphDuration: number
  /** CSS morph animation delay in seconds (negative to offset phase) */
  morphDelay: number
  /** Inner radial gradient primary colour */
  accent1: string
  /** Inner radial gradient highlight colour */
  accent2: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const techCards: TechCard[] = [
  {
    id: 1,
    name: 'TypeScript',
    icon: icTs,
    summary: 'Статична типізація для JS. Ловить помилки ще до запуску — менше багів, впевненіший рефакторинг.',
    rx: '58% 42% 52% 48%',
    ry: '44% 56% 42% 58%',
    morphDuration: 9,
    morphDelay: 0,
    accent1: '#1a3a6e',
    accent2: '#3178c6',
  },
  {
    id: 2,
    name: 'CSS',
    icon: icCss,
    summary: 'Сучасний CSS — grid, container queries, custom properties. Жодних зайвих бібліотек.',
    rx: '44% 56% 62% 38%',
    ry: '60% 40% 48% 52%',
    morphDuration: 11,
    morphDelay: -2,
    accent1: '#1a3850',
    accent2: '#2965f1',
  },
  {
    id: 3,
    name: 'React / Next.js',
    icon: icReact,
    summary: 'Компонентний UI + SSR/SSG від Next.js. Ідеально для SEO та великих продуктових застосунків.',
    rx: '62% 38% 44% 56%',
    ry: '38% 62% 56% 44%',
    morphDuration: 10,
    morphDelay: -4,
    accent1: '#0e3044',
    accent2: '#61dafb',
  },
  {
    id: 4,
    name: 'Svelte / SvelteKit',
    icon: icSvelte,
    summary: 'Компілюється до чистого JS — нуль рантайму. Найшвидший старт і найменший bundle.',
    rx: '48% 52% 58% 42%',
    ry: '54% 46% 40% 60%',
    morphDuration: 13,
    morphDelay: -6,
    accent1: '#4a1a0e',
    accent2: '#ff3e00',
  },
  {
    id: 5,
    name: 'Supabase / PostgreSQL',
    icon: icSupabase,
    summary: 'Open-source Firebase-альтернатива: auth, realtime, storage і повноцінний Postgres під капотом.',
    rx: '40% 60% 48% 52%',
    ry: '56% 44% 60% 40%',
    morphDuration: 12,
    morphDelay: -8,
    accent1: '#0a3328',
    accent2: '#3ecf8e',
  },
  {
    id: 6,
    name: 'Git / GitHub',
    icon: icGit,
    summary: 'Контроль версій + колаборація. Pull request-и, CI/CD-тригери та чиста історія змін.',
    rx: '54% 46% 40% 60%',
    ry: '42% 58% 54% 46%',
    morphDuration: 10,
    morphDelay: -3,
    accent1: '#2a1a0e',
    accent2: '#f05032',
  },
  {
    id: 7,
    name: 'Vercel',
    icon: icVercel,
    summary: 'Edge-деплой за секунди. Preview-посилання для кожного PR, аналітика та Web Vitals з коробки.',
    rx: '50% 50% 56% 44%',
    ry: '46% 54% 44% 56%',
    morphDuration: 11,
    morphDelay: -5,
    accent1: '#1a1a2e',
    accent2: '#c8c8d4',
  },
]