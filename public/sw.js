// Service worker mealplanner — instalowalna PWA (pełny ekran, bez ikonki Chrome) + prosty tryb offline.
// Strony: najpierw sieć (zawsze najnowsza wersja po deployu), bez sieci — ostatnia zapisana kopia.
// Pliki z /assets/ mają hash w nazwie → można je brać z cache. Zapytania do innych domen (Supabase, czcionki,
// zdjęcia przepisów) idą normalnie, bez cache.

const CACHE = 'mealplanner-v4'

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

  // Tylko pliki z hashem w nazwie (/assets/) z cache; manifest, ikony, sw.js — zawsze z sieci
  if (!url.pathname.includes('/assets/')) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE)
    const cached = await cache.match(req)
    if (cached) return cached
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  })())
})

// ── Powiadomienia push (Edge Function send-push): { title, body, url, tag } ──
self.addEventListener('push', event => {
  let msg = {}
  try { msg = event.data?.json() ?? {} } catch { msg = { body: event.data?.text() } }
  event.waitUntil(self.registration.showNotification(msg.title || 'mealplanner', {
    body: msg.body || '',
    tag: msg.tag,
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    data: { url: msg.url || 'today' },
  }))
})

// Kliknięcie → otwarta aplikacja przechodzi na wskazany ekran (albo otwiera się nowa)
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = new URL(event.notification.data?.url || 'today', self.registration.scope).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const open = windows.find(w => w.url.startsWith(self.registration.scope))
    if (open) {
      await open.focus()
      return open.navigate(target)
    }
    return self.clients.openWindow(target)
  })())
})
