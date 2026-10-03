// Przepis Thermomix: gotowaniem steruje urządzenie (Cookidoo), w aplikacji trzymamy nazwę, zdjęcie, składniki i porcje.
// Rozpoznanie po tagu „thermomix” albo źródle z Cookidoo.
export const THERMOMIX_TAG = 'thermomix'

export function isThermomix(recipe) {
  if (!recipe) return false
  return (recipe.tags || []).some(t => String(t).toLowerCase() === THERMOMIX_TAG) ||
    /(^|\.)cookidoo\./i.test(safeHost(recipe.source_url))
}

function safeHost(url) {
  try { return url ? new URL(url).hostname : '' } catch { return '' }
}
