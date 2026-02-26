// Icon imports — Vite handles hashing and optimization at build time.
// Add new icons here as you add new cards.
import business from '$lib/assets/icons/business-growth.svg'
import control from '$lib/assets/icons/control.svg'
import conversion from '$lib/assets/icons/conversion.svg'
import internet from '$lib/assets/icons/internet.svg'
import maintenance from '$lib/assets/icons/maintenance.svg'
import scaling from '$lib/assets/icons/scaling.svg'
import seo from '$lib/assets/icons/seo.svg'
import speedometer from '$lib/assets/icons/speedometer.svg'


// ─── Types ───────────────────────────────────────────────────────────────────

export interface BlobCardLine {
  text: string
  icon?: string
}

export interface BlobCard {
  id: number
  type: 'photo' | 'text'
  title?: string
  /** Structured lines — each may carry an optional icon */
  lines?: BlobCardLine[]
  rx: string
  ry: string
  morphDuration: number
  morphDelay: number
  accent1: string
  accent2: string
}

// ─── Data ────────────────────────────────────────────────────────────────────

export const cards: BlobCard[] = [
  {
    id: 1,
    type: 'photo',
    rx: '60% 40% 55% 45%',
    ry: '45% 55% 40% 60%',
    morphDuration: 9,
    morphDelay: 0,
    accent1: '#e2103a',
    accent2: '#ff6b6b',
  },
  {
    id: 2,
    type: 'text',
    title: 'Хто я',
    lines: [
      { text: 'Веб-розробник, що спеціалізується на сучасних швидких сайтах та веб-застосунках для бізнесу.' },
      { text: 'Фокус на продуктивності, чистій архітектурі та довгостроковій підтримці проєкту.' },
    ],
    rx: '40% 60% 35% 65%',
    ry: '65% 35% 60% 40%',
    morphDuration: 11,
    morphDelay: -3,
    accent1: '#c2002a',
    accent2: '#ff3366',
  },
  {
    id: 3,
    type: 'text',
    title: 'Мої пріоритети',
    lines: [
      { icon: speedometer,   text: 'Швидке завантаження' },
      { icon: seo,     text: 'Якісне SEO для Google' },
      { icon: scaling,   text: 'Масштабованість бізнесу' },
      { icon: maintenance,  text: 'Легка підтримка' },
    ],
    rx: '55% 45% 65% 35%',
    ry: '35% 65% 45% 55%',
    morphDuration: 13,
    morphDelay: -6,
    accent1: '#99001a',
    accent2: '#e2103a',
  },
  {
    id: 4,
    type: 'text',
    title: 'Що це дає бізнесу?',
    lines: [
      { icon: conversion, text: 'Продукт з гарною конверсією' },
      { icon: internet, text: 'Органічний трафік в Google' },
      { icon: business,  text: 'Масштабованість в майбутньому' },
      { icon: control, text: 'Контроль та автоматизація' },
    ],
    rx: '45% 55% 40% 60%',
    ry: '60% 40% 55% 45%',
    morphDuration: 10,
    morphDelay: -9,
    accent1: '#7a0000',
    accent2: '#c2002a',
  },
]