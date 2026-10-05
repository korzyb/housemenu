import { callGemini, corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'śniadanie',
  snack: 'przekąska',
  lunch: 'obiad',
  dinner: 'kolacja',
}

// Grupa, dla której jest posiłek (kolacja osobno dla dzieci i dorosłych)
const AUDIENCE_SUFFIX: Record<string, string> = {
  all: '',
  kids: ' dla dzieci',
  adults: ' dla dorosłych',
}

type Recipe = { name: string; tags?: string[] }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mealType, audience = 'all', recipes = [], plannedToday = [], household = [] } = await req.json()

    const mealLabel = MEAL_LABELS[mealType] ?? mealType
    const forWhom = AUDIENCE_SUFFIX[audience] ?? ''

    // Najpierw przepisy otagowane tą porą (np. „kolacja”), potem reszta — do 60 pozycji
    const list = recipes as Recipe[]
    const tagged = list.filter(r => r.tags?.some(t => t.toLowerCase() === mealLabel))
    const rest = list.filter(r => !tagged.includes(r))
    const recipeNames = [...tagged, ...rest].slice(0, 60).map(r => r.name).join(', ') || 'brak przepisów'
    const plannedNames = (plannedToday as string[]).join(', ') || 'nic'

    // Streszczenia profili domowników z tej grupy (planner_brief z karty profilu)
    const householdLines = (household as { name: string; brief: string; child?: boolean }[])
      .filter(m => m?.brief)
      .slice(0, 10)
      .map(m => `- ${m.name}${m.child ? ' (dziecko)' : ''}: ${m.brief}`)
      .join('\n')
    const householdSection = householdLines
      ? `\nDomownicy, dla których gotujemy ten posiłek (profile żywieniowe):\n${householdLines}\n`
      : ''
    const householdRules = householdLines
      ? `- Alergie, nietolerancje i wykluczenia dietetyczne domowników to TWARDE WETO — żadna propozycja nie może ich łamać
- Uwzględnij preferencje smakowe, pewniaki i dostępny czas/sprzęt domowników; danie ma pasować tym osobom
`
      : ''
    const audienceRule = audience === 'kids'
      ? '- To posiłek TYLKO dla dzieci: proste, lubiane przez dzieci, łagodne w smaku, łatwe do zjedzenia, bez ostrych przypraw\n'
      : audience === 'adults'
        ? '- To posiłek TYLKO dla dorosłych (dzieci jedzą osobno)\n'
        : ''

    const prompt = `Zaproponuj 3 pomysły na ${mealLabel}${forWhom} po polsku.

Przepisy w bazie użytkownika (najpierw te oznaczone jako ${mealLabel}): ${recipeNames}
Już zaplanowane dzisiaj: ${plannedNames}
${householdSection}
Zasady:
${householdRules}${audienceRule}- Preferuj przepisy z bazy (użyj dokładnej nazwy, "from_db": true), ale tylko jeśli pasują
- Jeśli proponujesz coś nowego: "from_db": false
- Unikaj powtórzeń z "już zaplanowane"
- Odpowiedz TYLKO tablicą JSON (bez markdown, bez wyjaśnień):

[
  {"name": "string", "from_db": boolean, "emoji": "jedno emoji", "prep_time": liczba_lub_null},
  {"name": "string", "from_db": boolean, "emoji": "jedno emoji", "prep_time": liczba_lub_null},
  {"name": "string", "from_db": boolean, "emoji": "jedno emoji", "prep_time": liczba_lub_null}
]`

    const raw = await callGemini({ prompt, temperature: 0.8, maxOutputTokens: 1024, json: true })
    // "z Twoich przepisów" tylko gdy nazwa faktycznie jest w bazie (model potrafi to zmyślić)
    const known = new Set(list.map(r => r.name.trim().toLowerCase()))
    const suggestions = (JSON.parse(raw) as { name: string; from_db?: boolean }[])
      .map(s => ({ ...s, from_db: known.has(String(s.name).trim().toLowerCase()) }))

    return jsonResponse({ suggestions })
  } catch (err) {
    return errorResponse(err, 'suggest-meal')
  }
})
