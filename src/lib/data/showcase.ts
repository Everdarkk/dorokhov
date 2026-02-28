import ad from '$lib/assets/videos/ad.webm'
import dash from '$lib/assets/videos/dash.webm'
import nn from '$lib/assets/videos/nn.webm'
import om from '$lib/assets/videos/om.webm'
import taga from '$lib/assets/videos/taga.webm'
import tt from '$lib/assets/videos/tt.webm'

import Ad from '$lib/assets/images/ad.webp'
import Dash from '$lib/assets/images/dash.webp'
import Nn from '$lib/assets/images/nn.webp'
import Om from '$lib/assets/images/om.webp'
import Taga from '$lib/assets/images/taga.webp'
import Tt from '$lib/assets/images/tt.webp'


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

export const projects: ShowcaseProject[] = [
  {
    id: 1,
    name: 'Сайт для онлайн-логопеда Аліни',
    summary: "Ресурс для логопеда та для ознайомлення батьків. Має інтеграцію з Google Calendar для відстеження розкладу занять та EmailJS для зворотнього зв'язку",
    tags: ['React', 'NextJS', 'TypeScript', 'Figma'],
    video:  ad,
    poster: Ad,
    url: 'https://alinadorokhova.com',
    rx: '58% 42% 52% 48%',
    ry: '44% 56% 42% 58%',
    morphDuration: 9,
    morphDelay: 0,
    accent1: '#d53a9a',
    accent2: '#fedaff',
  },
  {
    id: 2,
    name: 'Dashboard для deploi.org',
    summary: 'Dashboard для банківських установ, використовує базу даних Supabase та має інтегрований CSV-Reader для додавання великої кількості записів через імпорт .csv файлу за патерном.',
    tags: ['Vercel', 'React', 'Supabase'],
    video:  dash,
    poster: Dash,
    url: 'https://test-assessment-weld.vercel.app/',
    rx: '44% 56% 62% 38%',
    ry: '60% 40% 48% 52%',
    morphDuration: 10,
    morphDelay: -3,
    accent1: '#2a1a3a',
    accent2: '#9b59b6',
  },
  {
    id: 3,
    name: 'AI News',
    summary: 'Новинний сервіс, з інтеграцією Google Gemini та різних API. Має функцію AI-статті (кожна стаття унікально генерується штучним інтелектом).',
    tags: ['Next.JS', 'Gemini CLI', 'Tailwind CSS'],
    video:  nn,
    poster: Nn,
    url: 'https://news-personal-ai.vercel.app/',
    rx: '62% 38% 44% 56%',
    ry: '38% 62% 56% 44%',
    morphDuration: 10,
    morphDelay: -4,
    accent1: '#171717',
    accent2: '#7bf1a8',
  },
  {
    id: 4,
    name: 'Сайт-портфоліо для митця Олександра',
    summary: 'Персональне портфоліо сучасного українського художника Олександра Моськіна. Реалізовані складні анімації та повноцінна галерея з детальними описами його творів. Мобільна адаптація.',
    tags: ['Next.JS', 'TypeScript', 'CSS', 'Figma'],
    video:  om,
    poster: Om,
    url: 'https://moskinoleksandr.com/',
    rx: '48% 52% 58% 42%',
    ry: '54% 46% 40% 60%',
    morphDuration: 13,
    morphDelay: -6,
    accent1: '#791c74',
    accent2: '#cc5565',
  },
  {
    id: 5,
    name: 'TAGA - соціальна мережа',
    summary: 'Полегшений варіант популярного формату соцмережі. Реалізована реєстрація, автентифікація користувача, можна створювати/видаляти записи, додавати в обрані, шукати дописи за темою, налаштування аватару.',
    tags: ['Next.JS', 'Supabase', 'TypeScript'],
    video:  taga,
    poster: Taga,
    url: 'https://taga-social.vercel.app/',
    rx: '50% 50% 56% 44%',
    ry: '46% 54% 44% 56%',
    morphDuration: 11,
    morphDelay: -3,
    accent1: '#1a1a2e',
    accent2: '#c8c8d4',
  },
  {
    id: 6,
    name: 'Сайт ортопедичного центру Терно-Топ',
    summary: 'Повноцінний інформаційний ресурс для ортопедичного центру Терно-Топ. Розробка дизайну та контенту з нуля. Реалізований повноцінний блог та сторінка адміністратора для керування статтями. Повна адаптація під мобільні пристрої. Інтеграція з Google Maps API та налаштування SEO для поліпшення органічної видачі в Google.',
    tags: ['Next.JS', 'Supabase', 'TypeScript', 'Figma'],
    video:  tt,
    poster: Tt,
    url: 'https://ternotop.com.ua/',
    rx: '34% 66% 66% 34%',
    ry: '82% 26% 28% 74%',
    morphDuration: 8,
    morphDelay: -4,
    accent1: '#1a1a2e',
    accent2: '#8787c7',
  },
]