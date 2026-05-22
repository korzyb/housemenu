import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMealPlan } from '../../hooks/useMealPlan'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import AISuggestSheet from '../../components/AISuggestSheet/AISuggestSheet'
import MealTile from './MealTile'
import { getWeekStart, toDateString } from '../../lib/dates'
import { MEAL_TYPES } from '../../lib/meals'
import styles from './TodayPage.module.css'

const weekStart = getWeekStart()
const todayStr = toDateString(new Date())

export default function TodayPage() {
  const navigate = useNavigate()
  const { meals, loading, addMeal, removeMeal } = useMealPlan(weekStart)

  const [addSheet,     setAddSheet]     = useState(null) // { mealTypeId } | null
  const [optionsSheet, setOptionsSheet] = useState(null) // { meal, mealType } | null
  const [suggestSheet, setSuggestSheet] = useState(null) // { mealTypeId } | null
  const [inputValue,   setInputValue]   = useState('')

  const mealMap = Object.fromEntries(
    meals.filter(m => m.date === todayStr).map(m => [m.meal_type, m])
  )

  const dateLabel = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  function openAdd(mealTypeId, prefill = '') {
    setInputValue(prefill)
    setAddSheet({ mealTypeId })
  }

  function closeAdd() {
    setAddSheet(null)
    setInputValue('')
  }

  async function handleAddMeal() {
    if (!inputValue.trim()) return
    await addMeal({ date: todayStr, mealType: addSheet.mealTypeId, customName: inputValue.trim() })
    closeAdd()
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
        <p className={styles.date}>{dateLabel}</p>
        <h1 className={styles.title}>Dziś</h1>
      </header>

      {loading ? (
        <div className={styles.skeletons}>
          {[0, 1, 2, 3].map(i => <div key={i} className={styles.skeleton} />)}
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
      <BottomSheet
        isOpen={!!addSheet}
        onClose={closeAdd}
        title={`Dodaj — ${addSheetMealType?.label ?? ''}`}
      >
        <div className={styles.addForm}>
          <input
            className={styles.addInput}
            placeholder="Nazwa posiłku, np. Kanapki…"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddMeal()}
            autoFocus
          />
          <button
            className={styles.addSubmitBtn}
            onClick={handleAddMeal}
            disabled={!inputValue.trim()}
          >
            Dodaj
          </button>
          <button
            className={styles.recipesLink}
            onClick={() => { closeAdd(); navigate('/recipes') }}
          >
            Wybierz z przepisów →
          </button>
        </div>
      </BottomSheet>

      {/* Bottom sheet: sugestie AI */}
      {suggestSheet && (
        <AISuggestSheet
          isOpen={!!suggestSheet}
          onClose={() => setSuggestSheet(null)}
          mealType={suggestSheet.mealTypeId}
          mealTypeLabel={MEAL_TYPES.find(t => t.id === suggestSheet.mealTypeId)?.label ?? ''}
          plannedToday={meals.filter(m => m.date === todayStr).map(m => m.recipe?.name || m.custom_name).filter(Boolean)}
          onSelect={async (name) => {
            await addMeal({ date: todayStr, mealType: suggestSheet.mealTypeId, customName: name })
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
          <button className={styles.optionItem} onClick={() => {
            const { meal, mealType } = optionsSheet
            setOptionsSheet(null)
            openAdd(mealType.id, meal.custom_name || meal.recipe?.name || '')
          }}>
            Zmień posiłek
          </button>
          <button className={`${styles.optionItem} ${styles.optionDanger}`} onClick={handleRemoveMeal}>
            Usuń z planu
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
