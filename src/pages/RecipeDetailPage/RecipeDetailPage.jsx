import { useParams, useNavigate } from 'react-router-dom'
import styles from './RecipeDetailPage.module.css'

export default function RecipeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => navigate(-1)} aria-label="Wróć">
        ←
      </button>
      <div className={styles.hero}>
        <div className={styles.heroPlaceholder}>📷</div>
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>Przepis #{id}</h1>
        <p className={styles.placeholder}>Szczegóły przepisu pojawią się tutaj.</p>
      </div>
    </div>
  )
}
