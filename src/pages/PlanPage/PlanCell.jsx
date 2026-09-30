import styles from './PlanCell.module.css'

export default function PlanCell({ meal, mealType, isToday, isPast, onClick }) {
  const name = meal?.recipe?.name || meal?.custom_name
  const photo = meal?.recipe?.photo_url

  return (
    <div
      className={[
        styles.cell,
        meal    ? styles.filled : styles.empty,
        isToday ? styles.today  : 'glass',
        isPast  ? styles.past   : '',
      ].filter(Boolean).join(' ')}
      onClick={isPast ? undefined : onClick}
      role={isPast ? undefined : 'button'}
      tabIndex={isPast ? -1 : 0}
      onKeyDown={e => !isPast && e.key === 'Enter' && onClick()}
      title={name || undefined}
    >
      {meal ? (
        <>
          <span className={styles.plate}>
            {photo
              ? <img src={photo} alt="" className={styles.photo} />
              : <span className={styles.emoji}>{mealType.emoji}</span>
            }
          </span>
          <span className={styles.name}>{name}</span>
        </>
      ) : (
        !isPast && <span className={styles.plus} aria-hidden="true">+</span>
      )}
    </div>
  )
}
