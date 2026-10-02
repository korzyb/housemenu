// Dodawanie składników do listy zakupów — wspólne dla Zakupów, Dziś, Planu i Przepisu.
// Nowe składniki są ujednolicane (AI, zapas: słownik) i SUMOWANE z tym, co już jest na liście
// (nieodhaczone pozycje o tej samej nazwie). Odhaczone (kupione) nie są ruszane.

import { supabase } from './supabase'
import { invokeAi } from './ai'
import { CATEGORY_NAMES, aggregateIngredients, categoryOrder, guessCategory, nameKey } from './shopping'

// "825 g" | "3 łyżki + 50 ml" | "szczypta" → [{ amount, unit }]
function parseAmountText(text) {
  if (!text) return [{ amount: null, unit: null }]
  return String(text).split(' + ').map(part => {
    const m = part.trim().match(/^([\d.,½¼¾⅓⅔/-]+)\s*(.*)$/)
    return m ? { amount: m[1], unit: m[2] || null } : { amount: null, unit: part.trim() }
  })
}

// Ujednolicenie nazw + kategorie dla listy surowych składników [{ amount, unit, name }]
async function normalize(raw) {
  const uniqueNames = [...new Set(raw.map(i => i.name.trim()))]
  const { data, error } = await invokeAi('shopping-normalize', { names: uniqueNames, categories: CATEGORY_NAMES })
  const map = new Map((error ? [] : data.items).map(i => [i.input, i]))
  return {
    aiUsed: !error,
    items: raw.map(i => {
      const n = map.get(i.name.trim())
      const name = n?.name || i.name.trim()
      return { ...i, displayName: name, category: n?.category || guessCategory(name) }
    }),
  }
}

// Składniki z przepisów posiłków (meal_plans z recipe.ingredients)
export function ingredientsFromMeals(meals) {
  return meals
    .flatMap(m => m.recipe?.ingredients || [])
    .filter(i => i?.name?.trim())
}

// mode: 'append' — dopisz i zsumuj z listą; 'replace' — usuń poprzednie pozycje z planu ('auto') i wstaw od nowa
export async function addIngredientsToList(raw, { mode = 'append' } = {}) {
  const clean = raw.filter(i => i?.name?.trim())
  if (!clean.length) return { error: null, added: 0, updated: 0, aiUsed: false }

  const { items: normalized, aiUsed } = await normalize(clean)

  if (mode === 'replace') {
    const { error: delErr } = await supabase.from('shopping_list').delete().eq('source', 'auto')
    if (delErr) return { error: delErr }
  }

  const { data: current, error: curErr } = await supabase.from('shopping_list').select('*')
  if (curErr) return { error: curErr }

  // Nieodhaczone pozycje, z którymi możemy łączyć (po nazwie)
  const open = new Map(current.filter(i => !i.is_checked).map(i => [nameKey(i.name), i]))
  const newAgg = aggregateIngredients(normalized)

  const updates = []
  const inserts = []
  for (const item of newAgg) {
    const existing = open.get(nameKey(item.name))
    if (existing) {
      const [merged] = aggregateIngredients([
        ...parseAmountText(existing.amount).map(p => ({ ...p, name: existing.name, category: existing.category })),
        ...parseAmountText(item.amount).map(p => ({ ...p, name: existing.name })),
      ])
      updates.push({ id: existing.id, amount: merged.amount })
    } else {
      inserts.push(item)
    }
  }

  const maxOrder = current.reduce((m, i) => Math.max(m, i.sort_order ?? 0), 0)
  const rows = inserts
    .sort((a, b) => categoryOrder(a.category) - categoryOrder(b.category) || a.name.localeCompare(b.name, 'pl'))
    .map((item, i) => ({
      name: item.name,
      amount: item.amount,
      category: item.category,
      sort_order: maxOrder + 1 + i,
      source: 'auto',
    }))

  const results = await Promise.all([
    rows.length ? supabase.from('shopping_list').insert(rows) : { error: null },
    ...updates.map(u => supabase.from('shopping_list').update({ amount: u.amount }).eq('id', u.id)),
  ])
  const error = results.find(r => r.error)?.error ?? null

  return { error, added: rows.length, updated: updates.length, aiUsed }
}

// Krótki opis wyniku do toastu / komunikatu
export function addResultText({ added, updated }) {
  const n = added + updated
  if (!n) return 'Brak składników do dodania.'
  const prod = n === 1 ? 'produkt' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14)) ? 'produkty' : 'produktów'
  return updated
    ? `Dodano do zakupów: ${n} ${prod} (${updated} zsumowano z listą)`
    : `Dodano do zakupów: ${n} ${prod}`
}
