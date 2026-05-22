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

  async function removeMeal(id) {
    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id)

    if (!error) fetchMeals()
    return { error }
  }

  return { meals, loading, error, addMeal, removeMeal, refetch: fetchMeals }
}
