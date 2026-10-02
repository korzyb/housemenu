import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { invokeAi } from '../lib/ai'
import { CATEGORY_NAMES, aggregateIngredients, categoryOrder, guessCategory } from '../lib/shopping'

export function useShoppingList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('shopping_list')
      .select('*')
      .order('sort_order')
      .order('created_at')

    if (error) setError(error)
    else setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  async function addItem({ name, amount = null, category = guessCategory(name) }) {
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0

    const { data, error } = await supabase
      .from('shopping_list')
      .insert({ name, amount, category, sort_order: maxOrder, source: 'manual' })
      .select()
      .single()

    if (!error) fetchItems()
    return { data, error }
  }

  async function toggleItem(id) {
    const item = items.find(i => i.id === id)
    if (!item) return { error: new Error('Item not found') }

    const { error } = await supabase
      .from('shopping_list')
      .update({ is_checked: !item.is_checked })
      .eq('id', id)

    if (!error) fetchItems()
    return { error }
  }

  async function removeItem(id) {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id)

    if (!error) fetchItems()
    return { error }
  }

  async function clearChecked() {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('is_checked', true)

    if (!error) fetchItems()
    return { error }
  }

  // Generowanie z planu dla dat from…to (RRRR-MM-DD, włącznie).
  // Składniki z przepisów → ujednolicone nazwy + kategorie (AI, zapas: słownik) → sumowanie ilości.
  // Zastępuje poprzednie pozycje 'auto'; ręcznie dodane zostają.
  async function generateFromMealPlan({ from, to }) {
    const { data: mealPlans, error: plansError } = await supabase
      .from('meal_plans')
      .select('custom_name, recipe:recipes(name, ingredients)')
      .gte('date', from)
      .lte('date', to)

    if (plansError) return { error: plansError }

    const withRecipe = mealPlans.filter(mp => mp.recipe)
    const withoutRecipe = mealPlans.filter(mp => !mp.recipe && mp.custom_name)
    const raw = withRecipe.flatMap(mp => mp.recipe.ingredients || []).filter(i => i?.name?.trim())

    const stats = {
      meals: mealPlans.length,
      recipes: new Set(withRecipe.map(mp => mp.recipe.name)).size,
      withoutRecipe: withoutRecipe.map(mp => mp.custom_name),
      items: 0,
      aiUsed: false,
    }
    if (raw.length === 0) return { error: null, stats }

    // Ujednolicenie nazw i kategorie — jedno zapytanie AI; przy błędzie (np. limit) słownik lokalny
    const uniqueNames = [...new Set(raw.map(i => i.name.trim()))]
    const { data: norm, error: aiError } = await invokeAi('shopping-normalize', {
      names: uniqueNames,
      categories: CATEGORY_NAMES,
    })
    const normMap = new Map((aiError ? [] : norm.items).map(i => [i.input, i]))
    stats.aiUsed = !aiError

    const aggregated = aggregateIngredients(raw.map(i => {
      const n = normMap.get(i.name.trim())
      return { ...i, displayName: n?.name || i.name, category: n?.category || guessCategory(n?.name || i.name) }
    }))

    const { error: deleteError } = await supabase
      .from('shopping_list')
      .delete()
      .eq('source', 'auto')
    if (deleteError) return { error: deleteError, stats }

    const rows = aggregated
      .sort((a, b) => categoryOrder(a.category) - categoryOrder(b.category) || a.name.localeCompare(b.name, 'pl'))
      .map((item, i) => ({
        name: item.name,
        amount: item.amount,
        category: item.category,
        sort_order: i,
        source: 'auto',
      }))

    const { error } = await supabase.from('shopping_list').insert(rows)
    stats.items = rows.length

    if (!error) fetchItems()
    return { error, stats }
  }

  return {
    items,
    loading,
    error,
    addItem,
    toggleItem,
    removeItem,
    clearChecked,
    generateFromMealPlan,
    refetch: fetchItems,
  }
}
