import styles from './TodayPage.module.css'

const MEAL_SLOTS = [
  { id: 'breakfast', label: 'Śniadanie', emoji: '🍳' },
  { id: 'snack', label: 'Przekąska', emoji: '🍎' },
  { id: 'lunch', label: 'Obiad', emoji: '🍝' },
  { id: 'dinner', label: 'Kolacja', emoji: '🥗' },
]

export default function TodayPage() {
  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.date}>{today}</p>
        <h1 className={styles.title}>Dziś</h1>
      </header>
      <div className={styles.slots}>
        {MEAL_SLOTS.map((slot) => (
          <div key={slot.id} className={styles.mealCard}>
            <span className={styles.mealEmoji}>{slot.emoji}</span>
            <span className={styles.mealLabel}>{slot.label}</span>
            <button className={styles.addBtn} aria-label={`Dodaj ${slot.label}`}>+</button>
          </div>
        ))}
      </div>
    </div>
  )
}
