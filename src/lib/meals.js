// Pory posiłków widoczne w aplikacji (Przekąska wycofana — stare wpisy 'snack' zostają w bazie, ale nie są pokazywane).
// splittable: posiłek, który może być osobny dla dzieci i dorosłych.
export const MEAL_TYPES = [
  { id: 'breakfast', label: 'Śniadanie', emoji: '🍳' },
  { id: 'lunch',     label: 'Obiad',     emoji: '🍝' },
  { id: 'dinner',    label: 'Kolacja',   emoji: '🥗', splittable: true },
]

export const MEAL_TYPE_IDS = MEAL_TYPES.map(t => t.id)

// Dla kogo jest posiłek (meal_plans.audience)
export const AUDIENCES = {
  all:    { id: 'all',    label: 'Wszyscy', emoji: '👨‍👩‍👧' },
  kids:   { id: 'kids',   label: 'Dzieci',  emoji: '🧸' },
  adults: { id: 'adults', label: 'Dorośli', emoji: '🧑‍🤝‍🧑' },
}

export const otherAudience = a => (a === 'kids' ? 'adults' : 'kids')

export const mealName = m => m?.recipe?.name || m?.custom_name || ''

// Stan slotu (data + pora) z wpisów planu.
// mode: 'empty' | 'shared' | 'kidsOnly' | 'adultsOnly' | 'split'
//   shared     — jeden wpis dla wszystkich
//   kidsOnly   — kolacja dzieci, dorośli „bez kolacji” (i odwrotnie adultsOnly)
//   split      — osobno dla dzieci i dorosłych (połówka może być jeszcze pusta)
// main — wpis pokazywany w trybach jednoczęściowych
export function slotState(rows = [], { forceSplit = false } = {}) {
  const all    = rows.find(r => r.audience === 'all' || !r.audience) ?? null
  const kids   = rows.find(r => r.audience === 'kids') ?? null
  const adults = rows.find(r => r.audience === 'adults') ?? null

  if (all) return { mode: 'shared', all, kids: null, adults: null, main: all }
  if (!kids && !adults) return { mode: forceSplit ? 'split' : 'empty', all: null, kids, adults, main: null }
  if (kids && !kids.skipped && adults?.skipped) return { mode: 'kidsOnly', all, kids, adults, main: kids }
  if (adults && !adults.skipped && kids?.skipped) return { mode: 'adultsOnly', all, kids, adults, main: adults }
  return { mode: 'split', all, kids, adults, main: null }
}

// Wpisy planu pogrupowane: { [date]: { [mealType]: [rows] } }
export function groupMeals(meals) {
  const map = {}
  for (const m of meals) {
    if (!MEAL_TYPE_IDS.includes(m.meal_type)) continue
    ;((map[m.date] ??= {})[m.meal_type] ??= []).push(m)
  }
  return map
}

// Wpisy, które ktoś faktycznie je (bez „bez kolacji” i bez wycofanych pór)
export const eatenMeals = meals => meals.filter(m => !m.skipped && MEAL_TYPE_IDS.includes(m.meal_type))
