import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			pages:       'build',
			assets:      'build',
			// '200.html' — Vercel повертає цей файл для будь-якого шляху.
			// Потрібно щоб посилання типу /?section=... не давали 404.
			fallback:    '200.html',
			precompress: false,  // Vercel стискає сам — не треба робити це двічі
			strict:      true,   // помилка білду якщо якась сторінка не може бути prerendered
		}),
	},
}

export default config