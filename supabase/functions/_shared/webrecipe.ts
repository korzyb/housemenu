// Szukanie prawdziwego przepisu w sieci dla nazwy dania zaproponowanej przez AI.
// Źródła: kilka polskich serwisów (niżej). Zwraca nazwę ze strony, link i zdjęcie.
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

async function isImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(5000) })
    return res.ok && (res.headers.get('content-type') ?? '').startsWith('image/')
  } catch {
    return false
  }
}

// Kwestia Smaku: og:image to miniatura 250×250 („…_00.jpg” / „…-00.jpg”), pełne zdjęcie ma końcówkę 01
export async function fullKwestiaPhoto(photo: string | null): Promise<string | null> {
  if (!photo || !/kwestiasmaku\.com/.test(photo)) return photo
  const candidates = [
    photo.replace(/(_|-)00(_0)?\.jpg$/i, (_m, sep) => `${sep}01.jpg`),
    photo.replace(/_00(_0)?\.jpg$/i, '-01.jpg'),
  ].filter(c => c !== photo)
  for (const c of candidates) {
    if (await isImage(c)) return c
  }
  return photo
}

// WordPress: og:image bywa przyciętą wersją („…-1444x443.jpg”) — spróbuj oryginału
async function fullWpPhoto(photo: string | null): Promise<string | null> {
  const original = photo?.replace(/-\d+x\d+(\.(?:jpe?g|png|webp))$/i, '$1')
  if (!photo || !original || original === photo) return photo
  return await isImage(original) ? original : photo
}

// ── Źródła: sprawdzone polskie serwisy, przeszukiwane bez klucza API ──
type Candidate = { title: string; url: string; source: string }

// Kwestia Smaku — wyniki wyszukiwarki w HTML
async function searchKwestia(query: string): Promise<Candidate[]> {
  const html = await getText(`${KS}/szukaj?search_api_views_fulltext=${encodeURIComponent(query)}`)
  if (!html) return []
  const re = /<a href="((?:\/[a-z0-9_-]+)+\/przepis\.html|\/przepis\/[a-z0-9_-]+)"[^>]*>([^<]+)<\/a>/g
  return [...html.matchAll(re)].slice(0, 10)
    .map(m => ({ title: decode(m[2]).trim(), url: KS + m[1], source: 'kwestiasmaku.pl' }))
}

// Blogi na WordPressie — publiczne REST API z wyszukiwaniem
const WP_SOURCES = [
  { base: 'https://kuchniaagaty.pl', source: 'kuchniaagaty.pl' },
  { base: 'https://jadlonomia.com',  source: 'jadlonomia.com' },
  { base: 'https://mojewypieki.com', source: 'mojewypieki.com' },
]

async function searchWordPress(base: string, source: string, query: string): Promise<Candidate[]> {
  const json = await getText(`${base}/wp-json/wp/v2/posts?search=${encodeURIComponent(query)}&per_page=8&_fields=link,title`)
  if (!json) return []
  try {
    const posts = JSON.parse(json) as { link?: string; title?: { rendered?: string } }[]
    return posts
      .filter(p => p.link && p.title?.rendered)
      .map(p => ({ title: decode(p.title!.rendered!).replace(/<[^>]+>/g, '').trim(), url: p.link!, source }))
  } catch {
    return []
  }
}

// Dopasowanie tytułu do nazwy dania: jaka część słów z nazwy jest w tytule (z odmianą: „wołowy” ≈ „wołowa”),
// z lekką karą za dodatki w tytule („Gulasz wołowy z whisky” < „Gulasz wołowy”); próg 0.6 dopuszcza 1–3 dodatkowe słowa
const STOP = new Set(['z', 'ze', 'i', 'w', 'we', 'na', 'do', 'po', 'od', 'oraz', 'bez', 'dla', 'la', 'lub', 'przepis'])
const words = (s: string) => s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .split(/[^a-z0-9]+/).filter(w => w.length > 1 && !STOP.has(w))
const stem = (w: string) => w.slice(0, Math.max(3, Math.min(5, w.length - 1)))

export function matchScore(query: string, title: string): number {
  const q = words(query)
  const t = words(title)
  if (!q.length || !t.length) return 0
  const hit = q.filter(w => t.some(x => x.startsWith(stem(w)) || w.startsWith(stem(x)))).length
  return hit / q.length - 0.12 * Math.max(0, t.length - hit)
}

// Tytuł strony → nazwa dania: bez nazwy serwisu i końcowego „przepis” („Placki - przepis | Moje Wypieki” → „Placki”)
const cleanTitle = (t: string) => t
  .replace(/\s*[|–-]\s*(Kwestia Smaku|Kuchnia Agaty|Jadłonomia|Moje Wypieki).*$/i, '')
  .replace(/\s*[-–]?\s*przepis\s*$/i, '')
  .trim()

// Najlepiej pasujący przepis ze wszystkich serwisów (przy remisie losowo — żeby źródła się przeplatały)
export async function findWebRecipe(query: string): Promise<WebRecipe | null> {
  const lists = await Promise.all([
    searchKwestia(query),
    ...WP_SOURCES.map(s => searchWordPress(s.base, s.source, query)),
  ])
  const ranked = lists.flat()
    .map(c => ({ ...c, score: matchScore(query, c.title) }))
    .filter(c => c.score >= 0.6)
    .sort((a, b) => b.score - a.score)
  // Prawie równie dobre trafienia (różnica ≤ 0.05) — kolejność losowa, żeby nie zawsze wygrywał ten sam serwis
  const best = ranked[0]?.score ?? 0
  const top = ranked.filter(c => c.score >= best - 0.05).sort(() => Math.random() - 0.5)
  const order = [...top, ...ranked.filter(c => !top.includes(c))]

  for (const c of order.slice(0, 3)) {
    const page = await getText(c.url)
    if (!page) continue
    const title = cleanTitle(meta(page, 'og:title') ?? c.title)
    const og = meta(page, 'og:image')
    const photo = c.source === 'kwestiasmaku.pl' ? await fullKwestiaPhoto(og) : await fullWpPhoto(og)
    return { name: title || c.title, url: c.url, photo_url: photo, source: c.source }
  }
  return null
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

// Wiele wyszukiwań naraz, z limitem równoległych zapytań (każde wyszukiwanie pyta 4 serwisy)
export async function findWebRecipes(queries: string[], concurrency = 4): Promise<Map<string, WebRecipe | null>> {
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
