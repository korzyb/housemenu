import { useState, useCallback } from 'react'
import { addIngredientsToList, addResultText, ingredientsFromMeals } from '../lib/shoppingActions'

// „🛒 Dodaj składniki do zakupów” z ekranów Dziś / Plan / Przepis.
// Zwraca funkcje dodawania + stan komunikatu do <Toast />.
export function useAddToShopping() {
  const [busy,  setBusy]  = useState(false)
  const [toast, setToast] = useState(null) // { message, warn }

  const clearToast = useCallback(() => setToast(null), [])

  async function addIngredients(raw, label) {
    if (!raw.some(i => i?.name?.trim())) {
      setToast({ message: `${label ? `${label}: ` : ''}brak składników w przepisie.`, warn: true })
      return
    }
    setBusy(true)
    const res = await addIngredientsToList(raw, { mode: 'append' })
    setBusy(false)
    if (res.error) {
      setToast({ message: 'Nie udało się dodać do zakupów. Spróbuj ponownie.', warn: true })
      return
    }
    setToast({ message: addResultText(res), warn: false })
  }

  // meals: wpisy meal_plans z recipe (z ingredients); posiłki bez przepisu są pomijane
  async function addMeals(meals, label) {
    const withRecipe = meals.filter(m => m.recipe)
    if (!withRecipe.length) {
      setToast({ message: 'Te posiłki nie mają przepisów ze składnikami — dodaj produkty ręcznie.', warn: true })
      return
    }
    await addIngredients(ingredientsFromMeals(withRecipe), label)
  }

  return { busy, toast, clearToast, addIngredients, addMeals }
}
