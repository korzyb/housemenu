// Lista zakupów: kategorie sklepowe, słownik produktów, normalizacja jednostek i sumowanie ilości.

// Kolejność jak w typowym sklepie (tak też sortujemy grupy na liście)
export const CATEGORIES = [
  { name: 'Owoce i warzywa',  emoji: '🥬' },
  { name: 'Pieczywo',         emoji: '🍞' },
  { name: 'Nabiał i jajka',   emoji: '🥛' },
  { name: 'Mięso i ryby',     emoji: '🥩' },
  { name: 'Suche produkty',   emoji: '🌾' },
  { name: 'Przyprawy i sosy', emoji: '🧂' },
  { name: 'Konserwy i słoiki', emoji: '🥫' },
  { name: 'Mrożonki',         emoji: '🧊' },
  { name: 'Napoje',           emoji: '🧃' },
  { name: 'Słodycze i przekąski', emoji: '🍫' },
  { name: 'Chemia i dom',     emoji: '🧴' },
  { name: 'Inne',             emoji: '🛒' },
]
export const CATEGORY_NAMES = CATEGORIES.map(c => c.name)

export function categoryEmoji(name) {
  return CATEGORIES.find(c => c.name === name)?.emoji ?? '🛒'
}

export function categoryOrder(name) {
  const i = CATEGORY_NAMES.indexOf(name)
  return i === -1 ? CATEGORY_NAMES.length - 1 : i
}

// Słownik: rdzeń słowa → kategoria. Działa bez AI (ręczne dodawanie, zapas przy limicie Gemini).
const DICTIONARY = [
  ['Owoce i warzywa', ['jabł', 'gruszk', 'banan', 'cytryn', 'limonk', 'pomarańcz', 'mandaryn', 'grejpfrut', 'truskaw', 'malin', 'borówk', 'jagod', 'wiśni', 'czereśn', 'śliw', 'brzoskwin', 'morel', 'winogron', 'kiwi', 'mango', 'ananas', 'awokad', 'arbuz', 'melon', 'granat',
    'pomidor', 'ogór', 'papryk', 'cebul', 'czosn', 'ziemniak', 'marchew', 'marchw', 'pietruszk', 'seler', 'por ', 'pory', 'kapust', 'brokuł', 'kalafior', 'cukini', 'bakłażan', 'dyni', 'dynia', 'szpinak', 'sałat', 'rukol', 'rzodkiew', 'burak', 'kukurydz', 'groszek', 'fasolka szparag', 'szparag', 'pieczark', 'grzyb', 'boczniak', 'koper', 'szczypior', 'natk', 'bazyli', 'mięt', 'kolendr', 'imbir', 'batat', 'jarmuż', 'kiełk', 'oliwk']],
  ['Pieczywo', ['chleb', 'bułk', 'bagietk', 'rogal', 'tortill', 'pita', 'chałk', 'grzank', 'bułka tarta', 'pieczyw']],
  ['Nabiał i jajka', ['mlek', 'mleko', 'jogurt', 'kefir', 'maślank', 'śmietan', 'śmietank', 'ser ', 'sera', 'serek', 'twaróg', 'twarog', 'mozzarell', 'parmezan', 'feta', 'ricott', 'mascarpone', 'masło', 'masła', 'jaj', 'skyr']],
  ['Mięso i ryby', ['kurczak', 'kurczę', 'filet', 'pierś', 'udk', 'indyk', 'wieprzow', 'wołow', 'mięs', 'mielon', 'schab', 'karkówk', 'boczek', 'szynk', 'kiełbas', 'parówk', 'salami', 'sallami', 'łosoś', 'dorsz', 'tuńczyk', 'krewet', 'ryb', 'śledź', 'makrel', 'pstrąg']],
  ['Suche produkty', ['mąk', 'cukier', 'cukru', 'makaron', 'spaghetti', 'penne', 'ryż', 'kasz', 'płatki', 'owsian', 'kuskus', 'quinoa', 'komos', 'soczewic', 'ciecierzyc', 'fasol', 'proszek do pieczenia', 'soda', 'drożdż', 'skrobi', 'mąka', 'orzech', 'migdał', 'pestk', 'słonecznik', 'sezam', 'rodzynk', 'żurawin', 'kakao', 'kawa', 'herbat', 'wiórk', 'siemi', 'chia']],
  ['Przyprawy i sosy', ['sól', 'soli', 'pieprz', 'oregano', 'tymianek', 'rozmaryn', 'majeranek', 'cynamon', 'kurkum', 'kmin', 'curry', 'chili', 'gałka', 'wanili', 'ekstrakt', 'liść laur', 'ziele', 'olej', 'oliw', 'ocet', 'musztard', 'ketchup', 'majonez', 'sos ', 'sojow', 'miód', 'miodu', 'syrop', 'przypraw', 'bulion', 'kostk']],
  ['Konserwy i słoiki', ['koncentrat', 'passat', 'pomidory w puszce', 'w puszce', 'konserw', 'kukurydza konserw', 'dżem', 'konfitur', 'nutell', 'masło orzechowe', 'mleczko kokos', 'mleko kokos']],
  ['Mrożonki', ['mrożon', 'lody']],
  ['Napoje', ['sok ', 'soku', 'woda', 'wody', 'napój', 'wino', 'piwo']],
  ['Słodycze i przekąski', ['czekolad', 'baton', 'chips', 'ciastk', 'herbatnik', 'żelk', 'cukierk', 'paluszk', 'krakers']],
  ['Chemia i dom', ['papier', 'folia', 'worki', 'płyn do', 'proszek do prania', 'gąbk', 'ręcznik']],
]

export function guessCategory(name) {
  const n = ` ${String(name || '').toLowerCase()} `
  for (const [category, stems] of DICTIONARY) {
    if (stems.some(s => n.includes(s))) return category
  }
  return 'Inne'
}

// Klucz do łączenia tych samych produktów
export function nameKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[.,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Jednostki ─────────────────────────────────────────

const UNIT_FAMILIES = [
  { re: /^(g|gr|gram\w*)$/i,       family: 'mass',   factor: 1 },
  { re: /^(dag|deko\w*)$/i,        family: 'mass',   factor: 10 },
  { re: /^(kg|kilo\w*)$/i,         family: 'mass',   factor: 1000 },
  { re: /^(ml|mililitr\w*)$/i,     family: 'volume', factor: 1 },
  { re: /^(l|litr\w*)$/i,          family: 'volume', factor: 1000 },
  { re: /^łyżecz\w*$/i,            family: 'łyżeczka', factor: 1 },
  { re: /^łyż\w*$/i,               family: 'łyżka',  factor: 1 },
  { re: /^szklan\w*$/i,            family: 'szklanka', factor: 1 },
  { re: /^(szt\.?|sztuk\w*)$/i,    family: 'szt.',   factor: 1 },
  { re: /^ząb\w*|ząbk\w*$/i,       family: 'ząbek',  factor: 1 },
  { re: /^opak\w*$/i,              family: 'opak.',  factor: 1 },
  { re: /^puszk\w*|puszek$/i,      family: 'puszka', factor: 1 },
  { re: /^pęcz\w*$/i,              family: 'pęczek', factor: 1 },
  { re: /^plast\w*$/i,             family: 'plaster', factor: 1 },
  { re: /^kromk\w*$/i,             family: 'kromka', factor: 1 },
]

function unitInfo(unit, hasAmount) {
  const u = String(unit || '').trim().replace(/\.$/, '')
  if (!u) return hasAmount ? { family: 'szt.', factor: 1 } : null
  const hit = UNIT_FAMILIES.find(f => f.re.test(u) || f.re.test(u + '.'))
  return hit ? { family: hit.family, factor: hit.factor } : { family: u, factor: 1 }
}

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }

// "1.5" | "1,5" | "1½" | "1/2" → liczba; zakres "1-2" → górna wartość; tekst → null
export function parseAmount(raw) {
  if (raw == null) return null
  let s = String(raw).trim().replace(',', '.')
  if (!s) return null
  const range = s.match(/^([\d.]+)\s*[-–]\s*([\d.]+)$/)
  if (range) return parseFloat(range[2])
  let total = 0
  for (const [ch, v] of Object.entries(FRACTIONS)) {
    if (s.includes(ch)) { total += v; s = s.replace(ch, '') }
  }
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (frac) return total + Number(frac[1]) / Number(frac[2])
  s = s.trim()
  if (!s) return total || null
  const n = Number(s)
  return Number.isFinite(n) ? total + n : null
}

function formatNumber(n) {
  const r = Math.round(n * 100) / 100
  return Number.isInteger(r) ? String(r) : String(r).replace('.', ',')
}

// Odmiana jednostek: [1, 2–4, 5+]; ułamki → forma z 2–4 ("1,5 szklanki")
const UNIT_FORMS = {
  'łyżka':    ['łyżka', 'łyżki', 'łyżek'],
  'łyżeczka': ['łyżeczka', 'łyżeczki', 'łyżeczek'],
  'szklanka': ['szklanka', 'szklanki', 'szklanek'],
  'ząbek':    ['ząbek', 'ząbki', 'ząbków'],
  'puszka':   ['puszka', 'puszki', 'puszek'],
  'pęczek':   ['pęczek', 'pęczki', 'pęczków'],
  'plaster':  ['plaster', 'plastry', 'plastrów'],
  'kromka':   ['kromka', 'kromki', 'kromek'],
}

function pluralUnit(unit, n) {
  const forms = UNIT_FORMS[unit]
  if (!forms) return unit
  if (!Number.isInteger(n)) return forms[1]
  if (n === 1) return forms[0]
  const d = n % 10, dd = n % 100
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? forms[1] : forms[2]
}

function formatQuantity(family, base) {
  if (family === 'mass')   return base >= 1000 ? `${formatNumber(base / 1000)} kg` : `${formatNumber(base)} g`
  if (family === 'volume') return base >= 1000 ? `${formatNumber(base / 1000)} l` : `${formatNumber(base)} ml`
  const n = Math.round(base * 100) / 100
  return `${formatNumber(n)} ${pluralUnit(family, n)}`
}

// Sumowanie: [{ amount, unit, name, displayName?, category? }] → [{ name, amount (tekst), category }]
// Te same produkty (po nameKey) łączą się; ilości sumują się w obrębie rodziny jednostek (g+kg, ml+l…),
// różne rodziny pokazujemy razem: "2 szt. + 200 g".
export function aggregateIngredients(list) {
  const map = new Map()
  for (const ing of list) {
    const display = (ing.displayName || ing.name || '').trim()
    if (!display) continue
    const key = nameKey(display)
    if (!map.has(key)) {
      map.set(key, { name: display, category: ing.category, totals: new Map(), extras: new Set() })
    }
    const entry = map.get(key)
    if (!entry.category && ing.category) entry.category = ing.category

    const amount = parseAmount(ing.amount)
    const unit = unitInfo(ing.unit, amount != null)
    if (amount != null && unit) {
      entry.totals.set(unit.family, (entry.totals.get(unit.family) ?? 0) + amount * unit.factor)
    } else if (ing.amount || ing.unit) {
      // np. "szczypta", "do smaku" — bez sumowania
      const txt = [ing.amount, ing.unit].filter(Boolean).join(' ').trim()
      if (txt) entry.extras.add(txt)
    }
  }

  return [...map.values()].map(e => {
    const parts = [...e.totals.entries()].map(([fam, base]) => formatQuantity(fam, base))
    const extras = [...e.extras].filter(x => !parts.length || !/^szczypt/i.test(x))
    return {
      name: e.name,
      amount: [...parts, ...extras].join(' + ') || null,
      category: e.category || guessCategory(e.name),
    }
  })
}
