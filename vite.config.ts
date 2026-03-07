import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [sveltekit()],

	server: {
		host: true,   // залишаємо як у тебе — локальна мережа доступна
	},

	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				// vendor chunk — браузер кешує бібліотеки окремо від твого коду
				manualChunks(id) {
					if (id.includes('node_modules')) return 'vendor'
				},
			},
		},
	},
})