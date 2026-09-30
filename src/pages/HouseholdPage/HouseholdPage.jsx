import { useNavigate } from 'react-router-dom'
import { useMembers } from '../../hooks/useMembers'
import { LIFE_PHASES, profileCompleteness } from '../../lib/profile'
import styles from './HouseholdPage.module.css'

function roleLabel(member) {
  const phases = member.profile?.base?.life_phase || []
  if (!phases.length) return 'Profil niedokończony'
  return phases
    .map(id => LIFE_PHASES.find(p => p.id === id)?.label ?? id)
    .join(', ')
}

export default function HouseholdPage() {
  const navigate = useNavigate()
  const { members, loading } = useMembers()

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={`glass ${styles.backBtn}`} onClick={() => navigate('/settings')} aria-label="Wstecz">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <h1 className={`page-title ${styles.title}`}>Gospodarstwo</h1>
      </header>

      {loading ? (
        <div className={styles.skeletons}>
          {[0, 1, 2].map(i => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <>
          {members.length === 0 && (
            <p className={styles.emptyState}>
              Dodaj domowników i ich profile żywieniowe — AI będzie planować posiłki z uwzględnieniem ich potrzeb, ograniczeń i smaków.
            </p>
          )}

          <div className={styles.list}>
            {members.map(member => {
              const pct = profileCompleteness(member.profile)
              return (
                <button
                  key={member.id}
                  className={`glass glow ${styles.card}`}
                  onClick={() => navigate(`/settings/household/${member.id}`)}
                >
                  <span className={styles.avatar}>{member.emoji || '🙂'}</span>
                  <span className={styles.info}>
                    <span className={styles.name}>{member.name}</span>
                    <span className={styles.role}>{roleLabel(member)}</span>
                    <span className={styles.meter}>
                      <span className={styles.meterFill} style={{ width: `${pct}%` }} />
                    </span>
                    <span className={styles.pct}>Profil uzupełniony w {pct}%</span>
                  </span>
                  <span className={styles.arrow}>›</span>
                </button>
              )
            })}
          </div>
        </>
      )}

      <button className={styles.addBtn} onClick={() => navigate('/settings/household/new')}>
        + Dodaj domownika
      </button>
    </div>
  )
}
