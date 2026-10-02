import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMealPlan } from '../../hooks/useMealPlan'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import AddMealSheet from '../../components/AddMealSheet/AddMealSheet'
import Toast from '../../components/Toast/Toast'
import { useAddToShopping } from '../../hooks/useAddToShopping'
import PlanCell from './PlanCell'
import { getWeekStart, toDateString, getWeekRange } from '../../lib/dates'
import { MEAL_TYPES } from '../../lib/meals'
import styles from './PlanPage.module.css'

const BASE_WEEK_START = getWeekStart()
const TODAY_STR = toDateString(new Date())
const DAY_LABELS = ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

// Tydzień z ?week=RRRR-MM-DD (np. powrót z kreatora AI) → przesunięcie względem bieżącego, -1 … +2
function initialOffset(param) {
  if (!param) return 0
  const start = getWeekStart(new Date(`${param}T00:00:00`))
  const weeks = Math.round((start - BASE_WEEK_START) / (7 * 24 * 60 * 60 * 1000))
  return Math.min(2, Math.max(-1, weeks))
}

export default function PlanPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [weekOffset, setWeekOffset] = useState(() => initialOffset(params.get('week')))   // -1 … +2
  const [addSheet, setAddSheet]       = useState(null) // { date, mealTypeId, prefill }
  const [optionsSheet, setOptionsSheet] = useState(null) // { meal, date, mealTypeId }
  const [daySheet, setDaySheet]       = useState(null) // { date, label } — zakupy na dzień
  const shopping = useAddToShopping()
  const touchStartX = useRef(null)

  const displayWeekStart = new Date(BASE_WEEK_START)
  displayWeekStart.setDate(BASE_WEEK_START.getDate() + weekOffset * 7)

  const { meals, loading, addMeal, removeMeal } = useMealPlan(displayWeekStart)
  const weekDays = getWeekDays(displayWeekStart)
  const isPast = weekOffset < 0

  const mealMap = {}
  meals.forEach(m => {
    if (!mealMap[m.date]) mealMap[m.date] = {}
    mealMap[m.date][m.meal_type] = m
  })

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 50) {
      if (delta > 0 && weekOffset < 2)  setWeekOffset(o => o + 1)
      if (delta < 0 && weekOffset > -1) setWeekOffset(o => o - 1)
    }
    touchStartX.current = null
  }

  function openAdd(date, mealTypeId, prefill = '') {
    setAddSheet({ date, mealTypeId, prefill })
  }

  async function addToSlot({ recipeId = null, customName = null }) {
    await addMeal({ date: addSheet.date, mealType: addSheet.mealTypeId, recipeId, customName })
    setAddSheet(null)
  }

  async function handleRemove() {
    await removeMeal(optionsSheet.meal.id)
    setOptionsSheet(null)
  }

  const addMealType = MEAL_TYPES.find(t => t.id === addSheet?.mealTypeId)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.weekNav}>
          <button
            className={styles.navArrow}
            onClick={() => setWeekOffset(o => o - 1)}
            disabled={weekOffset <= -1}
            aria-label="Poprzedni tydzień"
          >‹</button>
          <span className={styles.weekRange}>{getWeekRange(displayWeekStart)}</span>
          <button
            className={styles.navArrow}
            onClick={() => setWeekOffset(o => o + 1)}
            disabled={weekOffset >= 2}
            aria-label="Następny tydzień"
          >›</button>
        </div>
        <button
          className={`btn-glow ${styles.aiBtn}`}
          onClick={() => navigate(`/plan/ai?week=${toDateString(displayWeekStart)}`)}
          disabled={isPast}
          type="button"
        >Zaplanuj z AI ✨</button>
      </header>

      <div
        className={styles.gridWrapper}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Nagłówki kolumn — statyczne */}
        <div className={styles.headerRow}>
          <div className={styles.cornerCell} />
          {MEAL_TYPES.map(mt => (
            <div key={mt.id} className={styles.colHeader}>{mt.label}</div>
          ))}
        </div>

        {/* Wiersze dni — animowane przy zmianie tygodnia */}
        <div
          key={weekOffset}
          className={[styles.grid, loading ? styles.dimmed : ''].join(' ')}
        >
          {weekDays.map((day, i) => {
            const dateStr = toDateString(day)
            const isToday = weekOffset === 0 && dateStr === TODAY_STR
            return (
              <div
                key={dateStr}
                className={[styles.row, isToday ? styles.todayRow : ''].join(' ')}
              >
                <button
                  className={[styles.rowHeader, isToday ? styles.todayHeader : ''].join(' ')}
                  onClick={() => !isPast && setDaySheet({ date: dateStr, label: DAY_LABELS[i] })}
                  disabled={isPast}
                  type="button"
                  aria-label={`Zakupy na ${DAY_LABELS[i]}`}
                >
                  {DAY_LABELS[i]}
                </button>
                {MEAL_TYPES.map(mealType => {
                  const meal = mealMap[dateStr]?.[mealType.id] ?? null
                  return (
                    <PlanCell
                      key={mealType.id}
                      meal={meal}
                      mealType={mealType}
                      isToday={isToday}
                      isPast={isPast}
                      onClick={() => {
                        if (meal) {
                          setOptionsSheet({ meal, date: dateStr, mealTypeId: mealType.id })
                        } else {
                          openAdd(dateStr, mealType.id)
                        }
                      }}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom sheet: dodaj posiłek */}
      {addSheet && (
        <AddMealSheet
          title={`${addMealType?.emoji ?? ''} ${addMealType?.label ?? ''} · ${
            new Date(`${addSheet.date}T00:00:00`).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })
          }`}
          initialValue={addSheet.prefill}
          onClose={() => setAddSheet(null)}
          onPickRecipe={recipe => addToSlot({ recipeId: recipe.id })}
          onAddCustom={name => addToSlot({ customName: name })}
        />
      )}

      {/* Bottom sheet: opcje */}
      <BottomSheet isOpen={!!optionsSheet} onClose={() => setOptionsSheet(null)}>
        <div className={styles.optionsList}>
          {optionsSheet?.meal?.recipe_id && (
            <button className={styles.optionItem} onClick={() => {
              navigate(`/recipes/${optionsSheet.meal.recipe_id}`)
              setOptionsSheet(null)
            }}>Otwórz przepis</button>
          )}
          {optionsSheet?.meal?.recipe && (
            <button className={styles.optionItem} disabled={shopping.busy} onClick={async () => {
              const { meal } = optionsSheet
              setOptionsSheet(null)
              await shopping.addMeals([meal], meal.recipe.name)
            }}>🛒 Dodaj składniki do zakupów</button>
          )}
          <button className={styles.optionItem} onClick={() => {
            const { date, mealTypeId } = optionsSheet
            setOptionsSheet(null)
            openAdd(date, mealTypeId)
          }}>Zmień posiłek</button>
          <button
            className={[styles.optionItem, styles.optionDanger].join(' ')}
            onClick={handleRemove}
          >Usuń z planu</button>
        </div>
      </BottomSheet>

      {/* Bottom sheet: zakupy na wybrany dzień (tap w skrót dnia) */}
      <BottomSheet
        isOpen={!!daySheet}
        onClose={() => setDaySheet(null)}
        title={daySheet ? `🛒 Zakupy · ${new Date(`${daySheet.date}T00:00:00`).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}
      >
        {daySheet && (() => {
          const dayMeals = MEAL_TYPES.map(t => ({ type: t, meal: mealMap[daySheet.date]?.[t.id] })).filter(x => x.meal)
          const withRecipe = dayMeals.filter(x => x.meal.recipe)
          return (
            <div className={styles.dayShop}>
              {dayMeals.length === 0 && <p className={styles.dayShopEmpty}>Na ten dzień nic nie jest zaplanowane.</p>}
              {dayMeals.map(({ type, meal }) => (
                <div key={type.id} className={styles.dayShopRow}>
                  <span className={styles.dayShopMeal}>{type.emoji} {type.label}</span>
                  <span className={styles.dayShopName}>{meal.recipe?.name || meal.custom_name}</span>
                  <span className={styles.dayShopNote}>
                    {meal.recipe ? `${meal.recipe.ingredients?.length ?? 0} skł.` : 'bez przepisu'}
                  </span>
                </div>
              ))}
              {dayMeals.length > 0 && (
                <button
                  className="btn-primary"
                  disabled={!withRecipe.length || shopping.busy}
                  onClick={async () => {
                    setDaySheet(null)
                    await shopping.addMeals(dayMeals.map(x => x.meal))
                  }}
                  type="button"
                >
                  {withRecipe.length
                    ? `Dodaj składniki do zakupów (${withRecipe.length} ${withRecipe.length === 1 ? 'przepis' : withRecipe.length < 5 ? 'przepisy' : 'przepisów'})`
                    : 'Brak przepisów ze składnikami'}
                </button>
              )}
            </div>
          )
        })()}
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
