// ─── Types ───────────────────────────────────────────────────────────────────

export interface ShowcaseProject {
  /** Unique stable id — used as Svelte keyed-each key */
  id: number
  /** Project title shown in popup */
  name: string
  /** Short description shown in popup */
  summary: string
  /** Tech tags shown in popup */
  tags: string[]
  /** Vite-resolved video URL — import in component via ?url suffix */
  video: string
  /** Poster image shown while video is paused — same import pattern */
  poster: string
  /** Link to live project (optional) */
  url?: string
  /** Organic blob border-radius horizontal */
  rx: string
  /** Organic blob border-radius vertical */
  ry: string
  /** CSS morph animation duration (s) */
  morphDuration: number
  /** CSS morph animation delay (s, negative to offset phase) */
  morphDelay: number
  /** Gradient primary colour */
  accent1: string
  /** Gradient highlight colour */
  accent2: string
}

// ─── Data ────────────────────────────────────────────────────────────────────
//
// Replace `video` and `poster` values with your actual Vite asset imports.
// Example in the component:
//   import vid1 from '$lib/assets/videos/project1.mp4?url'
//   import poster1 from '$lib/assets/images/project1-poster.webp'
// Then pass them here.
//
// For now placeholders use public paths — swap to imports before production.

export const projects: ShowcaseProject[] = [
  {
    id: 1,
    name: 'Проєкт Alpha',
    summary: 'Повноцінний SaaS-дашборд із real-time аналітикою, побудований на SvelteKit + Supabase. Адаптивний, з темною темою та drag-n-drop звітами.',
    tags: ['SvelteKit', 'Supabase', 'TypeScript'],
    video:  '/videos/project1.mp4',
    poster: '/images/project1.webp',
    url: 'https://example.com',
    rx: '58% 42% 52% 48%',
    ry: '44% 56% 42% 58%',
    morphDuration: 9,
    morphDelay: 0,
    accent1: '#1a2a4a',
    accent2: '#3a7bd5',
  },
  {
    id: 2,
    name: 'Проєкт Beta',
    summary: 'Лендінг для стартапу з анімованим hero-блоком, A/B-тестуванням та інтеграцією Stripe. Lighthouse score 100/100.',
    tags: ['Next.js', 'Stripe', 'Framer Motion'],
    video:  '/videos/project2.mp4',
    poster: '/images/project2.webp',
    rx: '44% 56% 62% 38%',
    ry: '60% 40% 48% 52%',
    morphDuration: 11,
    morphDelay: -2,
    accent1: '#2a1a3a',
    accent2: '#9b59b6',
  },
  {
    id: 3,
    name: 'Проєкт Gamma',
    summary: 'Мобільний застосунок для трекінгу звичок із офлайн-режимом, push-нотифікаціями та хмарною синхронізацією.',
    tags: ['React Native', 'PostgreSQL', 'Node.js'],
    video:  '/videos/project3.mp4',
    poster: '/images/project3.webp',
    url: 'https://example.com',
    rx: '62% 38% 44% 56%',
    ry: '38% 62% 56% 44%',
    morphDuration: 10,
    morphDelay: -4,
    accent1: '#0e3a2a',
    accent2: '#2ecc71',
  },
  {
    id: 4,
    name: 'Проєкт Delta',
    summary: 'E-commerce платформа з фільтрацією товарів у реальному часі, кошиком та адмін-панеллю.',
    tags: ['SvelteKit', 'PostgreSQL', 'Vercel'],
    video:  '/videos/project4.mp4',
    poster: '/images/project4.webp',
    rx: '48% 52% 58% 42%',
    ry: '54% 46% 40% 60%',
    morphDuration: 13,
    morphDelay: -6,
    accent1: '#3a1a10',
    accent2: '#e74c3c',
  },
  {
    id: 5,
    name: 'Проєкт Epsilon',
    summary: 'Портфоліо-сайт із scroll-snap секціями, WebGL-фоном та анімованими blob-ами. Цей самий сайт!',
    tags: ['SvelteKit', 'TypeScript', 'CSS'],
    video:  '/videos/project5.mp4',
    poster: '/images/project5.webp',
    rx: '50% 50% 56% 44%',
    ry: '46% 54% 44% 56%',
    morphDuration: 11,
    morphDelay: -3,
    accent1: '#1a1a2e',
    accent2: '#c8c8d4',
  },
]