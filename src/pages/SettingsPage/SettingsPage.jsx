import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMembers } from '../../hooks/useMembers'
import { useGoBack } from '../../lib/nav'
import { membersLabel } from '../../lib/profile'
import { SHOP_SIZES, getShopListSize, setShopListSize } from '../../lib/preferences'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const goBack = useGoBack('/today')
  const { members } = useMembers()
  const [shopSize, setShopSize] = useState(getShopListSize)

  function chooseShopSize(id) {
    setShopSize(id)
    setShopListSize(id)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={`glass ${styles.backBtn}`} onClick={goBack} aria-label="Wstecz">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className={`page-title ${styles.title}`}>Ustawienia</h1>
      </header>

      <div className={styles.sectionLabel}>Gospodarstwo</div>
      <Link to="/settings/household" className={`glass glow ${styles.row}`}>
        <span className={styles.rowIcon}>🏠</span>
        <span className={styles.rowText}>
          <span className={styles.rowTitle}>Gospodarstwo domowe</span>
          <span className={styles.rowSub}>
            {members.length
              ? membersLabel(members.length)
              : 'Dodaj domowników i ich profile'}
          </span>
        </span>
        <span className={styles.rowArrow}>›</span>
      </Link>

      <div className={styles.sectionLabel}>Wygląd</div>
      <div className={`glass glow ${styles.optionCard}`}>
        <span className={styles.rowIcon}>🛒</span>
        <span className={styles.rowText}>
          <span className={styles.rowTitle}>Tryb sklepowy — wielkość listy</span>
          <span className={styles.rowSub}>Mniejsze = więcej produktów na ekranie (ustawienie tego telefonu)</span>
          <span className={styles.segment} role="radiogroup" aria-label="Wielkość listy w trybie sklepowym">
            {SHOP_SIZES.map(s => (
              <button
                key={s.id}
                className={`${styles.segmentBtn} ${shopSize === s.id ? styles.segmentOn : ''}`}
                onClick={() => chooseShopSize(s.id)}
                role="radio"
                aria-checked={shopSize === s.id}
                type="button"
              >{s.label}</button>
            ))}
          </span>
        </span>
      </div>
    </div>
  )
}
