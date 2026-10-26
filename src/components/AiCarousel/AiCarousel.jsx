import { useState, useEffect, useRef } from 'react'
import { loadSuggestions, pickedSuggestion } from '../../lib/suggestions'
import styles from './AiCarousel.module.css'

// 3 propozycje AI w karuzeli (‹ • • • › albo przesunięcie palcem) + „Wybierz”.
// Pobiera propozycje przy pojawieniu się (zmiana audience → przekaż nowy key, żeby pobrać ponownie).
// onPick(suggestion) — jak onSelect w AISuggestSheet: { name, recipeId, url, photo_url, source }
export default function AiCarousel({ mealType, audience = 'all', plannedToday = [], onPick, disabled }) {
  const [result,  setResult]  = useState({ suggestions: [], error: null })
  const [loading, setLoading] = useState(true)
  const [idx,     setIdx]     = useState(0)
  const [round,   setRound]   = useState(0)   // „Inne propozycje” → nowe pobranie
  const touchX = useRef(null)
  const plannedKey = plannedToday.join('\n')

  useEffect(() => {
    let stale = false
    loadSuggestions({ mealType, audience, plannedToday: plannedKey ? plannedKey.split('\n') : [] })
      .then(r => { if (!stale) { setResult(r); setIdx(0); setLoading(false) } })
    return () => { stale = true }
  }, [mealType, audience, plannedKey, round])

  function refresh() {
    setLoading(true)
    setResult({ suggestions: [], error: null })
    setRound(r => r + 1)
  }

  const { suggestions, error } = result
  const n = suggestions.length
  const cycle = dir => n > 1 && setIdx(i => (i + dir + n) % n)
  const s = suggestions[idx]

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={`glass ${styles.card} ${styles.skeleton}`}>
          <span className={styles.loadingText}>✨ AI szuka propozycji…</span>
        </div>
      </div>
    )
  }

  if (error || !s) {
    return (
      <div className={`${styles.wrap} ${styles.error}`}>
        <p>{error || 'Brak propozycji.'}</p>
        <button className={styles.textBtn} onClick={refresh} type="button">Spróbuj ponownie</button>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div
        className={`glass glow ${styles.card}`}
        onTouchStart={e => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={e => {
          if (touchX.current === null) return
          const dx = touchX.current - e.changedTouches[0].clientX
          if (Math.abs(dx) > 40) cycle(dx > 0 ? 1 : -1)
          touchX.current = null
        }}
      >
        <div className={styles.text}>
          <span className={styles.name}>{s.name}</span>
          <span className={styles.meta}>
            {s.prep_time ? <span>⏱ {s.prep_time} min</span> : null}
            {s.from_db && <span className={styles.badge}>z Twoich przepisów</span>}
            {!s.from_db && s.url && <span className={`${styles.badge} ${styles.badgeWeb}`}>z sieci · {s.source}</span>}
            {!s.from_db && !s.url && <span className={`${styles.badge} ${styles.badgeWeb}`}>nowy pomysł</span>}
          </span>
          {n > 1 && (
            <span className={styles.switcher}>
              <button onClick={() => cycle(-1)} type="button" aria-label="Poprzednia propozycja">‹</button>
              {suggestions.map((_, k) => (
                <span key={k} className={`${styles.dot} ${k === idx ? styles.dotOn : ''}`} />
              ))}
              <button onClick={() => cycle(1)} type="button" aria-label="Następna propozycja">›</button>
            </span>
          )}
        </div>
        {s.photo
          ? <img src={s.photo} alt="" className={styles.photoBg} />
          : <span className={styles.emojiBg} aria-hidden="true">{s.emoji || '🍽'}</span>}
      </div>

      <div className={styles.actions}>
        <button className={`btn-primary ${styles.pickBtn}`} onClick={() => onPick(pickedSuggestion(s))} disabled={disabled} type="button">
          Wybierz to danie
        </button>
        <button className={styles.textBtn} onClick={refresh} disabled={disabled} type="button">🔄 Inne</button>
      </div>
    </div>
  )
}
