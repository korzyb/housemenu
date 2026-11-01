// Wspólna, krótka lista tagów przepisów — jedno źródło dla aplikacji (src/lib/tags.js) i Edge Functions (import).
// Przepis dostaje tylko tagi z tej listy; inne nazwy z importu są tłumaczone (SYNONYMS) albo odrzucane.
// Tagi pór (śniadanie / obiad / kolacja) są wiążące dla planowania AI, „grill” wyklucza danie z planu tygodnia,
// „thermomix” oznacza przepis prowadzony przez urządzenie.

export const TAG_GROUPS: { title: string; tags: string[] }[] = [
  { title: 'Pora',          tags: ['śniadanie', 'obiad', 'kolacja', 'przekąska'] },
  { title: 'Rodzaj dania',  tags: ['zupa', 'sałatka', 'makaron', 'pierogi', 'kanapki', 'pizza', 'placki i naleśniki', 'deser', 'wypieki', 'dodatek'] },
  { title: 'Składnik',      tags: ['kurczak', 'indyk', 'wieprzowina', 'wołowina', 'mięso mielone', 'ryby', 'owoce morza', 'jajka', 'ser', 'kasza', 'ziemniaki', 'warzywa', 'owoce'] },
  { title: 'Dieta',         tags: ['wegetariańskie', 'bezglutenowe', 'fit', 'słodkie', 'dla dzieci'] },
  { title: 'Przygotowanie', tags: ['szybkie', 'bez gotowania', 'piekarnik', 'grill', 'thermomix'] },
  { title: 'Kuchnia',       tags: ['polska', 'włoska', 'azjatycka', 'meksykańska', 'amerykańska', 'hiszpańska', 'francuska'] },
  { title: 'Okazja',        tags: ['impreza'] },
]

export const ALL_TAGS: string[] = TAG_GROUPS.flatMap(g => g.tags)

// Inne nazwy (z importu, starsze tagi) → tag z listy
const SYNONYMS: Record<string, string> = {
  'śniadania': 'śniadanie', 'brunch': 'śniadanie', 'dania główne': 'obiad', 'danie główne': 'obiad',
  'przekąski': 'przekąska', 'przystawka': 'przekąska', 'przystawki': 'przekąska',
  'zupy': 'zupa', 'rosół': 'zupa', 'pomidorowa': 'zupa', 'jarzynowa': 'zupa', 'warzywna': 'zupa', 'krem': 'zupa',
  'sałatki': 'sałatka', 'surówka': 'dodatek', 'surówki': 'dodatek', 'dodatki': 'dodatek',
  'makaron ryżowy': 'makaron', 'makarony': 'makaron', 'spaghetti': 'makaron',
  'kanapki na ciepło': 'kanapki', 'do kanapek': 'kanapki', 'opiekacz': 'kanapki', 'tosty': 'kanapki',
  'naleśniki': 'placki i naleśniki', 'placki': 'placki i naleśniki', 'pancakes': 'placki i naleśniki', 'gofry': 'placki i naleśniki',
  'desery': 'deser', 'desery i słodycze': 'deser', 'drożdżowe': 'wypieki', 'ciasta': 'wypieki', 'ciasto': 'wypieki',
  'drób': 'kurczak', 'boczek': 'wieprzowina', 'karkówka': 'wieprzowina', 'schab': 'wieprzowina',
  'polędwiczki': 'wieprzowina', 'polędwiczki wieprzowe': 'wieprzowina', 'steki': 'wołowina', 'mielone': 'mięso mielone',
  'ryba': 'ryby', 'łosoś': 'ryby', 'dorsz': 'ryby', 'krewetki': 'owoce morza',
  'jaja': 'jajka', 'jajko': 'jajka', 'twaróg': 'ser', 'sery': 'ser', 'kasza jaglana': 'kasza', 'kasze': 'kasza', 'ziemniak': 'ziemniaki',
  'pomidory': 'warzywa', 'papryka': 'warzywa', 'kapusta': 'warzywa', 'kiszona kapusta': 'warzywa', 'pieczarki': 'warzywa', 'rzodkiewka': 'warzywa',
  'jabłka': 'owoce', 'ananas': 'owoce', 'rabarbar': 'owoce',
  'wegetariańska': 'wegetariańskie', 'wegańskie': 'wegetariańskie', 'bez mięsa': 'wegetariańskie',
  'bez glutenu': 'bezglutenowe', 'zdrowe': 'fit', 'keto': 'fit', 'wysokobiałkowe': 'fit', 'niskocukrowe': 'fit', 'lekkie': 'fit',
  'dla dziecka': 'dla dzieci', 'dzieci': 'dla dzieci',
  'szybkie danie': 'szybkie', 'na szybko': 'szybkie', 'pieczone': 'piekarnik', 'z piekarnika': 'piekarnik', 'szaszłyki': 'grill', 'z grilla': 'grill',
  'polskie': 'polska', 'kuchnia polska': 'polska', 'tradycyjne': 'polska', 'tradycyjny': 'polska',
  'włoskie': 'włoska', 'kuchnia włoska': 'włoska', 'azjatyckie': 'azjatycka', 'kuchnia azjatycka': 'azjatycka',
  'meksykańskie': 'meksykańska', 'kuchnia meksykańska': 'meksykańska', 'tortilla': 'meksykańska',
  'amerykańskie': 'amerykańska', 'fast food': 'amerykańska', 'burger': 'amerykańska',
  'hiszpańskie': 'hiszpańska', 'kuchnia hiszpańska': 'hiszpańska', 'francuskie': 'francuska', 'kuchnia francuska': 'francuska',
  'imprezowe': 'impreza', 'przyjęcia i imprezy': 'impreza', 'przyjęcie': 'impreza',
}

const KNOWN = new Set(ALL_TAGS)

// Jeden tag → tag z listy albo null (odrzucony)
export function canonicalTag(tag: unknown): string | null {
  const t = String(tag ?? '').trim().toLowerCase()
  if (KNOWN.has(t)) return t
  return SYNONYMS[t] ?? null
}

// Lista tagów → tylko tagi z listy, bez powtórzeń, w kolejności listy
export function cleanTags(tags: unknown[] = []): string[] {
  const set = new Set(tags.map(canonicalTag).filter((t): t is string => !!t))
  return ALL_TAGS.filter(t => set.has(t))
}
