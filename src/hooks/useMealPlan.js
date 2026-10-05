import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toDateString } from '../lib/dates'

// recipes.last_planned_at — tylko przesunięcie do przodu (planowanie wstecz nie cofa daty)
function markPlanned(recipeId, dateStr) {
  return supabase
    .from('recipes')
    .update({ last_planned_at: dateStr })
    .eq('id', recipeId)
    .or(`last_planned_at.is.null,last_planned_at.lt.${dateStr}`)
}

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

  // Slot ma albo wpis wspólny ('all'), albo osobne 'kids'/'adults' — usuń wpisy sprzeczne z zapisanym
  function clearConflicts(dateStr, mealType, audience) {
    const q = supabase.from('meal_plans').delete().eq('date', dateStr).eq('meal_type', mealType)
    return audience === 'all' ? q.in('audience', ['kids', 'adults']) : q.eq('audience', 'all')
  }

  // audience: 'all' | 'kids' | 'adults'; skipped: ta grupa nie je („bez kolacji”)
  async function addMeal({ date, mealType, audience = 'all', recipeId = null, customName = null, skipped = false }) {
    const dateStr = toDateString(date)
    const { data, error } = await supabase
      .from('meal_plans')
      .upsert(
        {
          date: dateStr, meal_type: mealType, audience, skipped,
          recipe_id: skipped ? null : recipeId, custom_name: skipped ? null : customName,
        },
        { onConflict: 'date,meal_type,audience' }
      )
      .select('*, recipe:recipes(*)')
      .single()

    if (!error) {
      await clearConflicts(dateStr, mealType, audience)
      if (recipeId && !skipped) await markPlanned(recipeId, dateStr)
      fetchMeals()
    }
    return { data, error }
  }

  // Wspólny posiłek → osobno: dotychczasowe danie dostają obie grupy (potem zmieniasz jedną)
  async function splitMeal(date, mealType) {
    const dateStr = toDateString(date)
    const shared = meals.find(m => m.date === dateStr && m.meal_type === mealType && m.audience === 'all')
    if (!shared) return { error: null }
    const base = { date: dateStr, meal_type: mealType, recipe_id: shared.recipe_id, custom_name: shared.custom_name, skipped: false }
    const { error } = await supabase
      .from('meal_plans')
      .upsert([{ ...base, audience: 'kids' }, { ...base, audience: 'adults' }], { onConflict: 'date,meal_type,audience' })
    if (!error) await clearConflicts(dateStr, mealType, 'kids')
    fetchMeals()
    return { error }
  }

  // Osobno → wspólny posiłek z daniem wybranej grupy
  async function mergeMeal(date, mealType, fromAudience) {
    const dateStr = toDateString(date)
    const src = meals.find(m => m.date === dateStr && m.meal_type === mealType && m.audience === fromAudience)
    if (!src) return { error: null }
    return addMeal({ date: dateStr, mealType, audience: 'all', recipeId: src.recipe_id, customName: src.custom_name })
  }

  // Zapis wielu pór naraz (kreator AI). rows: [{ date, mealType, audience?, recipeId?, customName?, skipped? }]
  async function addMeals(rows) {
    const { error } = await supabase
      .from('meal_plans')
      .upsert(
        rows.map(r => ({
          date: toDateString(r.date),
          meal_type: r.mealType,
          audience: r.audience ?? 'all',
          skipped: !!r.skipped,
          recipe_id: r.skipped ? null : r.recipeId ?? null,
          custom_name: r.skipped ? null : r.customName ?? null,
        })),
        { onConflict: 'date,meal_type,audience' }
      )
    if (error) return { error }

    const slots = new Map(rows.map(r => [`${toDateString(r.date)}|${r.mealType}|${r.audience ?? 'all'}`, r]))
    await Promise.all([...slots.values()].map(r => clearConflicts(toDateString(r.date), r.mealType, r.audience ?? 'all')))

    // Data ostatniego zaplanowania na przepisach (najpóźniejsza data dla każdego przepisu)
    const lastByRecipe = {}
    for (const r of rows) {
      if (!r.recipeId || r.skipped) continue
      const d = toDateString(r.date)
      if (!lastByRecipe[r.recipeId] || d > lastByRecipe[r.recipeId]) lastByRecipe[r.recipeId] = d
    }
    await Promise.all(Object.entries(lastByRecipe).map(([id, d]) => markPlanned(id, d)))

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

  return { meals, loading, error, addMeal, addMeals, splitMeal, mergeMeal, removeMeal, refetch: fetchMeals }
}
