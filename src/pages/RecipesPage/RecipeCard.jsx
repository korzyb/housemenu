import { useNavigate } from 'react-router-dom'
import { isThermomix, THERMOMIX_TAG } from '../../lib/recipes'
import styles from './RecipeCard.module.css'

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate()
  const thermomix = isThermomix(recipe)
  const otherTags = (recipe.tags || []).filter(t => t.toLowerCase() !== THERMOMIX_TAG)

  return (
    <div className={`glass glow ${styles.card}`} onClick={() => navigate(`/recipes/${recipe.id}`)}>
      <div className={styles.thumb}>
        {recipe.photo_url
          ? <img src={recipe.photo_url} alt="" className={styles.img} />
          : <span className={styles.emoji}>🍽</span>
        }
      </div>
      <div className={styles.info}>
        <p className={styles.name}>{recipe.name}</p>
        <div className={styles.meta}>
          {recipe.prep_time && <span>⏱ {recipe.prep_time} min</span>}
          {recipe.servings  && <span>👤 {recipe.servings}</span>}
          {recipe.difficulty && <span>{recipe.difficulty === 'easy' ? '⭐ Łatwy' : recipe.difficulty === 'medium' ? '⭐⭐ Średni' : '⭐⭐⭐ Trudny'}</span>}
        </div>
        <span className={styles.lastPlanned}>
          {recipe.last_planned_at
            ? `📅 ostatnio w planie: ${new Date(`${recipe.last_planned_at.slice(0, 10)}T00:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }).replace('.', '')}`
            : '📅 jeszcze nie planowany'}
        </span>
        {(thermomix || otherTags.length > 0) && (
          <div className={styles.tags}>
            {thermomix && <span className={`${styles.tag} ${styles.tmTag}`}>🟢 Thermomix</span>}
            {otherTags.slice(0, thermomix ? 2 : 3).map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <span className={styles.arrow}>›</span>
    </div>
  )
}
