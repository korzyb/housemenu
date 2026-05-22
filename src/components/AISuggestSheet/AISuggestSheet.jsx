import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import BottomSheet from '../BottomSheet/BottomSheet'
import styles from './AISuggestSheet.module.css'

export default function AISuggestSheet({ isOpen, onClose, mealType, mealTypeLabel, plannedToday = [], onSelect }) {
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

    const { data: recipesData } = await supabase
      .from('recipes')
      .select('name')
      .order('name')
      .limit(30)

    const { data, error: fnError } = await supabase.functions.invoke('suggest-meal', {
      body: { mealType, recipes: recipesData || [], plannedToday },
    })

    if (fnError || data?.error) {
      setError(data?.error ?? fnError?.message ?? 'Nieznany błąd')
    } else {
      setSuggestions(data?.suggestions ?? [])
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
            className={styles.card}
            onClick={() => onSelect(s.name)}
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
