import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { householdForAudience } from '../../lib/profile'
import { invokeAi } from '../../lib/ai'
import BottomSheet from '../BottomSheet/BottomSheet'
import styles from './AISuggestSheet.module.css'

// Przepisy + domownicy z bazy → podpowiedzi AI. Zwraca { suggestions, error }.
async function loadSuggestions({ mealType, audience, plannedToday }) {
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

// audience: 'all' | 'kids' | 'adults' — kolacja dla dzieci bierze tylko profile dzieci (i odwrotnie)
// Renderuj warunkowo ({open && <AISuggestSheet isOpen …/>}) — podpowiedzi pobierają się przy pojawieniu się okna.
export default function AISuggestSheet({ isOpen, onClose, mealType, mealTypeLabel, audience = 'all', plannedToday = [], onSelect }) {
  const [result,  setResult]  = useState({ suggestions: [], error: null })
  const [loading, setLoading] = useState(true)
  const { suggestions, error } = result
  // Lista dań jako tekst — stabilna zależność (tablica z propsów jest nowa przy każdym renderze)
  const plannedKey = plannedToday.join('\n')

  useEffect(() => {
    let stale = false
    loadSuggestions({ mealType, audience, plannedToday: plannedKey ? plannedKey.split('\n') : [] })
      .then(r => { if (!stale) { setResult(r); setLoading(false) } })
    return () => { stale = true }
  }, [mealType, audience, plannedKey])

  function retry() {
    setLoading(true)
    setResult({ suggestions: [], error: null })
    loadSuggestions({ mealType, audience, plannedToday }).then(r => { setResult(r); setLoading(false) })
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`✨ Sugestie — ${mealTypeLabel}`}>
      <div className={styles.content}>
        {loading && (
          <div className={styles.skeletons}>
            {[0, 1, 2].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        )}

        {!loading && error && (
          <div className={styles.error}>
            <p className={styles.errorText}>{error}</p>
            <button className={styles.retryBtn} onClick={retry} type="button">
              Spróbuj ponownie
            </button>
          </div>
        )}

        {!loading && !error && suggestions.map((s, i) => (
          <button
            key={i}
            className={`glass glow ${styles.card}`}
            onClick={() => onSelect({ name: s.name, recipeId: s.recipeId, url: s.url ?? null, photo_url: s.photo ?? null, source: s.source ?? null })}
            type="button"
          >
            <span className={styles.thumb}>
              {s.photo ? <img src={s.photo} alt="" /> : <span className={styles.cardEmoji}>{s.emoji}</span>}
            </span>
            <div className={styles.cardInfo}>
              <span className={styles.cardName}>{s.name}</span>
              <div className={styles.cardMeta}>
                {s.prep_time && <span>{s.prep_time} min</span>}
                {s.from_db && <span className={styles.badge}>z Twoich przepisów</span>}
                {!s.from_db && s.url && <span className={`${styles.badge} ${styles.badgeWeb}`}>z sieci · {s.source}</span>}
                {!s.from_db && !s.url && <span className={`${styles.badge} ${styles.badgeWeb}`}>nowy pomysł</span>}
              </div>
            </div>
            <span className={styles.arrow}>›</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
