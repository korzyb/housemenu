import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const loadRecipes = () => supabase.from('recipes').select('*').order('name')

export function useRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Stan zmieniany dopiero po odpowiedzi z bazy (ponowne pobranie nie miga szkieletem ładowania)
  const apply = useCallback(({ data, error }) => {
    setError(error ?? null)
    if (!error) setRecipes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    let stale = false
    loadRecipes().then(r => { if (!stale) apply(r) })
    return () => { stale = true }
  }, [apply])

  const fetchRecipes = useCallback(async () => apply(await loadRecipes()), [apply])

  async function addRecipe(recipe) {
    const { data, error } = await supabase.from('recipes').insert(recipe).select().single()
    if (!error) fetchRecipes()
    return { data, error }
  }

  async function updateRecipe(id, changes) {
    const { data, error } = await supabase.from('recipes').update(changes).eq('id', id).select().single()
    if (!error) fetchRecipes()
    return { data, error }
  }

  async function deleteRecipe(id) {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (!error) fetchRecipes()
    return { error }
  }

  return { recipes, loading, error, addRecipe, updateRecipe, deleteRecipe, refetch: fetchRecipes }
}

export function useRecipe(id) {
  // Wynik z bazy razem z id, którego dotyczy — „ładuję”, dopóki nie przyszedł wynik dla bieżącego id
  const [result, setResult] = useState({ id: null, recipe: null, error: null })

  useEffect(() => {
    if (!id) return
    let stale = false
    supabase.from('recipes').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (!stale) setResult({ id, recipe: error ? null : data, error: error ?? null })
      })
    return () => { stale = true }
  }, [id])

  const current = result.id === id
  const recipe = current ? result.recipe : null
  const loading = !!id && !current

  async function updateRecipe(changes) {
    const { data, error } = await supabase.from('recipes').update(changes).eq('id', id).select().single()
    if (!error) setResult({ id, recipe: data, error: null })
    return { data, error }
  }

  async function deleteRecipe() {
    return supabase.from('recipes').delete().eq('id', id)
  }

  return { recipe, loading, error: current ? result.error : null, updateRecipe, deleteRecipe }
}
