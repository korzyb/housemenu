import { callGemini, corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) {
      return jsonResponse({ error: 'Brakuje parametru url' }, 400)
    }


    // Pobierz stronę
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; housemenu-bot/1.0)' },
      signal: AbortSignal.timeout(12000),
    })
    if (!pageRes.ok) throw new Error(`Nie udało się pobrać strony: ${pageRes.status}`)

    const html = await pageRes.text()

    // Zdjęcie przepisu z <meta property="og:image"> (atrybuty w dowolnej kolejności)
    const ogRaw =
      html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image(?::url)?["']/i)?.[1]
    let photoUrl: string | null = null
    try {
      if (ogRaw) photoUrl = new URL(ogRaw.replace(/&amp;/g, '&'), url).href
    } catch {
      photoUrl = null
    }

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

    const raw = await callGemini({ prompt, temperature: 0.2, maxOutputTokens: 4096, json: true })
    const recipe = JSON.parse(raw)
    if (!recipe.error && photoUrl) recipe.photo_url = photoUrl

    return jsonResponse(recipe)
  } catch (err) {
    return errorResponse(err, 'import-recipe')
  }
})
