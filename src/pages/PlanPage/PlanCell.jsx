import { AUDIENCES, mealName } from '../../lib/meals'
import styles from './PlanCell.module.css'

const ONLY_BADGE = { kidsOnly: AUDIENCES.kids.emoji, adultsOnly: AUDIENCES.adults.emoji }

// Komórka siatki planu. state = slotState(...) (lib/meals).
// wide — szersza kolumna kolacji; przy podziale dwie połówki obok siebie (🧸 | 🧑‍🤝‍🧑).
// onSlot(audience, meal|null) — tap w (pół)komórkę.
export default function PlanCell({ mealType, state, isToday, isPast, wide = false, onSlot }) {
  const base = [
    styles.cell,
    wide ? styles.wide : '',
    state.mode === 'empty' ? styles.empty : styles.filled,
    isToday ? styles.today : 'glass',
    isPast ? styles.past : '',
  ].filter(Boolean).join(' ')

  if (state.mode === 'split') {
    return (
      <div className={`${base} ${styles.splitCell}`}>
        {['kids', 'adults'].map(a => (
          <Half
            key={a}
            audience={AUDIENCES[a]}
            meal={state[a]}
            emoji={mealType.emoji}
            isPast={isPast}
            onClick={() => onSlot(a, state[a])}
          />
        ))}
      </div>
    )
  }

  const meal = state.main
  const click = () => onSlot(meal?.audience ?? 'all', meal)
  return (
    <div
      className={base}
      onClick={isPast ? undefined : click}
      role={isPast ? undefined : 'button'}
      tabIndex={isPast ? -1 : 0}
      onKeyDown={e => !isPast && e.key === 'Enter' && click()}
      title={mealName(meal) || undefined}
    >
      {meal ? (
        <>
          <Plate meal={meal} emoji={mealType.emoji} />
          <span className={styles.name}>{mealName(meal)}</span>
          {ONLY_BADGE[state.mode] && <span className={styles.badge} aria-label={state.mode === 'kidsOnly' ? 'tylko dzieci' : 'tylko dorośli'}>{ONLY_BADGE[state.mode]}</span>}
        </>
      ) : (
        !isPast && <span className={styles.plus} aria-hidden="true">+</span>
      )}
    </div>
  )
}

function Plate({ meal, emoji }) {
  const photo = meal?.recipe?.photo_url
  return (
    <span className={styles.plate}>
      {photo
        ? <img src={photo} alt="" className={styles.photo} />
        : <span className={styles.emoji}>{emoji}</span>}
    </span>
  )
}

function Half({ audience, meal, emoji, isPast, onClick }) {
  const label = meal?.skipped ? 'bez kolacji' : mealName(meal)
  return (
    <div
      className={[styles.half, !meal ? styles.halfEmpty : '', meal?.skipped ? styles.halfSkipped : ''].join(' ')}
      onClick={isPast ? undefined : onClick}
      role={isPast ? undefined : 'button'}
      tabIndex={isPast ? -1 : 0}
      onKeyDown={e => !isPast && e.key === 'Enter' && onClick()}
      title={`${audience.label}: ${label || 'nie zaplanowano'}`}
    >
      <span className={styles.halfWho} aria-label={audience.label}>{audience.emoji}</span>
      {meal && !meal.skipped && <Plate meal={meal} emoji={emoji} />}
      {meal?.skipped && <span className={styles.skipIcon} aria-hidden="true">💤</span>}
      {!meal && !isPast && <span className={styles.plus} aria-hidden="true">+</span>}
      {meal && <span className={styles.name}>{label}</span>}
    </div>
  )
}
