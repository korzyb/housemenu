import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipes } from '../../hooks/useRecipes'
import RecipeCard from './RecipeCard'
import styles from './RecipesPage.module.css'

export default function RecipesPage() {
  const navigate = useNavigate()
  const { recipes, loading } = useRecipes()
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? recipes.filter(r => r.name.toLowerCase().includes(query.toLowerCase()))
    : recipes

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Przepisy</h1>
        <button
          className={styles.addBtn}
          onClick={() => navigate('/recipes/new')}
          aria-label="Dodaj przepis"
        >+</button>
      </header>

      <div className={styles.searchBar}>
        <input
          type="search"
          placeholder="Szukaj przepisów…"
          className={styles.searchInput}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className={styles.list}>
        {loading && (
          <>
            {[0, 1, 2].map(i => <div key={i} className={styles.skeleton} />)}
          </>
        )}
        {!loading && filtered.length === 0 && (
          <div className={styles.empty}>
            {query ? `Brak wyników dla „${query}"` : 'Brak przepisów. Dodaj pierwszy!'}
          </div>
        )}
        {!loading && filtered.map(r => (
          <RecipeCard key={r.id} recipe={r} />
        ))}
      </div>
    </div>
  )
}
