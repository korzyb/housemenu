// Service worker mealplanner — instalowalna PWA (pełny ekran, bez ikonki Chrome) + prosty tryb offline.
// Strony: najpierw sieć (zawsze najnowsza wersja po deployu), bez sieci — ostatnia zapisana kopia.
// Pliki z /assets/ mają hash w nazwie → można je brać z cache. Zapytania do innych domen (Supabase, czcionki,
// zdjęcia przepisów) idą normalnie, bez cache.

const CACHE = 'mealplanner-v3'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Nawigacja (otwarcie aplikacji / podstrony): sieć, a offline — zapisany index.html
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE)
      try {
        const res = await fetch(req)
        if (res.ok) cache.put('index.html', res.clone())
        return res
      } catch {
        return (await cache.match('index.html')) ?? new Response('Brak połączenia z internetem', { status: 503 })
      }
    })())
    return
  }

  // Pliki z hashem w nazwie i ikony: cache, a gdy brak — sieć (i zapis)
  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(req)
    if (cached) return cached
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  })())
})
