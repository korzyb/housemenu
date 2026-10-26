// Kreator „Zaplanuj z AI” — JEDNO wywołanie Gemini na cały zakres (posiłek / dzień / tydzień).
// Dla każdego slotu zwraca 3 alternatywy. Tryb korekty: currentPlan + instruction → poprawiony plan.
//
// Wejście:
//   slots:        [{ date, dayLabel, mealType, audience? }] — pory do zaplanowania (audience: all | kids | adults)
//   recipes:      [{ name, tags, prep_time }]      — baza przepisów użytkownika
//   household:    [{ name, brief, child? }]        — planner_brief aktywnych domowników (child = dziecko)
//   recentMeals:  ["nazwa"]                        — ostatnio jedzone (unikaj powtórek)
//   existingPlan: [{ date, mealType, audience?, name }] — już zaplanowane w tym tygodniu (kontekst)
//   pantry, preferences: ["..."], notes            — kroki 1–2 kreatora
//   currentPlan?: [{ date, mealType, audience?, name }], instruction?: string — korekta
// Wyjście: { plan: [{ date, mealType, audience, options: [{ name, emoji, prep_time, from_db }] }], tip }

import { AiError, callGemini, corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'
import { findWebRecipes, orderOptions } from '../_shared/webrecipe.ts'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'śniadanie',
  snack: 'przekąska',
  lunch: 'obiad',
  dinner: 'kolacja',
}

// Kolacja osobno dla dzieci i dorosłych
const AUDIENCE_LABELS: Record<string, string> = {
  all: '',
  kids: ' dla dzieci',
  adults: ' dla dorosłych',
}

type Slot = { date: string; dayLabel: string; mealType: string; audience?: string }
type Option = { name: string; emoji?: string; prep_time?: number | null; from_db?: boolean }
type PlanItem = { date: string; mealType: string; audience?: string; options: Option[] }
type Planned = { date: string; mealType: string; audience?: string; name: string }

const aud = (a?: string) => (a && a in AUDIENCE_LABELS ? a : 'all')
const label = (mealType: string, audience?: string) => `${MEAL_LABELS[mealType] ?? mealType}${AUDIENCE_LABELS[aud(audience)]}`

const SYSTEM_PROMPT = `Jesteś asystentem planowania domowych posiłków dla polskiej rodziny.
Układasz praktyczne, smaczne menu z uwzględnieniem profili domowników, ich czasu i preferencji.
Zasady nadrzędne:
- Alergie, nietolerancje i wykluczenia dietetyczne domowników to TWARDE WETO — żadna propozycja nie może ich łamać.
- Dla każdej pory 3 propozycje w stałym układzie: 1. i 2. — przepisy Z BAZY użytkownika (DOKŁADNA nazwa z bazy),
  3. — NOWE danie spoza bazy (do znalezienia w sieci): krótka, typowa nazwa, jaką wpisuje się w wyszukiwarkę przepisów.
- Unikaj powtarzania tych samych dań w planowanym okresie i dań jedzonych ostatnio.
- Dbaj o różnorodność w tygodniu (białka, warzywa, rodzaje dań) i realny czas gotowania.
- Nazwy dań po polsku, krótkie i konkretne (np. "Makaron z pesto i pomidorkami").
- Posiłek „dla dzieci” planuj pod profile dzieci (proste, lubiane przez dzieci, łagodne); „dla dorosłych” — pod profile dorosłych.
- Tagi pór przy przepisach z bazy (śniadanie, obiad, kolacja) są WIĄŻĄCE: przepis otagowany np. tylko "obiad" proponuj WYŁĄCZNIE na obiad, nigdy na kolację ani śniadanie.`

function list(items: string[], empty = 'brak') {
  return items.length ? items.join(', ') : empty
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const {
      slots = [], recipes = [], household = [], recentMeals = [], existingPlan = [],
      pantry = '', preferences = [], notes = '', currentPlan = null, instruction = '',
    } = await req.json()

    if (!Array.isArray(slots) || slots.length === 0) {
      return jsonResponse({ error: 'Brak pór posiłków do zaplanowania' }, 400)
    }
    if (slots.length > 28) {
      return jsonResponse({ error: 'Za dużo pór naraz (max 28 — jeden tydzień)' }, 400)
    }

    const recipeLines = (recipes as { name: string; tags?: string[]; prep_time?: number }[])
      .slice(0, 120)
      .map(r => `- ${r.name}${r.prep_time ? ` (${r.prep_time} min)` : ''}${r.tags?.length ? ` [${r.tags.join(', ')}]` : ''}`)
      .join('\n') || 'brak przepisów w bazie'

    const householdLines = (household as { name: string; brief: string; child?: boolean }[])
      .filter(m => m?.brief)
      .slice(0, 10)
      .map(m => `- ${m.name}${m.child ? ' (dziecko)' : ''}: ${m.brief}`)
      .join('\n') || 'brak profili — planuj uniwersalnie dla rodziny'

    const slotLines = (slots as Slot[])
      .map(s => `- ${s.date} (${s.dayLabel}) — ${label(s.mealType, s.audience)} [mealType: ${s.mealType}, audience: ${aud(s.audience)}]`)
      .join('\n')

    const existingLines = (existingPlan as Planned[])
      .map(e => `- ${e.date} ${label(e.mealType, e.audience)}: ${e.name}`)
      .join('\n') || 'nic'

    const correction = currentPlan && instruction
      ? `
KOREKTA: użytkownik ma już taką propozycję (wybrane dania):
${(currentPlan as Planned[]).map(c => `- ${c.date} ${label(c.mealType, c.audience)}: ${c.name}`).join('\n')}

Prośba użytkownika: "${String(instruction).slice(0, 500)}"
Zmień TYLKO to, czego dotyczy prośba. Dla slotów bez zmian pierwsza opcja ma być dokładnie tym samym daniem co wyżej.
`
      : ''

    const prompt = `Zaplanuj posiłki dla poniższych pór.

PORY DO ZAPLANOWANIA:
${slotLines}

DOMOWNICY (profile żywieniowe):
${householdLines}

PRZEPISY W BAZIE UŻYTKOWNIKA:
${recipeLines}

JUŻ ZAPLANOWANE W TYM OKRESIE (nie zmieniaj, uwzględnij dla różnorodności):
${existingLines}

OSTATNIO JEDZONE (unikaj powtórek): ${list((recentMeals as string[]).slice(0, 40))}
SKŁADNIKI DO WYKORZYSTANIA (co jest w domu): ${String(pantry).trim() || 'nie podano'}
PREFERENCJE: ${list(preferences as string[], 'brak szczególnych')}
DODATKOWE WYMAGANIA: ${String(notes).trim() || 'brak'}
${correction}
Dla KAŻDEJ pory z listy podaj dokładnie 3 różne propozycje: dwie pierwsze z bazy ("from_db": true), trzecia — nowe danie spoza bazy ("from_db": false).
Jeśli użyto składników z domu — rozłóż je sensownie na kilka posiłków.

Zwróć WYŁĄCZNIE JSON:
{
  "plan": [
    { "date": "RRRR-MM-DD", "mealType": "breakfast|lunch|dinner", "audience": "all|kids|adults",
      "options": [ { "name": "string", "emoji": "jedno emoji", "prep_time": liczba_minut_lub_null, "from_db": boolean } ] }
  ],
  "tip": "opcjonalnie 1 zdanie: praktyczna podpowiedź dla kucharza (np. co przygotować wcześniej lub czego dokupić) albo pusty string"
}`

    const raw = await callGemini({
      systemInstruction: SYSTEM_PROMPT,
      prompt,
      temperature: 0.8,
      maxOutputTokens: 12000,
      json: true,
      timeoutMs: 90000,
    })

    let parsed: { plan?: PlanItem[]; tip?: string }
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new AiError('AI zwróciło niepełną odpowiedź — spróbuj ponownie', 502)
    }

    // Normalizacja: każdy żądany slot dokładnie raz, max 3 opcje, from_db weryfikowane z bazą
    const key = (n: string) => String(n).trim().toLowerCase()
    const known = new Set((recipes as { name: string }[]).map(r => key(r.name)))
    // Pory, do których przypisano przepis tagami (np. tylko „obiad”) — przepis spoza swojej pory odpada
    const MEAL_TAG_NAMES = new Set(['śniadanie', 'obiad', 'kolacja'])
    const mealTags = new Map((recipes as { name: string; tags?: string[] }[]).map(r =>
      [key(r.name), (r.tags ?? []).map(t => t.toLowerCase()).filter(t => MEAL_TAG_NAMES.has(t))]))
    const fitsMeal = (name: string, mealType: string) => {
      const tags = mealTags.get(key(name))
      return !tags?.length || tags.includes(MEAL_LABELS[mealType])
    }
    const byKey = new Map((parsed.plan ?? []).map(p => [`${p.date}|${p.mealType}|${aud(p.audience)}`, p]))
    const plan = (slots as Slot[]).map(s => {
      const raw = (byKey.get(`${s.date}|${s.mealType}|${aud(s.audience)}`)?.options ?? []).filter(o => o?.name)
      const fitting = raw.filter(o => fitsMeal(o.name, s.mealType))
      const all = (fitting.length ? fitting : raw).map(o => ({
        name: String(o.name).trim(),
        emoji: o.emoji || '🍽',
        prep_time: typeof o.prep_time === 'number' ? o.prep_time : null,
        from_db: known.has(key(o.name)),
      }))
      return { date: s.date, mealType: s.mealType, audience: aud(s.audience), options: orderOptions(all) }
    })

    const missing = plan.filter(p => p.options.length === 0).length
    if (missing === plan.length) throw new AiError('AI nie zwróciło propozycji — spróbuj ponownie', 502)

    // Nowe dania (spoza bazy) → prawdziwy przepis z sieci: nazwa ze strony, link i zdjęcie
    const webOptions = plan.flatMap(p => p.options.filter(o => !o.from_db))
    const found = await findWebRecipes(webOptions.map(o => o.name))
    for (const o of webOptions) {
      const w = found.get(o.name)
      if (w) Object.assign(o, { name: w.name, url: w.url, photo_url: w.photo_url, source: w.source })
    }

    return jsonResponse({ plan, tip: parsed.tip ?? '' })
  } catch (err) {
    return errorResponse(err, 'plan-meals')
  }
})
