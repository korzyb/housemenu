// Import przepisu z URL.
// 1) schema.org/Recipe (JSON-LD) — gdy strona go ma: dokładne składniki i kroki, metadane bez zgadywania.
//    AI tylko porządkuje składniki i rozbija kroki na atomowe; gdy AI niedostępne → dane ze strony bez zmian.
// 2) Brak schema.org → oczyszczony tekst strony → AI wyciąga cały przepis (też z atomowymi krokami).
// Kroki „atomowe” (styl Thermomix): jedna czynność / jeden dodawany składnik na krok.

import { callGemini, corsHeaders, errorResponse, jsonResponse } from '../_shared/gemini.ts'

type Ingredient = { amount: string | null; unit: string | null; name: string }
type Step = { order: number; text: string }
// deno-lint-ignore no-explicit-any
type Json = any

// ─── Reguły dla AI (wspólne dla obu trybów) ─────────────────────────────

const INGREDIENT_RULES = `ZASADY SKŁADNIKÓW:
- Jedna pozycja na składnik, w kolejności z przepisu.
- "amount": liczba jako tekst z kropką dziesiętną ("225", "1.5", "0.5"); ułamki zamieniaj na dziesiętne; brak ilości → null.
- Gdy podano kilka miar (np. "225 g mąki 1½ szklanki o poj. 250 ml"), wybierz miarę wagową/metryczną (g, ml), pozostałe pomiń.
- "unit" krótko: g, kg, ml, l, łyżka, łyżeczka, szklanka, szt., szczypta, opak., ząbek, plaster — albo null.
- "name" w mianowniku, z ważnym doprecyzowaniem: "mąka pszenna", "jogurt grecki", "skórka z cytryny (świeżo otarta)".
- Uwagi o składnikach (np. "w temperaturze pokojowej") przenieś do "notes".`

const STEP_RULES = `ZASADY KROKÓW (styl Thermomix — kroki ATOMOWE):
- Każdy krok = JEDNA czynność. Nie łącz czynności spójnikami "i", "z", "a następnie", "po czym".
- Dodanie KAŻDEGO składnika to OSOBNY krok i ZAWSZE z ilością z listy składników: "Dodaj 180 g jogurtu greckiego." (nie: "Dodaj jogurt").
  Jeśli zdanie łączy składniki z czynnością ("ubij jajka z cukrem", "wymieszaj mąkę z solą"), najpierw osobne kroki dodawania każdego składnika, potem osobny krok czynności.
- Jeśli danie się piecze, PIERWSZY krok to rozgrzanie piekarnika z temperaturą i trybem z przepisu. Przygotowanie formy (wyłożenie papierem, natłuszczenie) też osobno, przed ciastem.
- Podawaj parametry z oryginału: czas, temperaturę, tryb (termoobieg), obroty, ogień: "Miksuj 2 min na wysokich obrotach.", "Piecz 50 min w 170°C bez termoobiegu."
- Oczekiwanie i studzenie też są krokami: "Odstaw na 15 min.", "Ostudź na kratce."
- Czasownik w trybie rozkazującym na początku kroku ("Piecz", nie "Piec"; "Dodaj", nie "Dodać").
- Krótko: 1 zdanie, wyjątkowo 2. Wskazówki dot. jednej czynności (np. "użyj pół chochli ciasta") wstaw PRZED krokiem, którego dotyczą.
- Porady warunkowe ("jeśli lukier jest za gęsty…") i propozycje podania NIE są krokami — przenieś je do "notes".
- Zachowaj kolejność; nie pomijaj niczego i nie dodawaj od siebie (nie wymyślaj czasów ani temperatur, których nie ma).

PRZYKŁAD ROZBICIA:
Oryginał: "Piekarnik nagrzać do 180°C. Jajka ubić z cukrem, dodać jogurt i olej, krótko zmiksować. Mąkę wymieszać z proszkiem do pieczenia, przesiać do masy i wymieszać. Piec 45 minut."
Atomowo:
1. Rozgrzej piekarnik do 180°C.
2. Wbij 2 jajka do miski.
3. Dodaj 200 g cukru.
4. Ubij jajka z cukrem na kremową masę.
5. Dodaj 180 g jogurtu greckiego.
6. Dodaj 125 ml oleju.
7. Krótko zmiksuj do połączenia.
8. Do osobnej miski wsyp 225 g mąki.
9. Dodaj 2 łyżeczki proszku do pieczenia.
10. Wymieszaj suche składniki.
11. Przesiej suche składniki do masy.
12. Wymieszaj do połączenia.
13. Piecz 45 min w 180°C.`

// ─── Pomocnicze ───────────────────────────────────────────────────────

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&frac12;/g, '½').replace(/&frac14;/g, '¼').replace(/&frac34;/g, '¾')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
}

function clean(s: unknown): string {
  return decodeEntities(String(s ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

// "PT1H30M" / "P0DT0H45M" → minuty
function isoMinutes(v: unknown): number | null {
  const m = String(v ?? '').match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i)
  if (!m || !(m[1] || m[2] || m[3])) return null
  const min = (Number(m[1] || 0) * 24 + Number(m[2] || 0)) * 60 + Number(m[3] || 0)
  return min > 0 ? min : null
}

function firstImage(img: Json): string | null {
  if (!img) return null
  if (typeof img === 'string') return img
  if (Array.isArray(img)) return firstImage(img[0])
  return img.url ?? img.contentUrl ?? null
}

// recipeYield: 4 | "4" | "Makes 8" | ["4", "4 porcje"] → pierwsza liczba
function toServings(y: Json): number | null {
  const v = Array.isArray(y) ? y.join(' ') : y
  const n = parseInt(String(v ?? '').match(/\d+/)?.[0] ?? '', 10)
  return Number.isFinite(n) && n > 0 && n < 100 ? n : null
}

function toTags(r: Json): string[] {
  const raw = [r.keywords, r.recipeCategory, r.recipeCuisine]
    .flatMap(v => Array.isArray(v) ? v : String(v ?? '').split(','))
    .map(t => clean(t).toLowerCase())
    .filter(t => t && t.length <= 30)
  return [...new Set(raw)].slice(0, 6)
}

// recipeInstructions: string | [string | HowToStep | HowToSection]
function instructionTexts(ri: Json): string[] {
  if (!ri) return []
  if (typeof ri === 'string') {
    return decodeEntities(ri).split(/<\/(?:p|li)>|<br\s*\/?>|\n+/i).map(clean).filter(Boolean)
  }
  if (Array.isArray(ri)) return ri.flatMap(instructionTexts)
  const type = [].concat(ri['@type'] ?? [])
  if (type.includes('HowToSection') || ri.itemListElement) {
    const inner = instructionTexts(ri.itemListElement)
    const title = clean(ri.name)
    return title ? [`${title}:`, ...inner] : inner
  }
  const t = clean(ri.text ?? ri.name)
  return t ? [t] : []
}

// Szukaj obiektu @type Recipe w blokach JSON-LD (także w @graph / mainEntity)
function findSchemaRecipe(html: string): Json | null {
  const blocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const [, body] of blocks) {
    let data: Json
    try {
      data = JSON.parse(body.trim())
    } catch {
      try {
        data = JSON.parse(body.trim().replace(/[\u0000-\u001F]+/g, ' '))
      } catch {
        continue
      }
    }
    const stack = [data]
    while (stack.length) {
      const node = stack.pop()
      if (!node || typeof node !== 'object') continue
      if (Array.isArray(node)) { stack.push(...node); continue }
      if ([].concat(node['@type'] ?? []).includes('Recipe')) return node
      if (node['@graph']) stack.push(node['@graph'])
      if (node.mainEntity) stack.push(node.mainEntity)
    }
  }
  return null
}

// Proste parsowanie "200 g mąki" — tylko awaryjnie, gdy AI niedostępne
const UNIT_RE = /^(g|kg|dag|ml|l|łyżk\S*|łyżeczk\S*|szklan\S*|szt\.?|sztuk\S*|opak\S*|ząb\S*|szczypt\S*|pęcz\S*|plast\S*|kromk\S*)\s+/i
function parseIngredientLine(line: string): Ingredient {
  const s = clean(line)
  const m = s.match(/^([\d½¼¾⅓⅔.,/\s-]+)\s*(.*)$/)
  if (!m) return { amount: null, unit: null, name: s }
  const amount = m[1].trim()
    .replace('½', '.5').replace('¼', '.25').replace('¾', '.75').replace('⅓', '.33').replace('⅔', '.67')
    .replace(/^\./, '0.').replace(/(\d)\s*\.(\d)/, '$1.$2').replace(',', '.')
  const rest = m[2]
  const u = rest.match(UNIT_RE)
  return u
    ? { amount, unit: u[1], name: rest.slice(u[0].length) }
    : { amount, unit: null, name: rest }
}

// Tekst strony bez nawigacji, formularzy, przeliczników itp.
function pageText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style|noscript|svg|nav|header|footer|form|aside|select|button|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<\/(p|li|h[1-6]|div|tr|br)>|<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, 20000)
}

function normalizeIngredients(list: Json): Ingredient[] {
  return (Array.isArray(list) ? list : [])
    .filter((i: Json) => i?.name)
    .map((i: Json) => ({
      amount: i.amount != null && String(i.amount).trim() ? String(i.amount).trim() : null,
      unit: i.unit ? String(i.unit).trim() : null,
      name: String(i.name).trim(),
    }))
}

function normalizeSteps(list: Json): Step[] {
  return (Array.isArray(list) ? list : [])
    .map((s: Json) => (typeof s === 'string' ? s : s?.text))
    .filter((t: unknown) => t && String(t).trim())
    .map((t: string, i: number) => ({ order: i + 1, text: String(t).trim() }))
}

// ─── Cookidoo / Thermomix ─────────────────────────────────────────────

const DIFFICULTY: Record<string, string> = { 'łatwy': 'easy', 'średni': 'medium', 'trudny': 'hard' }

async function importThermomix(schema: Json, html: string, url: string) {
  const rawIngredients: string[] = (schema.recipeIngredient ?? []).map(clean).filter(Boolean)
  const pageTextPlain = clean(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' '))
  const difficultyPl = pageTextPlain.match(/Poziom trudności\s+(łatwy|średni|trudny)/i)?.[1]?.toLowerCase()
  const devices = [...new Set(pageTextPlain.match(/\bTM[5-7]\b/g) ?? [])].sort()
  const categories = [].concat(schema.recipeCategory ?? []).map(c => clean(c).split(' - ')[0]).filter(Boolean)

  const base = {
    name: clean(schema.name),
    description: clean(schema.description) || null,
    prep_time: isoMinutes(schema.totalTime) ?? isoMinutes(schema.prepTime),
    servings: toServings(schema.recipeYield),
    difficulty: difficultyPl ? DIFFICULTY[difficultyPl] : null,
    temperature: null as string | null,
    tags: [...new Set(['thermomix', ...categories.map(c => c.toLowerCase())])].slice(0, 6),
    photo_url: firstImage(schema.image),
    notes: `Przepis Thermomix — gotuj według przepisu w urządzeniu / Cookidoo.${devices.length ? ` Urządzenia: ${devices.join(', ')}.` : ''}${clean(schema.recipeYield) ? ` Wydajność: ${clean(schema.recipeYield)}.` : ''}`,
    steps: [] as Step[],
    import_source: 'thermomix',
    steps_mode: 'thermomix',
  }

  // AI tylko porządkuje składniki (mianownik, ilość/jednostka) + ocenia ciepło/zimno; przy błędzie — parser lokalny
  try {
    const raw = await callGemini({
      prompt: `Uporządkuj listę składników przepisu Thermomix "${base.name}".

${INGREDIENT_RULES}

Oceń też, czy danie podaje się na ciepło czy zimno.

Zwróć WYŁĄCZNIE JSON:
{"ingredients": [{"amount": "string|null", "unit": "string|null", "name": "string"}], "temperature": "hot|cold|null"}

SKŁADNIKI:
${rawIngredients.map(i => `- ${i}`).join('\n')}`,
      temperature: 0.1,
      maxOutputTokens: 4096,
      json: true,
    })
    const ai = JSON.parse(raw)
    const ingredients = normalizeIngredients(ai.ingredients)
    return {
      ...base,
      temperature: ai.temperature ?? null,
      ingredients: ingredients.length ? ingredients : rawIngredients.map(parseIngredientLine),
    }
  } catch (err) {
    console.warn('import-recipe (thermomix): AI niedostępne, składniki z parsera lokalnego:', (err as Error).message)
    return { ...base, ingredients: rawIngredients.map(parseIngredientLine) }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) {
      return jsonResponse({ error: 'Brakuje parametru url' }, 400)
    }

    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; housemenu-bot/1.0)',
        'Accept-Language': 'pl,en;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!pageRes.ok) throw new Error(`Nie udało się pobrać strony: ${pageRes.status}`)
    const html = await pageRes.text()

    // Zdjęcie z <meta property="og:image"> (atrybuty w dowolnej kolejności)
    const ogRaw =
      html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image(?::url)?["']/i)?.[1]
    const absolute = (u: string | null) => {
      try { return u ? new URL(decodeEntities(u), url).href : null } catch { return null }
    }

    const schema = findSchemaRecipe(html)

    // ── Tryb 0: Cookidoo (Thermomix) — kroki są tylko po zalogowaniu, gotowaniem steruje urządzenie.
    //    Bierzemy to, co publiczne: nazwa, zdjęcie, składniki, czasy, porcje, trudność; zamiast kroków — znacznik Thermomix.
    if (schema && /(^|\.)cookidoo\./i.test(new URL(url).hostname)) {
      return jsonResponse(await importThermomix(schema, html, url))
    }

    // ── Tryb 1: schema.org/Recipe ──
    if (schema) {
      const rawIngredients: string[] = (schema.recipeIngredient ?? schema.ingredients ?? []).map(clean).filter(Boolean)
      const rawSteps = instructionTexts(schema.recipeInstructions)
      const base = {
        name: clean(schema.name),
        description: clean(schema.description) || null,
        prep_time: isoMinutes(schema.totalTime) ??
          (((isoMinutes(schema.prepTime) ?? 0) + (isoMinutes(schema.cookTime) ?? 0)) || null),
        servings: toServings(schema.recipeYield),
        tags: toTags(schema),
        photo_url: absolute(firstImage(schema.image)) ?? absolute(ogRaw ?? null),
        import_source: 'schema',
      }

      try {
        const raw = await callGemini({
          prompt: `Uporządkuj przepis "${base.name}" pobrany z danych strukturalnych strony.

${INGREDIENT_RULES}

${STEP_RULES}

Wszystko po polsku (przetłumacz, jeśli strona jest w innym języku; jednostki imperialne zamień na metryczne).
Oceń też trudność ("easy" | "medium" | "hard") i czy danie podaje się na ciepło czy zimno ("hot" | "cold").

Zwróć WYŁĄCZNIE JSON:
{"name": "nazwa po polsku",
 "description": "1–2 zdania po polsku lub null",
 "ingredients": [{"amount": "string|null", "unit": "string|null", "name": "string"}],
 "steps": ["krok 1", "krok 2"],
 "notes": "string lub null",
 "tags": ["max 5 krótkich polskich tagów, np. śniadanie, szybkie, wegetariańskie"],
 "difficulty": "easy|medium|hard|null",
 "temperature": "hot|cold|null"}

OPIS ZE STRONY: ${base.description ?? 'brak'}

SKŁADNIKI ZE STRONY:
${rawIngredients.map(i => `- ${i}`).join('\n')}

KROKI ZE STRONY:
${rawSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
          temperature: 0.2,
          maxOutputTokens: 8192,
          json: true,
          timeoutMs: 60000,
        })
        const ai = JSON.parse(raw)
        const ingredients = normalizeIngredients(ai.ingredients)
        const steps = normalizeSteps(ai.steps)
        return jsonResponse({
          ...base,
          name: ai.name ? String(ai.name).trim() : base.name,
          description: ai.description ?? base.description,
          tags: Array.isArray(ai.tags) && ai.tags.length ? ai.tags.slice(0, 5) : base.tags,
          difficulty: ai.difficulty ?? null,
          temperature: ai.temperature ?? null,
          notes: ai.notes ?? null,
          ingredients: ingredients.length ? ingredients : rawIngredients.map(parseIngredientLine),
          steps: steps.length ? steps : rawSteps.map((text, i) => ({ order: i + 1, text })),
          steps_mode: steps.length ? 'atomic' : 'original',
        })
      } catch (err) {
        // AI niedostępne (np. limit) — przepis i tak się importuje, z krokami jak na stronie
        console.warn('import-recipe: AI niedostępne, dane schema.org bez zmian:', (err as Error).message)
        return jsonResponse({
          ...base,
          difficulty: null,
          temperature: null,
          notes: null,
          ingredients: rawIngredients.map(parseIngredientLine),
          steps: rawSteps.map((text, i) => ({ order: i + 1, text })),
          steps_mode: 'original',
        })
      }
    }

    // ── Tryb 2: brak schema.org → AI z oczyszczonego tekstu strony ──
    const text = pageText(html)
    const raw = await callGemini({
      prompt: `Wyciągnij przepis z poniższego tekstu strony. Pomiń elementy nawigacji, reklam, przeliczników i komentarzy.

${INGREDIENT_RULES}

${STEP_RULES}

Zwróć WYŁĄCZNIE JSON:
{
  "name": "string",
  "description": "string lub null (1–2 zdania)",
  "prep_time": liczba_minut_lub_null,
  "servings": liczba_lub_null,
  "difficulty": "easy" | "medium" | "hard" | null,
  "temperature": "hot" | "cold" | null,
  "tags": ["max 5 krótkich tagów"],
  "notes": "string lub null",
  "ingredients": [{"amount": "string|null", "unit": "string|null", "name": "string"}],
  "steps": ["krok 1", "krok 2"]
}
Jeśli na stronie nie ma przepisu: {"error": "Nie znaleziono przepisu na tej stronie"}

TEKST STRONY:
${text}`,
      temperature: 0.2,
      maxOutputTokens: 8192,
      json: true,
      timeoutMs: 60000,
    })

    const recipe = JSON.parse(raw)
    if (recipe.error) return jsonResponse(recipe)

    return jsonResponse({
      ...recipe,
      ingredients: normalizeIngredients(recipe.ingredients),
      steps: normalizeSteps(recipe.steps),
      photo_url: absolute(ogRaw ?? null),
      import_source: 'ai',
      steps_mode: 'atomic',
    })
  } catch (err) {
    return errorResponse(err, 'import-recipe')
  }
})
