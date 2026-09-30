import { callGemini, corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'śniadanie',
  snack: 'przekąska',
  lunch: 'obiad',
  dinner: 'kolacja',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { mealType, recipes = [], plannedToday = [], household = [] } = await req.json()

    const mealLabel = MEAL_LABELS[mealType] ?? mealType
    const recipeNames = (recipes as { name: string }[]).slice(0, 30).map(r => r.name).join(', ') || 'brak przepisów'
    const plannedNames = (plannedToday as string[]).join(', ') || 'nic'

    // Streszczenia profili aktywnych domowników (planner_brief z karty profilu)
    const householdLines = (household as { name: string; brief: string }[])
      .filter(m => m?.brief)
      .slice(0, 10)
      .map(m => `- ${m.name}: ${m.brief}`)
      .join('\n')
    const householdSection = householdLines
      ? `\nDomownicy, dla których gotujemy (profile żywieniowe):\n${householdLines}\n`
      : ''
    const householdRules = householdLines
      ? `- Alergie, nietolerancje i wykluczenia dietetyczne domowników to TWARDE WETO — żadna propozycja nie może ich łamać
- Uwzględnij preferencje smakowe, pewniaki i dostępny czas/sprzęt domowników; danie ma pasować całej rodzinie
`
      : ''

    const prompt = `Zaproponuj 3 pomysły na ${mealLabel} po polsku.

Przepisy w bazie użytkownika: ${recipeNames}
Już zaplanowane dzisiaj: ${plannedNames}
${householdSection}
Zasady:
${householdRules}- Preferuj przepisy z bazy (użyj dokładnej nazwy, "from_db": true), ale tylko jeśli pasują do domowników
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
    const known = new Set((recipes as { name: string }[]).map(r => r.name.trim().toLowerCase()))
    const suggestions = (JSON.parse(raw) as { name: string; from_db?: boolean }[])
      .map(s => ({ ...s, from_db: known.has(String(s.name).trim().toLowerCase()) }))

    return jsonResponse({ suggestions })
  } catch (err) {
    return errorResponse(err, 'suggest-meal')
  }
})
