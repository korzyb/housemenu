import styles from './MealTile.module.css'

export default function MealTile({ mealType, meal, onAdd, onSuggest, onOptions, onOpenRecipe }) {
  const dishName = meal?.recipe?.name || meal?.custom_name
  const description = meal?.recipe?.description
  const photo = meal?.recipe?.photo_url

  if (!meal) {
    return (
      <div className={styles.empty} onClick={onAdd} role="button" tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onAdd()}>
        <div className={styles.emptyText}>
          <span className={styles.emptyLabel}>{mealType.label}</span>
          <span className={styles.emptyHint}>Dotknij, żeby dodać</span>
        </div>
        <div className={styles.emptyActions}>
          {onSuggest && (
            <button
              className={styles.aiBtn}
              onClick={e => { e.stopPropagation(); onSuggest() }}
              type="button"
              aria-label="Sugestie AI"
            >✨</button>
          )}
          <span className={styles.addIcon}>+</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.filled} onClick={onOpenRecipe} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onOpenRecipe()}>
      <div className={styles.content}>
        <span className={styles.typeLabel}>{mealType.label}</span>
        <span className={styles.dishName}>{description || dishName}</span>
      </div>
      <div className={styles.photoWrap}>
        {photo
          ? <img src={photo} alt="" className={styles.photo} />
          : <div className={styles.photoPlaceholder}>{mealType.emoji}</div>
        }
      </div>
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
