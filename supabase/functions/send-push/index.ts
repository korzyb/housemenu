// Powiadomienia push o zmianach: nowy przepis / posiłek w planie (dodany albo zmieniony).
// Wołane przez wyzwalacze w bazie (pg_net) — patrz supabase/migrations/20261031_push_notifications.sql.
// Wejście: { table: 'recipes' | 'meal_plans', ids: uuid[], device: string | null }
//   device — urządzenie, które zrobiło zmianę: ono powiadomienia nie dostaje.
// Wdrażane bez weryfikacji JWT (baza nie ma klucza) — dlatego treść budujemy tylko z prawdziwych wierszy z bazy
// i tylko ze świeżych zmian (ostatnie 2 min); wywołanie z zewnątrz może najwyżej powtórzyć świeże powiadomienie.
// Sekrety: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY (npx web-push generate-vapid-keys).

import webpush from 'npm:web-push@3.6.7'
import { corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` }
const FRESH_MS = 2 * 60 * 1000

const MEALS: Record<string, string> = { breakfast: 'Śniadanie', lunch: 'Obiad', dinner: 'Kolacja' }
const AUDIENCE: Record<string, string> = { kids: ' · 🧸 dzieci', adults: ' · 🧑‍🤝‍🧑 dorośli' }

type Sub = { endpoint: string; p256dh: string; auth: string; device_id: string | null }
type Message = { title: string; body: string; url: string; tag: string }

async function rest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...init, headers: { ...admin, ...init.headers } })
  if (!res.ok) throw new Error(`REST ${path.split('?')[0]}: ${res.status}`)
  return res.status === 204 ? null : res.json()
}

const isFresh = (ts: string | null) => !!ts && Date.now() - new Date(ts).getTime() < FRESH_MS
const inList = (ids: string[]) => `in.(${ids.map(id => id.replace(/[^0-9a-f-]/gi, '')).join(',')})`
const shorten = (s: string, n = 120) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

// 'RRRR-MM-DD' → „czwartek, 30 paź”
function dayLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' })
    .replace('.', '')
}

// Poniedziałek tygodnia (do linku w plan?week=)
function weekStart(date: string): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

async function recipesMessage(ids: string[]): Promise<Message | null> {
  const rows = (await rest(`recipes?select=id,name,created_at&id=${inList(ids)}`)) as
    { id: string; name: string; created_at: string }[]
  const fresh = rows.filter(r => isFresh(r.created_at))
  if (!fresh.length) return null
  if (fresh.length === 1) {
    return { title: '📖 Nowy przepis', body: fresh[0].name, url: `recipes/${fresh[0].id}`, tag: `recipe-${fresh[0].id}` }
  }
  return {
    title: `📖 Nowe przepisy (${fresh.length})`,
    body: shorten(fresh.map(r => r.name).join(', ')),
    url: 'recipes?sort=new',
    tag: `recipes-${fresh[0].id}`,
  }
}

async function mealsMessage(ids: string[]): Promise<Message | null> {
  const rows = (await rest(`meal_plans?select=id,date,meal_type,audience,skipped,custom_name,created_at,updated_at,recipe:recipes(name)&id=${inList(ids)}&order=date,meal_type`)) as
    { id: string; date: string; meal_type: string; audience: string; skipped: boolean; custom_name: string | null;
      created_at: string; updated_at: string | null; recipe: { name: string } | null }[]
  const fresh = rows.filter(r => !r.skipped && MEALS[r.meal_type] && (isFresh(r.updated_at) || isFresh(r.created_at)))
  if (!fresh.length) return null
  const dish = (r: typeof fresh[number]) => r.recipe?.name ?? r.custom_name ?? '—'
  const url = `plan?week=${weekStart(fresh[0].date)}`

  if (fresh.length === 1) {
    const r = fresh[0]
    return {
      title: `📅 ${MEALS[r.meal_type]}${AUDIENCE[r.audience] ?? ''} · ${dayLabel(r.date)}`,
      body: dish(r),
      url,
      tag: `meal-${r.date}-${r.meal_type}-${r.audience}`,
    }
  }
  const days = [...new Set(fresh.map(r => r.date))]
  return {
    title: `📅 Zaplanowano ${fresh.length} ${fresh.length < 5 ? 'posiłki' : 'posiłków'}`,
    body: shorten(days.length === 1
      ? `${dayLabel(days[0])}: ${fresh.map(r => `${MEALS[r.meal_type].toLowerCase()} — ${dish(r)}`).join(', ')}`
      : `${dayLabel(days[0])} – ${dayLabel(days[days.length - 1])}: ${fresh.slice(0, 4).map(dish).join(', ')}${fresh.length > 4 ? '…' : ''}`),
    url,
    tag: `plan-${fresh[0].id}`,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { table, ids, device } = await req.json()
    const list = (Array.isArray(ids) ? ids : []).map(String).slice(0, 200)
    if (!list.length) return jsonResponse({ sent: 0 })

    const message = table === 'recipes' ? await recipesMessage(list)
      : table === 'meal_plans' ? await mealsMessage(list)
      : null
    if (!message) return jsonResponse({ sent: 0, reason: 'brak świeżych zmian' })

    const subs = ((await rest('push_subscriptions?select=endpoint,p256dh,auth,device_id')) as Sub[])
      .filter(s => !device || s.device_id !== device)
    if (!subs.length) return jsonResponse({ sent: 0, reason: 'brak innych urządzeń' })

    webpush.setVapidDetails('https://korzyb.github.io/housemenu/', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)
    const payload = JSON.stringify(message)
    const gone: string[] = []
    let sent = 0
    await Promise.all(subs.map(async s => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600 })
        sent++
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) gone.push(s.endpoint) // urządzenie wyłączyło powiadomienia / odinstalowało aplikację
        else console.warn('send-push:', code, (err as Error).message)
      }
    }))
    if (gone.length) {
      await rest(`push_subscriptions?endpoint=in.(${gone.map(e => `"${e.replace(/"/g, '')}"`).join(',')})`, { method: 'DELETE' })
    }
    return jsonResponse({ sent, removed: gone.length })
  } catch (err) {
    return errorResponse(err, 'send-push')
  }
})
