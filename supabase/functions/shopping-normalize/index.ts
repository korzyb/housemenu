// Lista zakupów: ujednolicenie nazw produktów + kategorie sklepowe — JEDNO wywołanie AI na generowanie.
// Wejście: { names: ["mąki pszennej", "Mąka pszenna typ 450", "jajek", ...], categories: ["Owoce i warzywa", ...] }
// Wyjście: { items: [{ input, name, category }] } — sumowanie ilości robi frontend (src/lib/shopping.js).

import { callGemini, corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { names = [], categories = [] } = await req.json()
    const input = [...new Set((names as string[]).map(n => String(n).trim()).filter(Boolean))].slice(0, 200)
    if (!input.length) return jsonResponse({ items: [] })
    const cats = (categories as string[]).length ? categories as string[] : ['Inne']

    const raw = await callGemini({
      prompt: `Przygotuj pozycje listy zakupów z nazw składników z przepisów.

Dla KAŻDEJ nazwy z listy podaj:
- "name": nazwa produktu do kupienia, w mianowniku, krótko, małą literą (np. "mąki pszennej typ 450" → "mąka pszenna",
  "jajek" → "jajka", "świeżo otarta skórka z cytryny" → "cytryna", "masła (miękkiego)" → "masło").
  Ten sam produkt zapisany różnie ma dostać IDENTYCZNĄ nazwę, żeby dało się zsumować ilości.
  Zachowaj rozróżnienia ważne przy zakupach (np. "cukier" vs "cukier puder", "jogurt naturalny" vs "jogurt grecki").
- "category": DOKŁADNIE jedna z kategorii: ${cats.map(c => `"${c}"`).join(', ')}.

Zwróć WYŁĄCZNIE JSON: {"items": [{"input": "nazwa z listy, bez zmian", "name": "string", "category": "string"}]}

NAZWY:
${input.map(n => `- ${n}`).join('\n')}`,
      temperature: 0.1,
      maxOutputTokens: 8192,
      json: true,
    })

    const parsed = JSON.parse(raw)
    const byInput = new Map(
      (parsed.items ?? []).map((i: { input: string; name: string; category: string }) => [String(i.input).trim(), i])
    )
    const items = input.map(n => {
      const hit = byInput.get(n) as { name?: string; category?: string } | undefined
      return {
        input: n,
        name: hit?.name ? String(hit.name).trim() : n,
        category: hit?.category && cats.includes(hit.category) ? hit.category : null,
      }
    })

    return jsonResponse({ items })
  } catch (err) {
    return errorResponse(err, 'shopping-normalize')
  }
})
