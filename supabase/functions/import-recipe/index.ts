const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) {
      return new Response(JSON.stringify({ error: 'Brakuje parametru url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY nie jest skonfigurowany w Supabase secrets')

    // Pobierz stronę
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; housemenu-bot/1.0)' },
      signal: AbortSignal.timeout(12000),
    })
    if (!pageRes.ok) throw new Error(`Nie udało się pobrać strony: ${pageRes.status}`)

    const html = await pageRes.text()

    // Wyciągnij tekst (usuń skrypty, style, tagi HTML)
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000)

    const prompt = `Wyciągnij przepis z poniższego tekstu strony i zwróć TYLKO tablicę/obiekt JSON (bez markdown, bez wyjaśnień):
{
  "name": "string",
  "description": "string lub null",
  "prep_time": liczba_minut_lub_null,
  "servings": liczba_lub_null,
  "difficulty": "easy" lub "medium" lub "hard" lub null,
  "temperature": "hot" lub "cold" lub null,
  "tags": ["string"],
  "notes": null,
  "ingredients": [{"amount": "string lub null", "unit": "string lub null", "name": "string"}],
  "steps": [{"order": 1, "text": "string"}, {"order": 2, "text": "string"}]
}

Jeśli nie ma przepisu na stronie: {"error": "Nie znaleziono przepisu na tej stronie"}

Tekst strony:
${text}`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
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

    // Usuń ewentualne bloki markdown
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    const recipe = JSON.parse(raw)

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('import-recipe error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
