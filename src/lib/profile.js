// Profil żywieniowy domownika — 5 filarów wg doc/profil_zywieniowy_kontekst.md
// Jedno źródło prawdy dla: kreatora dodawania, karty AI i promptów generowania menu.
//
// Zasady z dokumentu:
// - każde pole z listą opcji = wielokrotny wybór (type: 'multi'), przechowywane jako tablica
// - każdy filar ma pole otwarte `notes` (type: 'text') o wadze równej wyborom z listy
// - pola oznaczone core:true zbiera krok 0 kreatora (tożsamość domownika)

export const MEMBER_EMOJIS = ['👩', '👨', '🧒', '👧', '👦', '🧑', '👶', '👵', '👴', '🧓']

export const GENDERS = [
  { id: 'female', label: 'Kobieta' },
  { id: 'male',   label: 'Mężczyzna' },
  { id: 'other',  label: 'Inne' },
]

export const LIFE_PHASES = [
  { id: 'toddler',           label: 'Małe dziecko (do 6 lat)' },
  { id: 'school_child',      label: 'Dziecko szkolne (7–12)' },
  { id: 'teen',              label: 'Nastolatek (13–18)' },
  { id: 'adult_active',      label: 'Dorosły aktywny' },
  { id: 'adult_sedentary',   label: 'Dorosły siedzący' },
  { id: 'woman_fertile',     label: 'Kobieta w wieku rozrodczym' },
  { id: 'pregnant_nursing',  label: 'Kobieta w ciąży / karmiąca' },
  { id: 'senior',            label: 'Senior (65+)' },
]

// Klucze filarów w obiekcie profile
export const PILLAR_KEYS = ['base', 'red_flags', 'daily_rhythm', 'taste_profile', 'kitchen_resources']

// Pełna definicja 5 filarów. field.type: 'multi' | 'single' | 'text'
export const PROFILE_PILLARS = [
  {
    key: 'base',
    title: 'Baza i energetyka',
    subtitle: 'Kim jest ta osoba?',
    fields: [
      {
        id: 'life_phase', label: 'Rola w domu / faza życia', type: 'multi', core: true,
        options: LIFE_PHASES,
      },
      {
        id: 'gender', label: 'Płeć', type: 'single', core: true,
        options: GENDERS,
      },
      {
        id: 'activity_level', label: 'Poziom aktywności fizycznej', type: 'multi',
        options: [
          { id: 'sedentary',   label: 'Siedzący (< 5000 kroków/dzień)' },
          { id: 'moderate',    label: 'Umiarkowany (spacery, rower)' },
          { id: 'active',      label: 'Aktywny (treningi 3x/tydzień)' },
          { id: 'very_active', label: 'Bardzo aktywny (codziennie / praca fizyczna)' },
        ],
      },
      {
        id: 'needs_assistance', label: 'Czy je samodzielnie?', type: 'single',
        options: [
          { id: 'self',       label: 'Tak, samodzielnie' },
          { id: 'needs_help', label: 'Potrzebuje pomocy' },
        ],
      },
      {
        id: 'notes', type: 'text',
        label: 'Coś jeszcze o tej osobie, jej stylu życia lub energetyce dnia?',
        placeholder: 'np. Pracuje na nocne zmiany co drugi tydzień',
      },
    ],
  },
  {
    key: 'red_flags',
    title: 'Czerwone flagi',
    subtitle: 'Czego NIE można? (twarde ograniczenia — weto)',
    fields: [
      {
        id: 'allergies', label: 'Alergie pokarmowe (zdiagnozowane)', type: 'multi',
        options: [
          { id: 'none',         label: 'Brak' },
          { id: 'gluten',       label: 'Gluten / celiakia' },
          { id: 'lactose',      label: 'Laktoza / białko mleka' },
          { id: 'eggs',         label: 'Jaja' },
          { id: 'nuts',         label: 'Orzechy' },
          { id: 'soy',          label: 'Soja' },
          { id: 'fish_seafood', label: 'Ryby / owoce morza' },
        ],
      },
      {
        id: 'intolerances', label: 'Nietolerancje i dolegliwości po jedzeniu', type: 'multi',
        options: [
          { id: 'none',                label: 'Brak' },
          { id: 'legumes_bloating',    label: 'Wzdęcia po strączkowych' },
          { id: 'heartburn_fried',     label: 'Zgaga po smażonym / tłustym' },
          { id: 'raw_veg_discomfort',  label: 'Dyskomfort po surowych warzywach' },
          { id: 'glutamate_headache',  label: 'Bóle głowy po glutaminianie' },
        ],
      },
      {
        id: 'ethical_exclusions', label: 'Wykluczenia etyczne / światopoglądowe', type: 'multi',
        options: [
          { id: 'none',         label: 'Brak' },
          { id: 'vegetarian',   label: 'Wegetarianizm' },
          { id: 'vegan',        label: 'Weganizm' },
          { id: 'pescatarian',  label: 'Pescatarianizm' },
          { id: 'no_pork',      label: 'Bez wieprzowiny' },
          { id: 'no_beef',      label: 'Bez wołowiny' },
        ],
      },
      {
        id: 'medications', label: 'Leki przyjmowane na stałe', type: 'multi',
        options: [
          { id: 'none',      label: 'Brak' },
          { id: 'metformin', label: 'Metformina (↓ B12)' },
          { id: 'statins',   label: 'Statyny (↓ CoQ10)' },
          { id: 'thyroid',   label: 'Leki na tarczycę' },
          { id: 'ppi',       label: 'Inhibitory pompy protonowej (↓ B12, magnez)' },
        ],
      },
      {
        id: 'eating_history', label: 'Historia problemów z jedzeniem', type: 'multi',
        options: [
          { id: 'none',                 label: 'Brak' },
          { id: 'sensory_selectivity',  label: 'Selektywność sensoryczna' },
          { id: 'orthorexia_history',   label: 'Ortoreksja / lęk przed jedzeniem w wywiadzie' },
        ],
      },
      {
        id: 'notes', type: 'text',
        label: 'Inne ograniczenia, reakcje lub szczegóły zdrowotne?',
        placeholder: 'np. Pediatra zalecił ograniczenie soli',
      },
    ],
  },
  {
    key: 'daily_rhythm',
    title: 'Rytm dnia i logistyka',
    subtitle: 'Kiedy i gdzie je?',
    fields: [
      {
        id: 'main_meal_location', label: 'Gdzie je główny posiłek w dzień roboczy?', type: 'multi',
        options: [
          { id: 'home',         label: 'W domu' },
          { id: 'school',       label: 'W szkole / przedszkolu' },
          { id: 'work_out',     label: 'W pracy na mieście' },
          { id: 'lunchbox',     label: 'Zabiera lunchbox z domu' },
          { id: 'after_return', label: 'Dopiero po powrocie do domu' },
        ],
      },
      {
        id: 'hunger_peak', label: 'Kiedy dopada go największy głód?', type: 'multi',
        options: [
          { id: 'morning',          label: 'Rano (solidne śniadanie)' },
          { id: 'noon',             label: 'W południe (klasyczny obiad)' },
          { id: 'afternoon_return', label: 'Popołudniu po powrocie (15–17)' },
          { id: 'evening',          label: 'Wieczorem (podjada przy ekranie)' },
        ],
      },
      {
        id: 'sleep_regularity', label: 'Rytm snu', type: 'multi',
        options: [
          { id: 'regular',   label: 'Regularny' },
          { id: 'irregular', label: 'Nieregularny / zmianowy' },
        ],
      },
      {
        id: 'weekly_schedule', label: 'Harmonogram tygodnia', type: 'multi',
        options: [
          { id: 'regular',   label: 'Regularny' },
          { id: 'irregular', label: 'Nieregularny' },
          { id: 'intensive', label: 'Intensywny (treningi / zajęcia)' },
        ],
      },
      {
        id: 'prep_time_available', label: 'Ile czasu kucharz ma na posiłek dla tej osoby?', type: 'multi',
        options: [
          { id: 'express',      label: 'Ekspres: do 20 min' },
          { id: 'standard',     label: 'Standard: 30–40 min' },
          { id: 'weekend_prep', label: 'Weekendowe pichcenie / meal prep' },
        ],
      },
      {
        id: 'notes', type: 'text',
        label: 'Coś szczególnego w rytmie dnia lub logistyce posiłków?',
        placeholder: 'np. Trening o 6 rano — śniadanie musi być gotowe wcześniej',
      },
    ],
  },
  {
    key: 'taste_profile',
    title: 'Profil marudy',
    subtitle: 'Smaki i zachowania przy stole',
    fields: [
      {
        id: 'hated_textures', label: 'Znienawidzone tekstury / smaki / produkty', type: 'multi',
        options: [
          { id: 'none',           label: 'Brak' },
          { id: 'overcooked_veg', label: 'Rozgotowane warzywa' },
          { id: 'visible_onion',  label: 'Widoczna cebula / por' },
          { id: 'dry_meat',       label: 'Suche mięso' },
          { id: 'bitter',         label: 'Gorzkie smaki (rukola, brukselka)' },
          { id: 'slimy',          label: 'Śliskie składniki (grzyby, bakłażan)' },
        ],
      },
      {
        id: 'safe_dishes', label: 'Absolutne „pewniaki" — zawsze zjedzone', type: 'multi',
        options: [
          { id: 'none',         label: 'Brak' },
          { id: 'pasta_tomato', label: 'Makaron z sosem pomidorowym' },
          { id: 'pancakes',     label: 'Naleśniki / placki' },
          { id: 'pizza',        label: 'Pizza' },
          { id: 'soup',         label: 'Zupa (kremowa / pomidorowa / rosół)' },
          { id: 'crunchy',      label: 'Chrupiące (grzanki, panierowane)' },
        ],
      },
      {
        id: 'novelty_attitude', label: 'Stosunek do nowości kulinarnych', type: 'multi',
        options: [
          { id: 'explorer',          label: 'Odkrywca (lubi próbować)' },
          { id: 'conservative',      label: 'Konserwatywny (woli znane)' },
          { id: 'hard_conservative', label: 'Twardy konserwatysta (nowe = bunt)' },
        ],
      },
      {
        id: 'leftover_attitude', label: 'Stosunek do odgrzewania / wczorajszych dań', type: 'multi',
        options: [
          { id: 'eats_fine',  label: 'Zje bez problemu (idealne do meal prep)' },
          { id: 'selective',  label: 'Zje tylko niektóre (zupy tak, makaron nie)' },
          { id: 'fresh_only', label: '„Drugi raz tego samego nie tknę"' },
        ],
      },
      {
        id: 'preferred_temp', label: 'Preferowana temperatura posiłku', type: 'multi',
        options: [
          { id: 'hot',      label: 'Gorące (nie tknie zimnych dań)' },
          { id: 'lukewarm', label: 'Letnie / obojętne' },
          { id: 'cold_ok',  label: 'Akceptuje zimne (sałatki, kanapki)' },
        ],
      },
      {
        id: 'eating_habit', label: 'Nawyk jedzenia', type: 'multi',
        options: [
          { id: 'at_table',  label: 'W skupieniu przy stole' },
          { id: 'at_screen', label: 'Przy ekranie / w biegu' },
        ],
      },
      {
        id: 'notes', type: 'text',
        label: 'Inne smaki, rytuały przy stole lub dziwactwa kulinarne?',
        placeholder: 'np. Jedzenie nie może się mieszać na talerzu',
      },
    ],
  },
  {
    key: 'kitchen_resources',
    title: 'Zasoby kuchni',
    subtitle: 'Kontekst gotowania',
    fields: [
      {
        id: 'equipment', label: 'Dostępny sprzęt kuchenny', type: 'multi',
        options: [
          { id: 'blender',     label: 'Blender (ukrywanie warzyw i strączków)' },
          { id: 'multicooker', label: 'Multicooker / Instant Pot' },
          { id: 'airfryer',    label: 'Airfryer' },
          { id: 'freezer',     label: 'Zamrażarka z miejscem (meal prep)' },
          { id: 'basics',      label: 'Tylko podstawy (garnek, patelnia, piekarnik)' },
        ],
      },
      {
        id: 'weekly_budget', label: 'Tygodniowy budżet na jedzenie dla tej osoby', type: 'multi',
        options: [
          { id: 'economic',   label: 'Ekonomiczny (do 50 zł/tydzień)' },
          { id: 'medium',     label: 'Średni (50–100 zł/tydzień)' },
          { id: 'comfortable',label: 'Komfortowy (powyżej 100 zł/tydzień)' },
        ],
      },
      {
        id: 'shop_access', label: 'Dostęp do sklepów', type: 'multi',
        options: [
          { id: 'discounts',             label: 'Tylko dyskonty (Lidl, Biedronka, Aldi)' },
          { id: 'discounts_supermarket', label: 'Dyskonty + supermarket' },
          { id: 'market',                label: 'Targowisko / warzywniak' },
          { id: 'organic',               label: 'Sklep ekologiczny / bio w pobliżu' },
        ],
      },
      {
        id: 'notes', type: 'text',
        label: 'Inne zasoby, ograniczenia sprzętowe lub nawyki zakupowe?',
        placeholder: 'np. Mamy ogródek, latem dużo własnych warzyw',
      },
    ],
  },
]

// Pola tożsamości zbierane w kroku 0 kreatora (poza filarami trzymanymi w profile.base)
export const CORE_PROFILE_FIELDS = PROFILE_PILLARS
  .find(p => p.key === 'base')
  .fields.filter(f => f.core)

// Pusty profil — 'multi' → [], 'single'/'text' → ''
export function emptyProfile() {
  const profile = {}
  for (const pillar of PROFILE_PILLARS) {
    profile[pillar.key] = {}
    for (const field of pillar.fields) {
      profile[pillar.key][field.id] = field.type === 'multi' ? [] : ''
    }
  }
  return profile
}

// Scala zapisany profil na pełną strukturę (uzupełnia brakujące pola domyślnymi)
export function mergeProfile(saved = {}) {
  const base = emptyProfile()
  for (const key of Object.keys(base)) {
    base[key] = { ...base[key], ...(saved[key] || {}) }
  }
  return base
}

// Procent uzupełnienia profilu — do pokazania na karcie domownika.
// Pola tekstowe (notes) są opcjonalne i NIE liczą się do procentu.
export function profileCompleteness(profile = {}) {
  let total = 0
  let filled = 0
  for (const pillar of PROFILE_PILLARS) {
    const section = profile[pillar.key] || {}
    for (const field of pillar.fields) {
      if (field.type === 'text') continue
      total++
      const value = section[field.id]
      if (field.type === 'multi') {
        if (Array.isArray(value) && value.length > 0) filled++
      } else if (value && String(value).trim()) {
        filled++
      }
    }
  }
  return total ? Math.round((filled / total) * 100) : 0
}

// Profil jako czytelny tekst do promptu AI — etykiety zamiast identyfikatorów.
// Pola `notes` idą jako pełnoprawna część filaru (waga równa wyborom z listy).
export function profileToPromptText(member) {
  const profile = mergeProfile(member.profile)
  const lines = [`Imię / rola: ${member.name}`]

  for (const pillar of PROFILE_PILLARS) {
    const section = profile[pillar.key]
    const pillarLines = []
    for (const field of pillar.fields) {
      const value = section[field.id]
      if (field.type === 'text') {
        if (value?.trim()) {
          pillarLines.push(`- Informacje od rodziny (traktuj z taką samą wagą jak odpowiedzi powyżej): ${value.trim()}`)
        }
        continue
      }
      const ids = field.type === 'multi' ? (value || []) : (value ? [value] : [])
      if (!ids.length) continue
      const labels = ids.map(id => field.options.find(o => o.id === id)?.label ?? id)
      pillarLines.push(`- ${field.label}: ${labels.join(', ')}`)
    }
    if (pillarLines.length) {
      lines.push('', `## ${pillar.title} — ${pillar.subtitle}`, ...pillarLines)
    }
  }
  return lines.join('\n')
}

// Karta profilu z AI jest trzymana w ai_profile_card jako tekst JSON.
// Zwraca obiekt karty albo null (brak / stary format → do ponownego wygenerowania).
export function parseProfileCard(raw) {
  if (!raw) return null
  try {
    const card = JSON.parse(raw)
    return card && typeof card === 'object' && card.goal ? card : null
  } catch {
    return null
  }
}

// Odmiana: 1 domownik, 2–4 domownicy, 5+ domowników (12–14 → domowników)
export function membersLabel(n) {
  if (n === 1) return '1 domownik'
  const lastDigit = n % 10
  const lastTwo = n % 100
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return `${n} domownicy`
  return `${n} domowników`
}
