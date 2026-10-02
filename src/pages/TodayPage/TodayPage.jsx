import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMealPlan } from '../../hooks/useMealPlan'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import AISuggestSheet from '../../components/AISuggestSheet/AISuggestSheet'
import AddMealSheet from '../../components/AddMealSheet/AddMealSheet'
import Toast from '../../components/Toast/Toast'
import { useAddToShopping } from '../../hooks/useAddToShopping'
import MealTile from './MealTile'
import { getWeekStart, toDateString } from '../../lib/dates'
import { MEAL_TYPES } from '../../lib/meals'
import styles from './TodayPage.module.css'

const weekStart = getWeekStart()
const todayStr = toDateString(new Date())

export default function TodayPage() {
  const navigate = useNavigate()
  const { meals, loading, addMeal, removeMeal } = useMealPlan(weekStart)
  const shopping = useAddToShopping()

  const [addSheet,     setAddSheet]     = useState(null) // { mealTypeId, prefill } | null
  const [optionsSheet, setOptionsSheet] = useState(null) // { meal, mealType } | null
  const [suggestSheet, setSuggestSheet] = useState(null) // { mealTypeId } | null

  const mealMap = Object.fromEntries(
    meals.filter(m => m.date === todayStr).map(m => [m.meal_type, m])
  )

  const dateLabel = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  function openAdd(mealTypeId, prefill = '') {
    setAddSheet({ mealTypeId, prefill })
  }

  async function addToSlot(mealTypeId, { recipeId = null, customName = null }) {
    await addMeal({ date: todayStr, mealType: mealTypeId, recipeId, customName })
    setAddSheet(null)
  }

  async function handleRemoveMeal() {
    await removeMeal(optionsSheet.meal.id)
    setOptionsSheet(null)
  }

  const addSheetMealType = MEAL_TYPES.find(t => t.id === addSheet?.mealTypeId)
  const optionHasRecipe = !!optionsSheet?.meal?.recipe_id

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

      {loading ? (
        <div className={styles.skeletons}>
          {[0, 1, 2, 3].map(i => <div key={i} className={`glass ${styles.skeleton}`} />)}
        </div>
      ) : (
        <div className={styles.slots}>
          {MEAL_TYPES.map(mealType => (
            <MealTile
              key={mealType.id}
              mealType={mealType}
              meal={mealMap[mealType.id] ?? null}
              onAdd={() => openAdd(mealType.id)}
              onSuggest={() => setSuggestSheet({ mealTypeId: mealType.id })}
              onOptions={() => setOptionsSheet({ meal: mealMap[mealType.id], mealType })}
              onOpenRecipe={() => {
                const m = mealMap[mealType.id]
                if (m?.recipe_id) navigate(`/recipes/${m.recipe_id}`)
              }}
            />
          ))}
        </div>
      )}

      {/* Bottom sheet: dodaj posiłek */}
      {addSheet && (
        <AddMealSheet
          title={`${addSheetMealType?.emoji ?? ''} ${addSheetMealType?.label ?? ''}`}
          initialValue={addSheet.prefill}
          onClose={() => setAddSheet(null)}
          onPickRecipe={recipe => addToSlot(addSheet.mealTypeId, { recipeId: recipe.id })}
          onAddCustom={name => addToSlot(addSheet.mealTypeId, { customName: name })}
        />
      )}

      {/* Bottom sheet: sugestie AI */}
      {suggestSheet && (
        <AISuggestSheet
          isOpen={!!suggestSheet}
          onClose={() => setSuggestSheet(null)}
          mealType={suggestSheet.mealTypeId}
          mealTypeLabel={MEAL_TYPES.find(t => t.id === suggestSheet.mealTypeId)?.label ?? ''}
          plannedToday={meals.filter(m => m.date === todayStr).map(m => m.recipe?.name || m.custom_name).filter(Boolean)}
          onSelect={async ({ name, recipeId }) => {
            // Propozycja z bazy → przypisz przepis (zdjęcie, link do przepisu); inaczej sama nazwa
            await addMeal({
              date: todayStr,
              mealType: suggestSheet.mealTypeId,
              recipeId: recipeId ?? null,
              customName: recipeId ? null : name,
            })
            setSuggestSheet(null)
          }}
        />
      )}

      {/* Bottom sheet: opcje wypełnionego kafelka */}
      <BottomSheet isOpen={!!optionsSheet} onClose={() => setOptionsSheet(null)}>
        <div className={styles.optionsList}>
          {optionHasRecipe && (
            <button className={styles.optionItem} onClick={() => {
              navigate(`/recipes/${optionsSheet.meal.recipe_id}`)
              setOptionsSheet(null)
            }}>
              Otwórz przepis
            </button>
          )}
          {optionHasRecipe && (
            <button className={styles.optionItem} disabled={shopping.busy} onClick={async () => {
              const { meal } = optionsSheet
              setOptionsSheet(null)
              await shopping.addMeals([meal], meal.recipe?.name)
            }}>
              🛒 Dodaj składniki do zakupów
            </button>
          )}
          <button className={styles.optionItem} onClick={() => {
            const { mealType } = optionsSheet
            setOptionsSheet(null)
            openAdd(mealType.id)
          }}>
            Zmień posiłek
          </button>
          <button className={`${styles.optionItem} ${styles.optionDanger}`} onClick={handleRemoveMeal}>
            Usuń z planu
          </button>
        </div>
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
