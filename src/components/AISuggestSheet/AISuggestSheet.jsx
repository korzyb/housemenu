import { useState, useEffect } from 'react'
import { loadSuggestions, pickedSuggestion } from '../../lib/suggestions'
import BottomSheet from '../BottomSheet/BottomSheet'
import styles from './AISuggestSheet.module.css'

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
            onClick={() => onSelect(pickedSuggestion(s))}
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
