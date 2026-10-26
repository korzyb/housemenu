import { supabase } from './supabase'
import { householdForAudience } from './profile'
import { invokeAi } from './ai'

// Przepisy + domownicy z bazy → 3 podpowiedzi AI (2× z bazy + 1× z sieci). Zwraca { suggestions, error }.
// Każda propozycja: { name, from_db, emoji, prep_time, recipeId, photo, url?, source? }
export async function loadSuggestions({ mealType, audience, plannedToday }) {
  const [{ data: recipesData }, { data: membersData }] = await Promise.all([
    supabase.from('recipes').select('id, name, tags, photo_url').order('name'),
    supabase.from('household_members').select('name, profile, ai_profile_card').eq('is_active', true),
  ])

  // Tylko domownicy z wygenerowaną kartą (z danej grupy) — do AI idzie krótkie streszczenie (planner_brief)
  const household = householdForAudience(membersData || [], audience)

  const { data, error } = await invokeAi('suggest-meal', {
    mealType, audience, recipes: (recipesData || []).map(r => ({ name: r.name, tags: r.tags })), plannedToday, household,
  })
  if (error) return { suggestions: [], error }

  // Propozycje z bazy dostają przepis (dopasowanie po nazwie) — id i zdjęcie; z sieci mają url i photo_url z serwera
  const byName = new Map((recipesData || []).map(r => [r.name.trim().toLowerCase(), r]))
  return {
    error: null,
    suggestions: (data?.suggestions ?? []).map(s => {
      const recipe = s.from_db ? byName.get(String(s.name).trim().toLowerCase()) : null
      return { ...s, recipeId: recipe?.id ?? null, photo: recipe?.photo_url ?? s.photo_url ?? null }
    }),
  }
}

// Propozycja → to, co dostaje onSelect / zapis do planu
export const pickedSuggestion = s => ({ name: s.name, recipeId: s.recipeId, url: s.url ?? null, photo_url: s.photo ?? null, source: s.source ?? null })
