import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipes } from '../../hooks/useRecipes'
import BottomSheet from '../BottomSheet/BottomSheet'
import styles from './AddMealSheet.module.css'

function formatShortDate(d) {
  return new Date(`${String(d).slice(0, 10)}T00:00:00`)
    .toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
    .replace('.', '')
}

// Dodawanie posiłku do pory: jedno pole = wyszukiwarka przepisów + własna nazwa (np. "Kanapki").
// Renderuj warunkowo ({open && <AddMealSheet …/>}) — przepisy wczytują się przy otwarciu.
export default function AddMealSheet({ title, initialValue = '', onClose, onPickRecipe, onAddCustom }) {
  const navigate = useNavigate()
  const { recipes, loading } = useRecipes()
  const [query, setQuery] = useState(initialValue)
  const [busy,  setBusy]  = useState(false)

  const q = query.trim().toLowerCase()
  const filtered = q
    ? recipes.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.tags?.some(t => t.toLowerCase().includes(q)))
    : recipes
  const exactMatch = recipes.some(r => r.name.trim().toLowerCase() === q)

  async function pick(recipe) {
    setBusy(true)
    await onPickRecipe(recipe)
    setBusy(false)
  }

  async function addCustom() {
    const name = query.trim()
    if (!name) return
    setBusy(true)
    await onAddCustom(name)
    setBusy(false)
  }

  return (
    <BottomSheet isOpen onClose={onClose} title={title}>
      <div className={styles.content}>
        <input
          className="glass-input"
          placeholder="Szukaj przepisu lub wpisz nazwę…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !exactMatch && addCustom()}
          autoFocus
        />

        {query.trim() && !exactMatch && (
          <button className={`btn-primary ${styles.customBtn}`} onClick={addCustom} disabled={busy} type="button">
            Dodaj „{query.trim()}”
          </button>
        )}

        <p className={styles.sectionLabel}>
          {q ? 'Pasujące przepisy' : 'Z Twoich przepisów'}
        </p>

        <div className={`${styles.list} ${busy ? styles.busy : ''}`}>
          {loading && [0, 1, 2].map(i => <div key={i} className={`glass ${styles.skeleton}`} />)}

          {!loading && recipes.length === 0 && (
            <div className={styles.empty}>
              <p>Nie masz jeszcze przepisów w bazie.</p>
              <button className={styles.link} onClick={() => navigate('/recipes/new')} type="button">
                Dodaj pierwszy przepis →
              </button>
            </div>
          )}

          {!loading && recipes.length > 0 && filtered.length === 0 && (
            <p className={styles.empty}>Brak przepisów pasujących do „{query.trim()}”.</p>
          )}

          {!loading && filtered.map(r => (
            <button key={r.id} className={`glass ${styles.row}`} onClick={() => pick(r)} type="button">
              <span className={styles.thumb}>
                {r.photo_url ? <img src={r.photo_url} alt="" /> : '🍽'}
              </span>
              <span className={styles.info}>
                <span className={styles.name}>{r.name}</span>
                <span className={styles.meta}>
                  {r.prep_time && <span>⏱ {r.prep_time} min</span>}
                  <span>{r.last_planned_at ? `ostatnio ${formatShortDate(r.last_planned_at)}` : 'jeszcze nie planowany'}</span>
                </span>
              </span>
              <span className={styles.plus}>+</span>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  )
}
