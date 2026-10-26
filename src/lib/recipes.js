// Przepis Thermomix: gotowaniem steruje urządzenie (Cookidoo), w aplikacji trzymamy nazwę, zdjęcie, składniki i porcje.
// Rozpoznanie po tagu „thermomix” albo źródle z Cookidoo.
export const THERMOMIX_TAG = 'thermomix'

export function isThermomix(recipe) {
  if (!recipe) return false
  return (recipe.tags || []).some(t => String(t).toLowerCase() === THERMOMIX_TAG) ||
    /(^|\.)cookidoo\./i.test(safeHost(recipe.source_url))
}

// Zdjęcia przepisów trzymamy we własnym magazynie (Storage) — linki do cudzych stron potrafią zniknąć
const PHOTO_PREFIX = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/recipe-photos/`
export const isStoredPhoto = url => !!url && url.startsWith(PHOTO_PREFIX)

// Kopia zdjęcia przepisu do magazynu (Edge Function store-photo). Błąd nie blokuje zapisu przepisu —
// zostaje wtedy zewnętrzny link.
export async function storeRecipePhoto(supabase, recipeId) {
  const { data, error } = await supabase.functions.invoke('store-photo', { body: { recipeId } })
  return error ? null : data?.photo_url ?? null
}

function safeHost(url) {
  try { return url ? new URL(url).hostname : '' } catch { return '' }
}
