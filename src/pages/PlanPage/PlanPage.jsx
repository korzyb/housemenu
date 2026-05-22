import styles from './PlanPage.module.css'

const DAYS = ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const MEALS = ['Śn', 'Prz', 'Ob', 'Ko']

export default function PlanPage() {
  const today = new Date()
  const startOfWeek = new Date(today)
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
  startOfWeek.setDate(today.getDate() - dayOfWeek)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const weekRange = `${startOfWeek.getDate()}–${endOfWeek.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}`

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.weekRange}>{weekRange}</span>
        <button className={styles.aiBtn}>Zaplanuj z AI ✨</button>
      </header>
      <div className={styles.grid}>
        <div className={styles.headerRow}>
          <div className={styles.cornerCell} />
          {MEALS.map((meal) => (
            <div key={meal} className={styles.colHeader}>{meal}</div>
          ))}
        </div>
        {DAYS.map((day, i) => (
          <div key={day} className={[styles.row, i === dayOfWeek ? styles.todayRow : ''].join(' ')}>
            <div className={styles.rowHeader}>{day}</div>
            {MEALS.map((meal) => (
              <div key={meal} className={styles.cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
