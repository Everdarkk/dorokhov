// Глобальні SSG-флаги — застосовуються до всіх маршрутів.
// ssr:true      → HTML генерується при `npm run build` (статичний)
// csr:true      → JS гідратується в браузері (анімації працюють)
// prerender:true → сторінка записується як статичний .html файл

export const prerender = true
export const ssr       = true
export const csr       = true