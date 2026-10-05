import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { householdForAudience } from '../../lib/profile'
import { invokeAi } from '../../lib/ai'
import BottomSheet from '../BottomSheet/BottomSheet'
import styles from './AISuggestSheet.module.css'

// audience: 'all' | 'kids' | 'adults' — kolacja dla dzieci bierze tylko profile dzieci (i odwrotnie)
export default function AISuggestSheet({ isOpen, onClose, mealType, mealTypeLabel, audience = 'all', plannedToday = [], onSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    if (isOpen) load()
  }, [isOpen])

  async function load() {
    setLoading(true)
    setError(null)
    setSuggestions([])

    const [{ data: recipesData }, { data: membersData }] = await Promise.all([
      supabase.from('recipes').select('id, name, tags').order('name'),
      supabase.from('household_members').select('name, profile, ai_profile_card').eq('is_active', true),
    ])

    // Tylko domownicy z wygenerowaną kartą (z danej grupy) — do AI idzie krótkie streszczenie (planner_brief)
    const household = householdForAudience(membersData || [], audience)

    const { data, error: aiError } = await invokeAi('suggest-meal', {
      mealType, audience, recipes: (recipesData || []).map(r => ({ name: r.name, tags: r.tags })), plannedToday, household,
    })

    if (aiError) {
      setError(aiError)
    } else {
      // Propozycje z bazy dostają id przepisu (dopasowanie po nazwie)
      const byName = new Map((recipesData || []).map(r => [r.name.trim().toLowerCase(), r.id]))
      setSuggestions((data?.suggestions ?? []).map(s => ({
        ...s,
        recipeId: s.from_db ? byName.get(String(s.name).trim().toLowerCase()) ?? null : null,
      })))
    }
    setLoading(false)
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
            <button className={styles.retryBtn} onClick={load} type="button">
              Spróbuj ponownie
            </button>
          </div>
        )}

        {!loading && !error && suggestions.map((s, i) => (
          <button
            key={i}
            className={`glass glow ${styles.card}`}
            onClick={() => onSelect({ name: s.name, recipeId: s.recipeId })}
            type="button"
          >
            <span className={styles.cardEmoji}>{s.emoji}</span>
            <div className={styles.cardInfo}>
              <span className={styles.cardName}>{s.name}</span>
              <div className={styles.cardMeta}>
                {s.prep_time && <span>{s.prep_time} min</span>}
                {s.from_db && <span className={styles.badge}>z Twoich przepisów</span>}
              </div>
            </div>
            <span className={styles.arrow}>›</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  )
}
