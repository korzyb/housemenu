// Ustawienia wyglądu zapisywane na tym urządzeniu (localStorage) — nie dane, więc nie w Supabase;
// każdy domownik może mieć na swoim telefonie inaczej.

// Wielkość listy w trybie sklepowym
export const SHOP_SIZES = [
  { id: 'xs', label: 'Bardzo małe' },
  { id: 's',  label: 'Małe' },
  { id: 'm',  label: 'Średnie' },
]
const SHOP_SIZE_KEY = 'mealplanner.shopListSize'

export function getShopListSize() {
  try {
    const v = localStorage.getItem(SHOP_SIZE_KEY)
    return SHOP_SIZES.some(s => s.id === v) ? v : 'm'
  } catch {
    return 'm'
  }
}

export function setShopListSize(id) {
  try { localStorage.setItem(SHOP_SIZE_KEY, id) } catch { /* tryb prywatny — zostaje domyślne */ }
}
