// Kopia zdjęcia przepisu we własnym magazynie (Storage, bucket recipe-photos) + podmiana recipes.photo_url.
// Wejście: { recipeId }                       — pobierz obecne zdjęcie przepisu (photo_url) i zapisz u nas
//          { recipeId, data, contentType }    — zdjęcie przekazane jako base64 (strony blokujące serwer)
// Wyjście: { photo_url, stored: true } albo { photo_url, stored: false, reason } gdy już jest u nas / brak zdjęcia.
// Zapis robi service role (dostępny w Edge Functions) — z aplikacji magazyn jest tylko do odczytu.

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

const BUCKET = 'recipe-photos'
const MAX_BYTES = 5 * 1024 * 1024
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

// Typ obrazka po pierwszych bajtach (serwery bywają niedokładne, np. application/octet-stream)
function sniffImage(b: Uint8Array): { type: string; ext: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' }
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { type: 'image/png', ext: 'png' }
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return { type: 'image/gif', ext: 'gif' }
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to))
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { type: 'image/webp', ext: 'webp' }
  if (ascii(4, 8) === 'ftyp' && /avi[fs]/.test(ascii(8, 12))) return { type: 'image/avif', ext: 'avif' }
  return null
}

function fromBase64(s: string): Uint8Array {
  const bin = atob(s.replace(/^data:[^,]*,/, ''))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { recipeId, data } = await req.json()
    if (!recipeId) return jsonResponse({ error: 'Brakuje recipeId' }, 400)

    const recRes = await fetch(`${SUPABASE_URL}/rest/v1/recipes?select=id,photo_url,photo_source_url&id=eq.${encodeURIComponent(recipeId)}`, { headers: admin })
    const recipe = (await recRes.json())?.[0]
    if (!recipe) return jsonResponse({ error: 'Nie ma takiego przepisu' }, 404)

    const current: string | null = recipe.photo_url
    if (!data && (!current || current.startsWith(PUBLIC_PREFIX))) {
      return jsonResponse({ photo_url: current, stored: false, reason: current ? 'już w magazynie' : 'brak zdjęcia' })
    }
    // Gdy zdjęcie jest już u nas, a przyszły dane (ponowne wgranie) — źródłem zostaje dotychczasowy oryginał
    const sourceUrl = current && !current.startsWith(PUBLIC_PREFIX) ? current : recipe.photo_source_url

    let bytes: Uint8Array
    if (data) {
      bytes = fromBase64(String(data))
    } else {
      const imgRes = await fetch(current!, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
          // bez AVIF — starsze iPhone'y go nie wyświetlą
          'Accept': 'image/webp,image/jpeg,image/png,image/*;q=0.5',
        },
        signal: AbortSignal.timeout(15000),
      })
      if (!imgRes.ok) {
        return jsonResponse({ error: `Nie udało się pobrać zdjęcia (${imgRes.status})`, status: imgRes.status }, 502)
      }
      bytes = new Uint8Array(await imgRes.arrayBuffer())
    }

    if (bytes.length > MAX_BYTES) return jsonResponse({ error: 'Zdjęcie jest za duże (max 5 MB)' }, 413)
    const kind = sniffImage(bytes)
    if (!kind) return jsonResponse({ error: 'To nie jest obrazek (JPEG/PNG/WebP/AVIF/GIF)' }, 415)

    // Nowa nazwa przy każdym zapisie — przeglądarki i service worker nie pokażą starej wersji z cache
    const path = `recipes/${recipe.id}-${Date.now().toString(36)}.${kind.ext}`
    const up = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { ...admin, 'Content-Type': kind.type, 'Cache-Control': 'max-age=31536000', 'x-upsert': 'true' },
      body: bytes,
    })
    if (!up.ok) throw new Error(`Zapis w magazynie nie powiódł się: ${up.status} ${await up.text()}`)

    const photoUrl = PUBLIC_PREFIX + path
    const upd = await fetch(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipe.id}`, {
      method: 'PATCH',
      headers: { ...admin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_url: photoUrl, photo_source_url: sourceUrl }),
    })
    if (!upd.ok) throw new Error(`Aktualizacja przepisu nie powiodła się: ${upd.status}`)

    // Poprzednie kopie zdjęć tego przepisu — sprzątamy, żeby nie zostawały sieroty
    const list = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...admin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: 'recipes/', search: `${recipe.id}-`, limit: 100 }),
    })
    const old = list.ok
      ? ((await list.json()) as { name: string }[]).map(o => `recipes/${o.name}`).filter(p => p !== path && p.startsWith(`recipes/${recipe.id}-`))
      : []
    if (old.length) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, {
        method: 'DELETE',
        headers: { ...admin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: old }),
      })
    }

    return jsonResponse({ photo_url: photoUrl, stored: true, bytes: bytes.length, type: kind.type })
  } catch (err) {
    return errorResponse(err, 'store-photo')
  }
})
