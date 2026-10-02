import styles from './MealTile.module.css'

export default function MealTile({ mealType, meal, onAdd, onSuggest, onOptions, onOpenRecipe }) {
  const dishName = meal?.recipe?.name || meal?.custom_name
  const photo = meal?.recipe?.photo_url

  if (!meal) {
    return (
      <div className={`glass ${styles.empty}`} onClick={onAdd} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onAdd()}>
        <div className={styles.dashed}>
          <span className={styles.typeLabel}>{mealType.label}</span>
          <span className={styles.plus} aria-hidden="true">+</span>
          {onSuggest && (
            <button
              className={styles.aiBtn}
              onClick={e => { e.stopPropagation(); onSuggest() }}
              type="button"
              aria-label="Sugestie AI"
            >✨</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`glass glow ${styles.filled}`} onClick={onOpenRecipe} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpenRecipe()}>
      <div className={styles.content}>
        <span className={styles.typeLabel}>{mealType.label}</span>
        <span className={styles.dishName}>{dishName}</span>
      </div>
      {/* Zdjęcie od prawej, wygaszane w lewo pod napis (jak w mockupach) */}
      {photo
        ? <img src={photo} alt="" className={styles.photoBg} />
        : <span className={styles.emojiBg} aria-hidden="true">{mealType.emoji}</span>
      }
      <button
        className={styles.optionsBtn}
        onClick={e => { e.stopPropagation(); onOptions() }}
        aria-label="Opcje posiłku"
      >
        ⋯
      </button>
    </div>
  )
}
