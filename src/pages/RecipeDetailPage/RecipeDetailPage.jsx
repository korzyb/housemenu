import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecipe } from '../../hooks/useRecipes'
import { useMealPlan } from '../../hooks/useMealPlan'
import { MEAL_TYPES } from '../../lib/meals'
import { getWeekStart, toDateString } from '../../lib/dates'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import Toast from '../../components/Toast/Toast'
import { isThermomix } from '../../lib/recipes'
import { useAddToShopping } from '../../hooks/useAddToShopping'
import styles from './RecipeDetailPage.module.css'

const WEEK_START = getWeekStart()
const TODAY_STR  = toDateString(new Date())

const DIFF_LABELS = { easy: '⭐ Łatwy', medium: '⭐⭐ Średni', hard: '⭐⭐⭐ Trudny' }
const TEMP_LABELS = { hot: '🌡 Na ciepło', cold: '❄ Na zimno' }
const DAY_SHORT   = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So']

const PLAN_DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() + i)
  return d
})

function scaleAmount(amount, factor) {
  if (!amount) return amount
  const n = parseFloat(amount)
  if (isNaN(n)) return amount
  const scaled = n * factor
  return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1).replace(/\.0$/, '')
}

export default function RecipeDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { recipe, loading, deleteRecipe } = useRecipe(id)
  const { addMeal } = useMealPlan(WEEK_START)
  const shopping = useAddToShopping()

  const [servings,   setServings]   = useState(null)
  const [doneSteps,  setDoneSteps]  = useState(new Set())
  const [sheetOpen,  setSheetOpen]  = useState(false)
  const [pickedDate, setPickedDate] = useState(TODAY_STR)
  const [pickedMeal, setPickedMeal] = useState('lunch')
  const [adding,     setAdding]     = useState(false)

  function toggleStep(i) {
    setDoneSteps(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  async function handleAddToPlan() {
    setAdding(true)
    await addMeal({ date: pickedDate, mealType: pickedMeal, recipeId: id })
    setAdding(false)
    setSheetOpen(false)
  }

  async function handleDelete() {
    if (!window.confirm('Usunąć ten przepis?')) return
    await deleteRecipe()
    navigate('/recipes')
  }

  if (loading) return <div className={styles.loading}>…</div>
  if (!recipe)  return <div className={styles.loading}>Nie znaleziono przepisu</div>

  const thermomix = isThermomix(recipe)
  const currentServings = servings ?? recipe.servings ?? 4
  const scale = recipe.servings ? currentServings / recipe.servings : 1

  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        {recipe.photo_url
          ? <img src={recipe.photo_url} alt={recipe.name} className={styles.heroImg} />
          : <div className={styles.heroEmpty}>🍽</div>
        }
        <div className={styles.heroGradient} />
        <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <div className={styles.heroActions}>
          <button className={styles.editBtn} onClick={() => navigate(`/recipes/${id}/edit`)} aria-label="Edytuj przepis">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
          </button>
          <button className={styles.deleteBtn} onClick={handleDelete} aria-label="Usuń przepis">🗑</button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h1 className={styles.title}>{recipe.name}</h1>
        {recipe.description && <p className={styles.description}>{recipe.description}</p>}

        {/* Meta chips */}
        <div className={styles.metaRow}>
          {thermomix && <span className={`${styles.chip} ${styles.tmChip}`}>🟢 Thermomix</span>}
          {recipe.prep_time   && <span className={styles.chip}>⏱ {recipe.prep_time} min</span>}
          {recipe.difficulty  && <span className={styles.chip}>{DIFF_LABELS[recipe.difficulty]}</span>}
          {recipe.temperature && <span className={styles.chip}>{TEMP_LABELS[recipe.temperature]}</span>}
        </div>

        {/* Tags */}
        {recipe.tags?.length > 0 && (
          <div className={styles.tags}>
            {recipe.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
        )}

        {/* Serving scaler */}
        {recipe.ingredients?.length > 0 && (
          <div className={styles.scaler}>
            <span className={styles.scalerLabel}>Porcje</span>
            <div className={styles.scalerControls}>
              <button
                className={styles.scalerBtn}
                onClick={() => setServings(Math.max(1, currentServings - 1))}
                type="button"
              >−</button>
              <span className={styles.scalerNum}>{currentServings}</span>
              <button
                className={styles.scalerBtn}
                onClick={() => setServings(currentServings + 1)}
                type="button"
              >+</button>
            </div>
            <button
              className={styles.toShoppingBtn}
              onClick={() => shopping.addIngredients(
                recipe.ingredients.map(ing => ({ ...ing, amount: scaleAmount(ing.amount, scale) })),
                recipe.name,
              )}
              disabled={shopping.busy}
              type="button"
            >🛒 Do zakupów</button>
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Składniki</h2>
            <ul className={styles.ingList}>
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className={styles.ingItem}>
                  <span className={styles.ingAmount}>
                    {scaleAmount(ing.amount, scale)}{ing.unit ? ` ${ing.unit}` : ''}
                  </span>
                  <span className={styles.ingName}>{ing.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Thermomix: gotowaniem steruje urządzenie — zamiast kroków link do Cookidoo */}
        {thermomix && (
          <section className={`glass glow ${styles.tmCard}`}>
            <span className={styles.tmIcon}>🟢</span>
            <div>
              <p className={styles.tmTitle}>Gotujesz w Thermomix</p>
              <p className={styles.tmText}>Przepis prowadzi urządzenie krok po kroku. W aplikacji masz składniki do planu i listy zakupów.</p>
              {recipe.source_url && (
                <a href={recipe.source_url} target="_blank" rel="noreferrer" className={styles.tmLink}>Otwórz w Cookidoo →</a>
              )}
            </div>
          </section>
        )}

        {/* Steps */}
        {recipe.steps?.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Przygotowanie</h2>
            {recipe.steps.map((step, i) => (
              <div
                key={i}
                className={[styles.step, doneSteps.has(i) ? styles.stepDone : ''].join(' ')}
                onClick={() => toggleStep(i)}
              >
                <span className={styles.stepNum}>{step.order ?? i + 1}</span>
                <p className={styles.stepText}>{step.text}</p>
              </div>
            ))}
          </section>
        )}

        {/* Notes */}
        {recipe.notes && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Notatki</h2>
            <p className={styles.notes}>{recipe.notes}</p>
          </section>
        )}

        <div className={styles.footerMeta}>
          {recipe.created_at && <p>Dodano {new Date(recipe.created_at).toLocaleDateString('pl-PL')}</p>}
          <p>
            {recipe.last_planned_at
              ? `Ostatnio w planie: ${new Date(`${recipe.last_planned_at.slice(0, 10)}T00:00:00`).toLocaleDateString('pl-PL')}`
              : 'Jeszcze nie był w planie'}
          </p>
          {recipe.source_url && (
            <p>
              🌐 <a href={recipe.source_url} target="_blank" rel="noreferrer" className={styles.sourceLink}>
                {(() => { try { return new URL(recipe.source_url).hostname.replace(/^www\./, '') } catch { return 'źródło' } })()}
              </a>
            </p>
          )}
        </div>

        <div className={styles.spacer} />
      </div>

      {/* FAB */}
      <button className={styles.fab} onClick={() => setSheetOpen(true)}>
        + Dodaj do planu
      </button>

      {/* Add-to-plan sheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title="Dodaj do planu">
        <p className={styles.sheetLabel}>Dzień</p>
        <div className={styles.dayScroll}>
          {PLAN_DAYS.map(d => {
            const str = toDateString(d)
            return (
              <button
                key={str}
                className={[styles.dayBtn, pickedDate === str ? styles.dayBtnActive : ''].join(' ')}
                onClick={() => setPickedDate(str)}
                type="button"
              >
                <span className={styles.dayName}>{DAY_SHORT[d.getDay()]}</span>
                <span className={styles.dayNum}>{d.getDate()}</span>
              </button>
            )
          })}
        </div>

        <p className={styles.sheetLabel}>Posiłek</p>
        <div className={styles.mealBtns}>
          {MEAL_TYPES.map(mt => (
            <button
              key={mt.id}
              className={[styles.mealBtn, pickedMeal === mt.id ? styles.mealBtnActive : ''].join(' ')}
              onClick={() => setPickedMeal(mt.id)}
              type="button"
            >{mt.emoji} {mt.label}</button>
          ))}
        </div>

        <button
          className={styles.confirmBtn}
          onClick={handleAddToPlan}
          disabled={adding}
          type="button"
        >{adding ? '…' : 'Dodaj'}</button>
      </BottomSheet>

      <Toast
        message={shopping.busy ? 'Dodaję składniki do zakupów…' : shopping.toast?.message}
        warn={shopping.toast?.warn}
        actionLabel={!shopping.busy && shopping.toast && !shopping.toast.warn ? 'Zobacz listę' : null}
        onAction={() => navigate('/shopping')}
        onClose={shopping.clearToast}
        duration={shopping.busy ? 60000 : 4000}
      />
    </div>
  )
}
