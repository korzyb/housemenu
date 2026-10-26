import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { MEAL_TYPE_IDS } from '../lib/meals'
import { guessCategory } from '../lib/shopping'
import { addIngredientsToList, ingredientsFromMeals } from '../lib/shoppingActions'

export function useShoppingList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // silent: odświeżenie po zmianie — bez szkieletu ładowania, żeby lista nie znikała i nie skakała na górę
  const fetchItems = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
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

    if (!error) fetchItems({ silent: true })
    return { data, error }
  }

  // Zmiany od razu na ekranie (bez czekania na bazę); przy błędzie — odświeżenie z bazy
  async function toggleItem(id) {
    const item = items.find(i => i.id === id)
    if (!item) return { error: new Error('Item not found') }

    setItems(prev => prev.map(i => (i.id === id ? { ...i, is_checked: !i.is_checked } : i)))
    const { error } = await supabase
      .from('shopping_list')
      .update({ is_checked: !item.is_checked })
      .eq('id', id)

    fetchItems({ silent: true })
    return { error }
  }

  async function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('id', id)

    fetchItems({ silent: true })
    return { error }
  }

  // Usuwa CAŁĄ listę (ręczne i z planu, kupione i niekupione)
  async function clearAll() {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .not('id', 'is', null)   // PostgREST wymaga filtra przy DELETE

    if (!error) fetchItems()
    return { error }
  }

  async function clearChecked() {
    const { error } = await supabase
      .from('shopping_list')
      .delete()
      .eq('is_checked', true)

    if (!error) fetchItems({ silent: true })
    return { error }
  }

  // Generowanie z planu dla dat from…to (RRRR-MM-DD, włącznie).
  // mode 'replace' — poprzednie pozycje z planu ('auto') usuwane, ręczne zostają;
  // mode 'append'  — dopisanie i zsumowanie z obecną listą (src/lib/shoppingActions.js).
  async function generateFromMealPlan({ from, to, mode = 'replace' }) {
    const { data: mealPlans, error: plansError } = await supabase
      .from('meal_plans')
      .select('custom_name, recipe:recipes(name, ingredients)')
      .gte('date', from)
      .lte('date', to)
      .eq('skipped', false)             // „bez kolacji” — nic do kupienia
      .in('meal_type', MEAL_TYPE_IDS)   // bez wycofanej przekąski

    if (plansError) return { error: plansError }

    const withRecipe = mealPlans.filter(mp => mp.recipe)
    const withoutRecipe = mealPlans.filter(mp => !mp.recipe && mp.custom_name)
    const raw = ingredientsFromMeals(withRecipe)

    const stats = {
      meals: mealPlans.length,
      recipes: new Set(withRecipe.map(mp => mp.recipe.name)).size,
      withoutRecipe: withoutRecipe.map(mp => mp.custom_name),
      items: 0,
      updated: 0,
      aiUsed: false,
    }
    if (raw.length === 0) return { error: null, stats }

    const res = await addIngredientsToList(raw, { mode })
    stats.items = res.added + (res.updated ?? 0)
    stats.updated = res.updated ?? 0
    stats.aiUsed = res.aiUsed

    fetchItems({ silent: true })
    return { error: res.error, stats }
  }

  // Lista ma pozycje z planu, których jeszcze nie kupiono? (pytanie: zastąpić czy dopisać)
  const hasOpenAutoItems = items.some(i => i.source === 'auto' && !i.is_checked)

  return {
    items,
    loading,
    error,
    addItem,
    toggleItem,
    removeItem,
    clearChecked,
    clearAll,
    generateFromMealPlan,
    hasOpenAutoItems,
    refetch: fetchItems,
  }
}
