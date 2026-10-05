import { useNavigate, Link } from 'react-router-dom'
import { useMealPlan } from '../../hooks/useMealPlan'
import { useMealSheets } from '../../components/MealSheets/useMealSheets'
import Toast from '../../components/Toast/Toast'
import { useAddToShopping } from '../../hooks/useAddToShopping'
import MealTile from './MealTile'
import { getWeekStart, toDateString } from '../../lib/dates'
import { MEAL_TYPES, groupMeals, slotState } from '../../lib/meals'
import styles from './TodayPage.module.css'

const weekStart = getWeekStart()
const todayStr = toDateString(new Date())

export default function TodayPage() {
  const navigate = useNavigate()
  const plan = useMealPlan(weekStart)
  const shopping = useAddToShopping()
  const sheets = useMealSheets({ plan, shopping })

  const today = groupMeals(plan.meals)[todayStr] ?? {}

  const dateLabel = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.date}>{dateLabel}</p>
          <h1 className="page-title">Dziś</h1>
        </div>
        <Link to="/settings" className={`glass ${styles.settingsBtn}`} aria-label="Ustawienia">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </header>

      {plan.loading && plan.meals.length === 0 ? (
        <div className={styles.skeletons}>
          {MEAL_TYPES.map(t => <div key={t.id} className={`glass ${styles.skeleton}`} />)}
        </div>
      ) : (
        <div className={styles.slots}>
          {MEAL_TYPES.map(mealType => {
            const state = slotState(today[mealType.id])
            const slot = { date: todayStr, mealType, state }
            return (
              <MealTile
                key={mealType.id}
                mealType={mealType}
                state={state}
                onAdd={audience => sheets.openAdd({ ...slot, audience, allowAudience: audience === 'all' })}
                onSuggest={audience => sheets.openSuggest({ ...slot, audience })}
                onOptions={(audience, meal) => sheets.openOptions({ ...slot, audience, meal })}
                onOpen={meal => meal?.recipe_id
                  ? navigate(`/recipes/${meal.recipe_id}`)
                  : sheets.openOptions({ ...slot, audience: meal?.audience ?? 'all', meal })}
              />
            )
          })}
        </div>
      )}

      {sheets.element}

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
