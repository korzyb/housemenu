// Kreator „Zaplanuj z AI” — JEDNO wywołanie Gemini na cały zakres (posiłek / dzień / tydzień).
// Dla każdego slotu zwraca 3 alternatywy. Tryb korekty: currentPlan + instruction → poprawiony plan.
//
// Wejście:
//   slots:        [{ date, dayLabel, mealType }]   — pory do zaplanowania
//   recipes:      [{ name, tags, prep_time }]      — baza przepisów użytkownika
//   household:    [{ name, brief }]                — planner_brief aktywnych domowników
//   recentMeals:  ["nazwa"]                        — ostatnio jedzone (unikaj powtórek)
//   existingPlan: [{ date, mealType, name }]       — już zaplanowane w tym tygodniu (kontekst)
//   pantry, preferences: ["..."], notes            — kroki 1–2 kreatora
//   currentPlan?: [{ date, mealType, name }], instruction?: string — korekta
// Wyjście: { plan: [{ date, mealType, options: [{ name, emoji, prep_time, from_db }] }], tip }

import { AiError, callGemini, corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'śniadanie',
  snack: 'przekąska',
  lunch: 'obiad',
  dinner: 'kolacja',
}

type Slot = { date: string; dayLabel: string; mealType: string }
type Option = { name: string; emoji?: string; prep_time?: number | null; from_db?: boolean }
type PlanItem = { date: string; mealType: string; options: Option[] }

const SYSTEM_PROMPT = `Jesteś asystentem planowania domowych posiłków dla polskiej rodziny.
Układasz praktyczne, smaczne menu z uwzględnieniem profili domowników, ich czasu i preferencji.
Zasady nadrzędne:
- Alergie, nietolerancje i wykluczenia dietetyczne domowników to TWARDE WETO — żadna propozycja nie może ich łamać.
- Priorytet mają przepisy z bazy użytkownika (podawaj wtedy DOKŁADNĄ nazwę z bazy), ale tylko gdy pasują.
- Unikaj powtarzania tych samych dań w planowanym okresie i dań jedzonych ostatnio.
- Dbaj o różnorodność w tygodniu (białka, warzywa, rodzaje dań) i realny czas gotowania.
- Nazwy dań po polsku, krótkie i konkretne (np. "Makaron z pesto i pomidorkami").`

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
      .slice(0, 80)
      .map(r => `- ${r.name}${r.prep_time ? ` (${r.prep_time} min)` : ''}${r.tags?.length ? ` [${r.tags.join(', ')}]` : ''}`)
      .join('\n') || 'brak przepisów w bazie'

    const householdLines = (household as { name: string; brief: string }[])
      .filter(m => m?.brief)
      .slice(0, 10)
      .map(m => `- ${m.name}: ${m.brief}`)
      .join('\n') || 'brak profili — planuj uniwersalnie dla rodziny'

    const slotLines = (slots as Slot[])
      .map(s => `- ${s.date} (${s.dayLabel}) — ${MEAL_LABELS[s.mealType] ?? s.mealType} [mealType: ${s.mealType}]`)
      .join('\n')

    const existingLines = (existingPlan as { date: string; mealType: string; name: string }[])
      .map(e => `- ${e.date} ${MEAL_LABELS[e.mealType] ?? e.mealType}: ${e.name}`)
      .join('\n') || 'nic'

    const correction = currentPlan && instruction
      ? `
KOREKTA: użytkownik ma już taką propozycję (wybrane dania):
${(currentPlan as { date: string; mealType: string; name: string }[])
  .map(c => `- ${c.date} ${MEAL_LABELS[c.mealType] ?? c.mealType}: ${c.name}`).join('\n')}

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
Dla KAŻDEJ pory z listy podaj dokładnie 3 różne propozycje (najlepsza jako pierwsza).
Jeśli użyto składników z domu — rozłóż je sensownie na kilka posiłków.

Zwróć WYŁĄCZNIE JSON:
{
  "plan": [
    { "date": "RRRR-MM-DD", "mealType": "breakfast|snack|lunch|dinner",
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
    const known = new Set((recipes as { name: string }[]).map(r => r.name.trim().toLowerCase()))
    const byKey = new Map((parsed.plan ?? []).map(p => [`${p.date}|${p.mealType}`, p]))
    const plan = (slots as Slot[]).map(s => {
      const options = (byKey.get(`${s.date}|${s.mealType}`)?.options ?? [])
        .filter(o => o?.name)
        .slice(0, 3)
        .map(o => ({
          name: String(o.name).trim(),
          emoji: o.emoji || '🍽',
          prep_time: typeof o.prep_time === 'number' ? o.prep_time : null,
          from_db: known.has(String(o.name).trim().toLowerCase()),
        }))
      return { date: s.date, mealType: s.mealType, options }
    })

    const missing = plan.filter(p => p.options.length === 0).length
    if (missing === plan.length) throw new AiError('AI nie zwróciło propozycji — spróbuj ponownie', 502)

    return jsonResponse({ plan, tip: parsed.tip ?? '' })
  } catch (err) {
    return errorResponse(err, 'plan-meals')
  }
})
