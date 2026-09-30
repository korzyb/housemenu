import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toDateString } from '../lib/dates'

export function useMealPlan(weekStart) {
  const weekStartStr = toDateString(weekStart)

  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchMeals = useCallback(async () => {
    if (!weekStartStr) return
    setLoading(true)
    setError(null)

    const endDate = new Date(weekStartStr)
    endDate.setDate(endDate.getDate() + 6)
    const end = toDateString(endDate)

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*, recipe:recipes(*)')
      .gte('date', weekStartStr)
      .lte('date', end)
      .order('date')

    if (error) setError(error)
    else setMeals(data || [])
    setLoading(false)
  }, [weekStartStr])

  useEffect(() => {
    fetchMeals()
  }, [fetchMeals])

  async function addMeal({ date, mealType, recipeId = null, customName = null }) {
    const { data, error } = await supabase
      .from('meal_plans')
      .upsert(
        { date: toDateString(date), meal_type: mealType, recipe_id: recipeId, custom_name: customName },
        { onConflict: 'date,meal_type' }
      )
      .select('*, recipe:recipes(*)')
      .single()

    if (!error) fetchMeals()
    return { data, error }
  }

  // Zapis wielu pór naraz (kreator AI). rows: [{ date, mealType, recipeId?, customName? }]
  async function addMeals(rows) {
    const { error } = await supabase
      .from('meal_plans')
      .upsert(
        rows.map(r => ({
          date: toDateString(r.date),
          meal_type: r.mealType,
          recipe_id: r.recipeId ?? null,
          custom_name: r.customName ?? null,
        })),
        { onConflict: 'date,meal_type' }
      )
    if (error) return { error }

    // Data ostatniego zaplanowania na przepisach (najpóźniejsza data dla każdego przepisu)
    const lastByRecipe = {}
    for (const r of rows) {
      if (!r.recipeId) continue
      const d = toDateString(r.date)
      if (!lastByRecipe[r.recipeId] || d > lastByRecipe[r.recipeId]) lastByRecipe[r.recipeId] = d
    }
    await Promise.all(Object.entries(lastByRecipe).map(([id, d]) =>
      supabase.from('recipes').update({ last_planned_at: d }).eq('id', id)
    ))

    fetchMeals()
    return { error: null }
  }

  async function removeMeal(id) {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id)

    if (!error) fetchMeals()
    return { error }
  }

  return { meals, loading, error, addMeal, addMeals, removeMeal, refetch: fetchMeals }
}
