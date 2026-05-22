import styles from './PlanCell.module.css'

export default function PlanCell({ meal, isToday, isPast, onClick }) {
  const name = meal?.recipe?.name || meal?.custom_name

  return (
    <div
      className={[
        styles.cell,
        meal   ? styles.filled : styles.empty,
        isToday ? styles.today  : '',
        isPast  ? styles.past   : '',
      ].filter(Boolean).join(' ')}
      onClick={isPast ? undefined : onClick}
      role={isPast ? undefined : 'button'}
      tabIndex={isPast ? -1 : 0}
      onKeyDown={e => !isPast && e.key === 'Enter' && onClick()}
    >
      {name && <span className={styles.name}>{name}</span>}
    </div>
  )
}
