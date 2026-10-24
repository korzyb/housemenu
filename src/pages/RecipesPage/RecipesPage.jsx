import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRecipes } from '../../hooks/useRecipes'
import { isThermomix, THERMOMIX_TAG } from '../../lib/recipes'
import RecipeCard from './RecipeCard'
import styles from './RecipesPage.module.css'

// Pora = tag przepisu (nadawany przy imporcie i w formularzu)
const MEALS = [
  { id: 'śniadanie', label: '🍳 Śniadanie' },
  { id: 'obiad',     label: '🍝 Obiad' },
  { id: 'kolacja',   label: '🥗 Kolacja' },
  { id: 'grill',     label: '🔥 Grill' },
]
const MEAL_IDS = new Set([...MEALS.map(m => m.id), 'przekąska'])
const TIMES = [20, 40]
const SORTS = [
  { id: 'name',   label: 'A–Z' },
  { id: 'rotate', label: 'Dawno nie było' },
  { id: 'new',    label: 'Najnowsze' },
]
const QUICK_TAGS = 8

const tagsOf = r => (r.tags ?? []).map(t => t.toLowerCase())

function recipesLabel(n) {
  if (n === 1) return '1 przepis'
  const lastTwo = n % 100
  const last = n % 10
  return last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? `${n} przepisy` : `${n} przepisów`
}

export default function RecipesPage() {
  const navigate = useNavigate()
  const { recipes, loading } = useRecipes()
  // Filtry w adresie (?pora=obiad&tag=szybkie…) — zostają po powrocie ze szczegółów przepisu
  const [params, setParams] = useSearchParams()
  const [moreTags, setMoreTags] = useState(false)

  const query   = params.get('q') ?? ''
  const meal    = params.get('pora')
  const maxTime = Number(params.get('czas')) || null
  const tm      = params.get('tm') === '1'
  const tags    = params.getAll('tag')
  const sort    = params.get('sort') ?? 'name'

  function update(fn) {
    const next = new URLSearchParams(params)
    fn(next)
    setParams(next, { replace: true })
  }
  const toggle = (key, value) => update(p => (p.get(key) === value ? p.delete(key) : p.set(key, value)))
  const toggleTag = tag => update(p => {
    const all = p.getAll('tag')
    p.delete('tag')
    ;(all.includes(tag) ? all.filter(t => t !== tag) : [...all, tag]).forEach(t => p.append('tag', t))
  })

  // Tagi do szybkiego wyboru: od najczęstszych, bez pór i Thermomixa (mają własne filtry)
  const tagList = useMemo(() => {
    const count = {}
    for (const r of recipes) for (const t of tagsOf(r)) {
      if (!MEAL_IDS.has(t) && t !== THERMOMIX_TAG) count[t] = (count[t] ?? 0) + 1
    }
    // Tagi jednorazowe (np. nadane przy imporcie) pomijamy — znajdzie je wyszukiwarka
    return Object.entries(count).filter(([, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pl')).map(([t]) => t)
  }, [recipes])
  const visibleTags = moreTags ? tagList : [...new Set([...tags, ...tagList.slice(0, QUICK_TAGS)])]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = recipes.filter(r => {
      const rt = tagsOf(r)
      if (meal && !rt.includes(meal)) return false
      if (maxTime && !(r.prep_time && r.prep_time <= maxTime)) return false
      if (tm && !isThermomix(r)) return false
      if (tags.length && !tags.every(t => rt.includes(t))) return false
      if (q && !(
        r.name.toLowerCase().includes(q) ||
        rt.some(t => t.includes(q)) ||
        r.ingredients?.some(i => i.name?.toLowerCase().includes(q))
      )) return false
      return true
    })
    if (sort === 'rotate') {
      // Najpierw nigdy nieplanowane, potem najdawniej planowane
      return [...list].sort((a, b) => (a.last_planned_at ?? '').localeCompare(b.last_planned_at ?? '') || a.name.localeCompare(b.name, 'pl'))
    }
    if (sort === 'new') return [...list].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    return list
  }, [recipes, query, meal, maxTime, tm, tags, sort])

  const activeCount = (meal ? 1 : 0) + (maxTime ? 1 : 0) + (tm ? 1 : 0) + tags.length + (query.trim() ? 1 : 0)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className="page-title">Przepisy</h1>
        <button
          className={styles.addBtn}
          onClick={() => navigate('/recipes/new')}
          aria-label="Dodaj przepis"
        >+</button>
      </header>

      <div className={styles.searchBar}>
        <input
          type="search"
          placeholder="Szukaj: nazwa, składnik, tag…"
          className={`glass-input ${styles.searchInput}`}
          value={query}
          onChange={e => update(p => (e.target.value ? p.set('q', e.target.value) : p.delete('q')))}
        />
      </div>

      {/* Pora */}
      <div className={styles.chipRow} role="group" aria-label="Pora posiłku">
        <button className={`${styles.chip} ${!meal ? styles.chipOn : ''}`} onClick={() => update(p => p.delete('pora'))} type="button">Wszystkie</button>
        {MEALS.map(m => (
          <button key={m.id} className={`${styles.chip} ${meal === m.id ? styles.chipOn : ''}`} onClick={() => toggle('pora', m.id)} type="button">{m.label}</button>
        ))}
      </div>

      {/* Czas, Thermomix, tagi */}
      <div className={`${styles.chipRow} ${moreTags ? styles.chipWrap : ''}`} role="group" aria-label="Filtry">
        {TIMES.map(t => (
          <button key={t} className={`${styles.chip} ${styles.small} ${maxTime === t ? styles.chipOn : ''}`} onClick={() => toggle('czas', String(t))} type="button">⏱ do {t} min</button>
        ))}
        <button className={`${styles.chip} ${styles.small} ${tm ? styles.chipOn : ''}`} onClick={() => toggle('tm', '1')} type="button">🟢 Thermomix</button>
        {visibleTags.map(t => (
          <button key={t} className={`${styles.chip} ${styles.small} ${tags.includes(t) ? styles.chipOn : ''}`} onClick={() => toggleTag(t)} type="button">{t}</button>
        ))}
        {tagList.length > QUICK_TAGS && (
          <button className={`${styles.chip} ${styles.small} ${styles.more}`} onClick={() => setMoreTags(v => !v)} type="button">
            {moreTags ? 'mniej ▴' : `+${tagList.length - QUICK_TAGS} tagów ▾`}
          </button>
        )}
      </div>

      <div className={styles.resultBar}>
        <span className={styles.count}>
          {loading ? '…' : recipesLabel(filtered.length)}
          {activeCount > 0 && !loading && (
            <button className={styles.clear} onClick={() => setParams(sort !== 'name' ? { sort } : {}, { replace: true })} type="button">Wyczyść</button>
          )}
        </span>
        <span className={styles.sort}>
          {SORTS.map(s => (
            <button key={s.id} className={`${styles.sortBtn} ${sort === s.id ? styles.sortOn : ''}`}
              onClick={() => update(p => (s.id === 'name' ? p.delete('sort') : p.set('sort', s.id)))} type="button">{s.label}</button>
          ))}
        </span>
      </div>

      <div className={styles.list}>
        {loading && (
          <>
            {[0, 1, 2].map(i => <div key={i} className={`glass ${styles.skeleton}`} />)}
          </>
        )}
        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            {recipes.length === 0 ? 'Brak przepisów. Dodaj pierwszy!' : 'Nic nie pasuje do wybranych filtrów.'}
          </div>
        )}
        {!loading && filtered.map(r => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>
    </div>
  )
}
