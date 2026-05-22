import { useNavigate } from 'react-router-dom'
import styles from './RecipeCard.module.css'

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate()

  return (
    <div className={styles.card} onClick={() => navigate(`/recipes/${recipe.id}`)}>
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
        {recipe.tags?.length > 0 && (
          <div className={styles.tags}>
            {recipe.tags.slice(0, 3).map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
      <span className={styles.arrow}>›</span>
    </div>
  )
}
