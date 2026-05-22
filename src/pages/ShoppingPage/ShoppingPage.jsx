import styles from './ShoppingPage.module.css'

export default function ShoppingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Zakupy</h1>
        <button className={styles.shopModeBtn}>Tryb sklepowy</button>
      </header>
      <div className={styles.list}>
        <p className={styles.empty}>Lista jest pusta. Zaplanuj tydzień, żeby wygenerować listę zakupów.</p>
      </div>
      <div className={styles.addBar}>
        <input
          type="text"
          placeholder="Dodaj produkt..."
          className={styles.addInput}
        />
        <button className={styles.micBtn} aria-label="Dodaj głosowo">🎙</button>
      </div>
    </div>
  )
}
