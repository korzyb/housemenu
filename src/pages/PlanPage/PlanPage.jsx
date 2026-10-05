import { useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMealPlan } from '../../hooks/useMealPlan'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import { useMealSheets } from '../../components/MealSheets/useMealSheets'
import Toast from '../../components/Toast/Toast'
import { useAddToShopping } from '../../hooks/useAddToShopping'
import PlanCell from './PlanCell'
import { getWeekStart, toDateString, getWeekRange } from '../../lib/dates'
import { MEAL_TYPES, AUDIENCES, groupMeals, slotState, eatenMeals, mealName } from '../../lib/meals'
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
  const [daySheet, setDaySheet]       = useState(null) // { date, label } — zakupy na dzień
  const shopping = useAddToShopping()
  const touchStartX = useRef(null)

  const displayWeekStart = new Date(BASE_WEEK_START)
  displayWeekStart.setDate(BASE_WEEK_START.getDate() + weekOffset * 7)

  const plan = useMealPlan(displayWeekStart)
  const { meals, loading } = plan
  const sheets = useMealSheets({ plan, shopping, showDate: true })
  const weekDays = getWeekDays(displayWeekStart)
  const isPast = weekOffset < 0

  const mealMap = groupMeals(meals)

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
                  const state = slotState(mealMap[dateStr]?.[mealType.id])
                  const slot = { date: dateStr, mealType, state }
                  return (
                    <PlanCell
                      key={mealType.id}
                      mealType={mealType}
                      state={state}
                      wide={!!mealType.splittable}
                      isToday={isToday}
                      isPast={isPast}
                      onSlot={(audience, meal) => meal
                        ? sheets.openOptions({ ...slot, audience, meal })
                        : sheets.openAdd({ ...slot, audience, allowAudience: audience === 'all' })}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {sheets.element}

      {/* Bottom sheet: zakupy na wybrany dzień (tap w skrót dnia) */}
      <BottomSheet
        isOpen={!!daySheet}
        onClose={() => setDaySheet(null)}
        title={daySheet ? `🛒 Zakupy · ${new Date(`${daySheet.date}T00:00:00`).toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}
      >
        {daySheet && (() => {
          const dayMeals = MEAL_TYPES.flatMap(t => eatenMeals(mealMap[daySheet.date]?.[t.id] ?? [])
            .map(meal => ({ type: t, meal })))
          const withRecipe = dayMeals.filter(x => x.meal.recipe)
          return (
            <div className={styles.dayShop}>
              {dayMeals.length === 0 && <p className={styles.dayShopEmpty}>Na ten dzień nic nie jest zaplanowane.</p>}
              {dayMeals.map(({ type, meal }) => (
                <div key={meal.id} className={styles.dayShopRow}>
                  <span className={styles.dayShopMeal}>{type.emoji} {type.label}{meal.audience && meal.audience !== 'all' ? ` ${AUDIENCES[meal.audience].emoji}` : ''}</span>
                  <span className={styles.dayShopName}>{mealName(meal)}</span>
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
