// Lista zakupów: z nazw składników z przepisów robi pozycje do kupienia — JEDNO wywołanie AI na generowanie.
// AI widzi wszystkie nazwy naraz (i to, co już jest na liście), więc łączy warianty tego samego produktu
// („olej”, „olej do smażenia”, „olej roślinny” → „olej roślinny”) i zamienia opisy na produkty („szczypta pieprzu” → „pieprz”).
// Wejście: { items: [{ name, units: ["łyżka", "szczypta", ...] }], existing: ["mąka pszenna", ...], categories: [...] }
//          (starsza wersja aplikacji: { names: [...] })
// Wyjście: { items: [{ input, name, category, dropAmount, skip }] } — sumowanie ilości robi frontend (src/lib/shopping.js).
//   dropAmount — ilość nie ma sensu przy zakupach (szczypta, do smaku, 2 łyżki oleju) → na liście sama nazwa
//   skip       — tego się nie kupuje (woda z kranu, wrzątek, lód)

import { callGemini, corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

type InItem = { name: string; units: string[] }
type OutItem = { nr?: number; input?: string; name: string; category: string; drop_amount?: boolean; skip?: boolean }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const rawItems: InItem[] = Array.isArray(body.items)
      ? body.items.map((i: InItem) => ({ name: String(i?.name ?? '').trim(), units: (i?.units ?? []).map(String).filter(Boolean) }))
      : (body.names ?? []).map((n: string) => ({ name: String(n).trim(), units: [] }))
    const byName = new Map<string, InItem>()
    for (const i of rawItems) if (i.name && !byName.has(i.name)) byName.set(i.name, i)
    const input = [...byName.values()].slice(0, 200)
    if (!input.length) return jsonResponse({ items: [] })
    const cats = (body.categories as string[])?.length ? body.categories as string[] : ['Inne']
    const existing = [...new Set(((body.existing ?? []) as string[]).map(n => String(n).trim()).filter(Boolean))].slice(0, 150)

    const raw = await callGemini({
      prompt: `Zrób pozycje listy zakupów ze składników przepisów z całego planu posiłków. Myśl jak ktoś, kto idzie z tą listą do sklepu.

Dla KAŻDEGO składnika z listy SKŁADNIKI (każdy ma numer — zwróć go w "nr"; wszystkie numery, po kolei) podaj:
- "name": produkt do kupienia — w mianowniku, krótko, małą literą.
  • Opis porcji / przygotowania → sam produkt: "szczypta pieprzu" → "pieprz", "ząbki czosnku" → "czosnek",
    "sok z 1/2 cytryny" → "cytryna", "otarta skórka z pomarańczy" → "pomarańcza", "masła (miękkiego)" → "masło",
    "posiekana natka pietruszki" → "natka pietruszki", "jajek" → "jajka", "żółtka" / "białka" / "jajko do posmarowania" → "jajka"
    (kupuje się całe jajka — sztuki się zsumują).
  • WARIANTY TEGO SAMEGO PRODUKTU mają dostać IDENTYCZNĄ nazwę — porównuj wszystkie składniki ze sobą.
    Usuń opisy, które nie mają znaczenia w sklepie (do smażenia, świeży, posiekany, miękki, schłodzony, do posypania).
    ZACHOWAJ parametry, które decydują, co wziąć z półki: zawartość tłuszczu ("śmietana 18%", "mleko 2%", "jogurt 0%"),
    rodzaj ("mąka pszenna", "ser żółty", "papryka czerwona"), postać ("pomidory z puszki", "groszek mrożony").
    Ogólna nazwa + jeden dokładniejszy wariant tego samego → wszystkie dostają nazwę dokładniejszą:
    "śmietana" + "śmietana 18%" → "śmietana 18%"; "mąka" + "mąka pszenna" → "mąka pszenna"; "mleko" + "mleko 3,2%" → "mleko 3,2%".
    Wyjątek — oleje roślinne do smażenia to jeden produkt: "olej", "olej do smażenia", "olej roślinny", "olej rzepakowy" → "olej roślinny".
    Dwa RÓŻNE dokładne warianty zostają osobno: "śmietana 18%" ≠ "śmietana 30%", "mąka pszenna typ 450" ≠ "mąka pszenna typ 750".
  • NIE łącz różnych produktów: "cukier" ≠ "cukier puder", "olej roślinny" ≠ "oliwa z oliwek", "mąka pszenna" ≠ "mąka ziemniaczana",
    "jogurt naturalny" ≠ "jogurt grecki", "cebula" ≠ "cebula czerwona", "pomidory" ≠ "pomidory z puszki".
  • Jeśli ten sam produkt JEST JUŻ NA LIŚCIE (poniżej), użyj DOKŁADNIE tamtej nazwy.
- "category": DOKŁADNIE jedna z kategorii: ${cats.map(c => `"${c}"`).join(', ')}.
  Oleje, oliwa, ocet, sosy, przyprawy i zioła suszone → kategoria przypraw i sosów (jeśli jest).
- "drop_amount": true, gdy ilość z przepisu nic nie mówi przy zakupach i na liście ma być sama nazwa:
  szczypta, do smaku, odrobina, opcjonalnie, garść ziół; sól, pieprz i inne przyprawy, oleje, oliwa, ocet, sosy
  w ilościach łyżek/łyżeczek. W pozostałych przypadkach false (np. "500 g mięsa", "3 jajka", "200 ml śmietany").
- "skip": true TYLKO dla tego, czego się nie kupuje: woda (z kranu), wrzątek, lód. Woda gazowana / mineralna jako napój — false.

Zwróć WYŁĄCZNIE JSON: {"items": [{"nr": numer składnika z listy, "name": "string", "category": "string", "drop_amount": boolean, "skip": boolean}]}

JUŻ NA LIŚCIE: ${existing.length ? existing.join('; ') : 'nic'}

SKŁADNIKI (nazwa | jednostki z przepisów):
${input.map((i, k) => `${k + 1}. ${i.name}${i.units.length ? ` | ${[...new Set(i.units)].join(', ')}` : ''}`).join('\n')}`,
      temperature: 0.1,
      maxOutputTokens: 12000,
      json: true,
    })

    const parsed = JSON.parse(raw)
    // Dopasowanie po numerze (AI potrafi poprawić nazwę w polu input); zapasowo po nazwie
    const out = (parsed.items ?? []) as OutItem[]
    const byNr = new Map(out.filter(i => Number(i.nr) > 0).map(i => [Number(i.nr), i]))
    const byInput = new Map(out.filter(i => i.input).map(i => [String(i.input).trim(), i]))
    const items = input.map(({ name: n }, k) => {
      const hit = byNr.get(k + 1) ?? byInput.get(n)
      return {
        input: n,
        name: hit?.name ? String(hit.name).trim().toLowerCase() : n,
        category: hit?.category && cats.includes(hit.category) ? hit.category : null,
        dropAmount: hit?.drop_amount === true,
        skip: hit?.skip === true,
      }
    })

    return jsonResponse({ items })
  } catch (err) {
    return errorResponse(err, 'shopping-normalize')
  }
})
