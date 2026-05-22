const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
    const { mealType, recipes = [], plannedToday = [] } = await req.json()

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY nie jest skonfigurowany w Supabase secrets')

    const mealLabel = MEAL_LABELS[mealType] ?? mealType
    const recipeNames = (recipes as { name: string }[]).slice(0, 30).map(r => r.name).join(', ') || 'brak przepisów'
    const plannedNames = (plannedToday as string[]).join(', ') || 'nic'

    const prompt = `Zaproponuj 3 pomysły na ${mealLabel} po polsku.

Przepisy w bazie użytkownika: ${recipeNames}
Już zaplanowane dzisiaj: ${plannedNames}

Zasady:
- Preferuj przepisy z bazy (użyj dokładnej nazwy, "from_db": true)
- Jeśli proponujesz coś nowego: "from_db": false
- Unikaj powtórzeń z "już zaplanowane"
- Odpowiedz TYLKO tablicą JSON (bez markdown, bez wyjaśnień):

[
  {"name": "string", "from_db": boolean, "emoji": "string", "prep_time": liczba_lub_null},
  {"name": "string", "from_db": boolean, "emoji": "string", "prep_time": liczba_lub_null},
  {"name": "string", "from_db": boolean, "emoji": "string", "prep_time": liczba_lub_null}
]`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      throw new Error(`Gemini API error ${geminiRes.status}: ${errText.slice(0, 200)}`)
    }

    const geminiData = await geminiRes.json()
    let raw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    // Usuń ewentualne bloki markdown (```json ... ```)
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    const suggestions = JSON.parse(raw)

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('suggest-meal error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
