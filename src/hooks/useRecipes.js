import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchRecipes = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.from('recipes').select('*').order('name')
    if (error) setError(error)
    else setRecipes(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])

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
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase.from('recipes').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) setError(error)
        else setRecipe(data)
        setLoading(false)
      })
  }, [id])

  async function updateRecipe(changes) {
    const { data, error } = await supabase.from('recipes').update(changes).eq('id', id).select().single()
    if (!error) setRecipe(data)
    return { data, error }
  }

  async function deleteRecipe() {
    return supabase.from('recipes').delete().eq('id', id)
  }

  return { recipe, loading, error, updateRecipe, deleteRecipe }
}
