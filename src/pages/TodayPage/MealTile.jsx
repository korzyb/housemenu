import { AUDIENCES, mealName } from '../../lib/meals'
import styles from './MealTile.module.css'

const ONLY_BADGE = { kidsOnly: '🧸 tylko dzieci', adultsOnly: '🧑‍🤝‍🧑 tylko dorośli' }

// Kafelek pory na „Dziś”. state = slotState(...) (lib/meals).
// Kolacja osobno (mode 'split') → wyższy kafelek z rzędami Dzieci / Dorośli.
export default function MealTile({ mealType, state, onAdd, onSuggest, onOptions, onOpen }) {
  if (state.mode === 'empty') {
    return (
      <div className={`glass ${styles.empty}`} onClick={() => onAdd('all')} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onAdd('all')}>
        <div className={styles.dashed}>
          <span className={styles.typeLabel}>{mealType.label}</span>
          <span className={styles.plus} aria-hidden="true">+</span>
          <button
            className={styles.aiBtn}
            onClick={e => { e.stopPropagation(); onSuggest('all') }}
            type="button"
            aria-label="Sugestie AI"
          >✨</button>
        </div>
      </div>
    )
  }

  if (state.mode === 'split') {
    return (
      <div className={`glass glow ${styles.split}`}>
        <span className={styles.typeLabel}>{mealType.label}</span>
        <div className={styles.rows}>
          {['kids', 'adults'].map(a => (
            <SplitRow
              key={a}
              audience={AUDIENCES[a]}
              meal={state[a]}
              emoji={mealType.emoji}
              onAdd={() => onAdd(a)}
              onSuggest={() => onSuggest(a)}
              onOptions={() => onOptions(a, state[a])}
              onOpen={() => onOpen(state[a])}
            />
          ))}
        </div>
      </div>
    )
  }

  const meal = state.main
  const photo = meal?.recipe?.photo_url
  return (
    <div className={`glass glow ${styles.filled}`} onClick={() => onOpen(meal)} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpen(meal)}>
      <div className={styles.content}>
        <span className={styles.typeLabel}>{mealType.label}</span>
        {ONLY_BADGE[state.mode] && <span className={styles.onlyBadge}>{ONLY_BADGE[state.mode]}</span>}
        <span className={styles.dishName}>{mealName(meal)}</span>
      </div>
      {/* Zdjęcie od prawej, wygaszane w lewo pod napis (jak w mockupach) */}
      {photo
        ? <img src={photo} alt="" className={styles.photoBg} />
        : <span className={styles.emojiBg} aria-hidden="true">{mealType.emoji}</span>
      }
      <button
        className={styles.optionsBtn}
        onClick={e => { e.stopPropagation(); onOptions(meal.audience ?? 'all', meal) }}
        aria-label="Opcje posiłku"
      >
        ⋯
      </button>
    </div>
  )
}

function SplitRow({ audience, meal, emoji, onAdd, onSuggest, onOptions, onOpen }) {
  const who = <span className={styles.who}>{audience.emoji} {audience.label}</span>

  if (!meal) {
    return (
      <div className={`${styles.row} ${styles.rowEmpty}`} onClick={onAdd} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onAdd()}>
        {who}
        <span className={styles.rowPlus} aria-hidden="true">+</span>
        <button className={styles.rowAi} onClick={e => { e.stopPropagation(); onSuggest() }} type="button" aria-label={`Sugestie AI — ${audience.label}`}>✨</button>
      </div>
    )
  }

  if (meal.skipped) {
    return (
      <div className={`${styles.row} ${styles.rowSkipped}`} onClick={onOptions} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onOptions()}>
        {who}
        <span className={styles.rowDish}>💤 bez kolacji</span>
      </div>
    )
  }

  const photo = meal.recipe?.photo_url
  return (
    <div className={styles.row} onClick={meal.recipe_id ? onOpen : onOptions} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && (meal.recipe_id ? onOpen() : onOptions())}>
      <span className={styles.rowThumb}>
        {photo ? <img src={photo} alt="" /> : <span aria-hidden="true">{emoji}</span>}
      </span>
      <span className={styles.rowText}>
        {who}
        <span className={styles.rowDish}>{mealName(meal)}</span>
      </span>
      <button className={styles.rowOptions} onClick={e => { e.stopPropagation(); onOptions() }} type="button" aria-label={`Opcje — ${audience.label}`}>⋯</button>
    </div>
  )
}
