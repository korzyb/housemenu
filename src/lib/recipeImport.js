// Import przepisu z linku prosto do bazy (bez formularza) — np. propozycja „z sieci” wybrana w planie.
// Edge Function import-recipe (AI porządkuje składniki i kroki) → zapis w recipes → kopia zdjęcia w magazynie.
import { supabase } from './supabase'
import { invokeAi } from './ai'
import { storeRecipePhoto } from './recipes'

const MEAL_TAGS = { breakfast: 'śniadanie', lunch: 'obiad', dinner: 'kolacja' }

// fallback: { name, photo_url } z propozycji — gdy strona czegoś nie poda
// mealType: pora, na którą wybrano danie → tag pory (planowanie AI korzysta z tagów pór)
// Zwraca { recipe } albo { error } (komunikat po polsku)
export async function importRecipeFromUrl(url, { fallback = {}, mealType } = {}) {
  const { data, error } = await invokeAi('import-recipe', { url })
  if (error) return { error }
  if (data?.error) return { error: data.error }

  const mealTag = MEAL_TAGS[mealType]
  const tags = [...new Set([...(mealTag ? [mealTag] : []), ...(data.tags ?? []).map(t => String(t).toLowerCase())])].slice(0, 8)

  const payload = {
    name:        (data.name || fallback.name || 'Przepis').trim(),
    description: data.description ?? null,
    photo_url:   data.photo_url ?? fallback.photo_url ?? null,
    prep_time:   data.prep_time ? parseInt(data.prep_time) : null,
    servings:    data.servings ?? 4,
    difficulty:  data.difficulty ?? 'easy',
    temperature: data.temperature ?? 'hot',
    tags,
    notes:       data.notes ?? null,
    source_type: 'url',
    source_url:  url,
    ingredients: (data.ingredients ?? []).map(i => ({ amount: i.amount ?? '', unit: i.unit ?? '', name: i.name ?? '' })),
    steps:       (data.steps ?? []).map((s, i) => ({ order: i + 1, text: s.text ?? '' })),
  }

  const { data: recipe, error: saveErr } = await supabase.from('recipes').insert(payload).select().single()
  if (saveErr) return { error: 'Nie udało się zapisać przepisu. Spróbuj ponownie.' }

  // Zdjęcie do własnego magazynu (nieudana kopia nie blokuje — zostaje link)
  if (recipe.photo_url) await storeRecipePhoto(supabase, recipe.id)
  return { recipe }
}
