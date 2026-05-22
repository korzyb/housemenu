import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMealPlan } from '../../hooks/useMealPlan'
import BottomSheet from '../../components/BottomSheet/BottomSheet'
import PlanCell from './PlanCell'
import { getWeekStart, toDateString, getWeekRange } from '../../lib/dates'
import { MEAL_TYPES } from '../../lib/meals'
import styles from './PlanPage.module.css'

const BASE_WEEK_START = getWeekStart()
const TODAY_STR = toDateString(new Date())
const DAY_LABELS = ['Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const MEAL_COL_LABELS = ['Śn', 'Prz', 'Ob', 'Ko']

function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

export default function PlanPage() {
  const navigate = useNavigate()
  const [weekOffset, setWeekOffset] = useState(0)   // -1 … +2
  const [addSheet, setAddSheet]       = useState(null) // { date, mealTypeId }
  const [optionsSheet, setOptionsSheet] = useState(null) // { meal, date, mealTypeId }
  const [inputValue, setInputValue]   = useState('')
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
    setInputValue(prefill)
    setAddSheet({ date, mealTypeId })
  }

  function closeAdd() { setAddSheet(null); setInputValue('') }

  async function handleAddMeal() {
    if (!inputValue.trim()) return
    await addMeal({ date: addSheet.date, mealType: addSheet.mealTypeId, customName: inputValue.trim() })
    closeAdd()
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
        <button className={styles.aiBtn}>Zaplanuj z AI ✨</button>
      </header>

      <div
        className={styles.gridWrapper}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Nagłówki kolumn — statyczne */}
        <div className={styles.headerRow}>
          <div className={styles.cornerCell} />
          {MEAL_COL_LABELS.map(label => (
            <div key={label} className={styles.colHeader}>{label}</div>
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
                <div className={[styles.rowHeader, isToday ? styles.todayHeader : ''].join(' ')}>
                  {DAY_LABELS[i]}
                </div>
                {MEAL_TYPES.map(mealType => {
                  const meal = mealMap[dateStr]?.[mealType.id] ?? null
                  return (
                    <PlanCell
                      key={mealType.id}
                      meal={meal}
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
      <BottomSheet
        isOpen={!!addSheet}
        onClose={closeAdd}
        title={addMealType ? `${addMealType.emoji}  ${addMealType.label}` : ''}
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

      {/* Bottom sheet: opcje */}
      <BottomSheet isOpen={!!optionsSheet} onClose={() => setOptionsSheet(null)}>
        <div className={styles.optionsList}>
          {optionsSheet?.meal?.recipe_id && (
            <button className={styles.optionItem} onClick={() => {
              navigate(`/recipes/${optionsSheet.meal.recipe_id}`)
              setOptionsSheet(null)
            }}>Otwórz przepis</button>
          )}
          <button className={styles.optionItem} onClick={() => {
            const { meal, date, mealTypeId } = optionsSheet
            setOptionsSheet(null)
            openAdd(date, mealTypeId, meal.custom_name || meal.recipe?.name || '')
          }}>Zmień posiłek</button>
          <button
            className={[styles.optionItem, styles.optionDanger].join(' ')}
            onClick={handleRemove}
          >Usuń z planu</button>
        </div>
      </BottomSheet>
    </div>
  )
}
