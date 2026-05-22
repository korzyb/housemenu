import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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

  async function addItem({ name, amount = null, category = 'Inne' }) {
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

  async function generateFromMealPlan(weekStart) {
    const start = weekStart instanceof Date
      ? weekStart.toISOString().split('T')[0]
      : weekStart
    const end = (() => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + 6)
      return d.toISOString().split('T')[0]
    })()

    const { data: mealPlans, error: plansError } = await supabase
      .from('meal_plans')
      .select('recipe:recipes(ingredients)')
      .gte('date', start)
      .lte('date', end)
      .not('recipe_id', 'is', null)

    if (plansError) return { error: plansError }

    const allIngredients = mealPlans.flatMap(mp => mp.recipe?.ingredients || [])

    if (allIngredients.length === 0) return { error: null }

    const { error: deleteError } = await supabase
      .from('shopping_list')
      .delete()
      .eq('source', 'auto')

    if (deleteError) return { error: deleteError }

    const rows = allIngredients.map((ing, i) => ({
      name: ing.name,
      amount: ing.amount ? `${ing.amount} ${ing.unit || ''}`.trim() : null,
      category: 'Inne',
      sort_order: i,
      source: 'auto',
    }))

    const { error } = await supabase.from('shopping_list').insert(rows)

    if (!error) fetchItems()
    return { error }
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
