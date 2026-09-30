import { Link, useNavigate } from 'react-router-dom'
import { useMembers } from '../../hooks/useMembers'
import { membersLabel } from '../../lib/profile'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { members } = useMembers()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={`glass ${styles.backBtn}`} onClick={() => navigate('/today')} aria-label="Wstecz">
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
    </div>
  )
}
