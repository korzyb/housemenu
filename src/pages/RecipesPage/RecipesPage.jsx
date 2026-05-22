import styles from './RecipesPage.module.css'

export default function RecipesPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Przepisy</h1>
        <button className={styles.addBtn} aria-label="Dodaj przepis">+</button>
      </header>
      <div className={styles.searchBar}>
        <input
          type="search"
          placeholder="Szukaj przepisów..."
          className={styles.searchInput}
        />
      </div>
      <div className={styles.list}>
        <p className={styles.empty}>Brak przepisów. Dodaj pierwszy!</p>
      </div>
    </div>
  )
}
