// Szukanie prawdziwego przepisu w sieci dla nazwy dania zaproponowanej przez AI.
// Źródło: wyszukiwarka Kwestii Smaku (wyniki w HTML, bez klucza API). Zwraca nazwę ze strony, link i zdjęcie.
// AI samo nie przegląda sieci — linki podane z pamięci bywają zmyślone, dlatego szukamy po nazwie.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
const KS = 'https://www.kwestiasmaku.com'

export type WebRecipe = { name: string; url: string; photo_url: string | null; source: string }

const decode = (s: string) => s
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))

async function getText(url: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pl' }, signal: AbortSignal.timeout(timeoutMs) })
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

function meta(html: string, prop: string): string | null {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i')) ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, 'i'))
  return m ? decode(m[1]) : null
}

// Kwestia Smaku: og:image to miniatura 250×250 („…_00.jpg” / „…-00.jpg”), pełne zdjęcie ma końcówkę 01
export async function fullKwestiaPhoto(photo: string | null): Promise<string | null> {
  if (!photo || !/kwestiasmaku\.com/.test(photo)) return photo
  const candidates = [
    photo.replace(/(_|-)00(_0)?\.jpg$/i, (_m, sep) => `${sep}01.jpg`),
    photo.replace(/_00(_0)?\.jpg$/i, '-01.jpg'),
  ].filter(c => c !== photo)
  for (const c of candidates) {
    try {
      const res = await fetch(c, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000) })
      if (res.ok && (res.headers.get('content-type') ?? '').startsWith('image/')) return c
    } catch { /* zostaje miniatura */ }
  }
  return photo
}

export async function findWebRecipe(query: string): Promise<WebRecipe | null> {
  const html = await getText(`${KS}/szukaj?search_api_views_fulltext=${encodeURIComponent(query)}`)
  if (!html) return null
  const path = html.match(/<a href="((?:\/[a-z0-9_-]+)+\/przepis\.html|\/przepis\/[a-z0-9_-]+)"/)?.[1]
  if (!path) return null
  const url = KS + path
  const page = await getText(url)
  if (!page) return null
  const title = (meta(page, 'og:title') ?? page.match(/<title>([^<]+)/)?.[1] ?? query)
    .replace(/\s*[|–-]\s*Kwestia Smaku.*$/i, '').trim()
  const photo = await fullKwestiaPhoto(meta(page, 'og:image'))
  return { name: title || query, url, photo_url: photo, source: 'kwestiasmaku.pl' }
}

// Układ 3 propozycji: dwie pierwsze z bazy użytkownika, trzecia z sieci.
// Gdy AI dało mniej z bazy (albo nic nowego) — luki uzupełnia reszta; propozycja z sieci zostaje ostatnia.
export function orderOptions<T extends { name: string; from_db: boolean }>(all: T[]): T[] {
  const seen = new Set<string>()
  const unique = all.filter(o => {
    const k = o.name.trim().toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  const db = unique.filter(o => o.from_db)
  const web = unique.filter(o => !o.from_db)
  const firstTwo = [...db, ...web.slice(1)].slice(0, 2)
  const last = web[0] ?? db[2]
  return last ? [...firstTwo, last] : firstTwo
}

// Wiele wyszukiwań naraz, z limitem równoległych zapytań
export async function findWebRecipes(queries: string[], concurrency = 6): Promise<Map<string, WebRecipe | null>> {
  const unique = [...new Set(queries.map(q => q.trim()).filter(Boolean))]
  const out = new Map<string, WebRecipe | null>()
  let next = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, async () => {
    while (next < unique.length) {
      const q = unique[next++]
      out.set(q, await findWebRecipe(q))
    }
  }))
  return out
}
