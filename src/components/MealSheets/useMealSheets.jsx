import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from '../BottomSheet/BottomSheet'
import AddMealSheet from '../AddMealSheet/AddMealSheet'
import AISuggestSheet from '../AISuggestSheet/AISuggestSheet'
import { AUDIENCES, otherAudience, mealName } from '../../lib/meals'
import styles from './MealSheets.module.css'

const shortDate = d => new Date(`${d}T00:00:00`).toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' })

// Wspólne okna slotu posiłku dla „Dziś” i „Planu”: dodawanie, sugestie AI, opcje (w tym podział kolacji).
// plan — wynik useMealPlan(); shopping — wynik useAddToShopping(); showDate — dopisuj datę w tytułach (Plan).
// Slot: { date, mealType (obiekt z MEAL_TYPES), audience, meal?, state? (slotState) }
export function useMealSheets({ plan, shopping, showDate = false }) {
  const navigate = useNavigate()
  const [addSlot,     setAddSlot]     = useState(null)
  const [suggestSlot, setSuggestSlot] = useState(null)
  const [optionsSlot, setOptionsSlot] = useState(null)

  const title = (slot, prefix = '') => {
    const aud = slot.audience && slot.audience !== 'all' ? ` · ${AUDIENCES[slot.audience].emoji} ${AUDIENCES[slot.audience].label}` : ''
    return `${prefix}${slot.mealType.emoji} ${slot.mealType.label}${aud}${showDate ? ` · ${shortDate(slot.date)}` : ''}`
  }

  const save = (slot, fields) => plan.addMeal({ date: slot.date, mealType: slot.mealType.id, audience: slot.audience ?? 'all', ...fields })

  async function skip(slot, audience) {
    await plan.addMeal({ date: slot.date, mealType: slot.mealType.id, audience, skipped: true })
  }

  const close = setter => () => setter(null)

  // ── Opcje ──
  function optionItems(slot) {
    const { meal, mealType, audience, state } = slot
    const items = []
    const other = audience !== 'all' ? otherAudience(audience) : null
    const otherRow = other ? state?.[other] : null
    const run = fn => async () => { setOptionsSlot(null); await fn() }

    if (meal?.skipped) {
      items.push({ label: `🍽 ${AUDIENCES[audience].label} jednak jedzą`, onClick: run(() => plan.removeMeal(meal.id)) })
      return items
    }
    if (meal?.recipe_id) items.push({ label: 'Otwórz przepis', onClick: run(() => navigate(`/recipes/${meal.recipe_id}`)) })
    if (meal?.recipe) items.push({ label: '🛒 Dodaj składniki do zakupów', disabled: shopping.busy, onClick: run(() => shopping.addMeals([meal], meal.recipe.name)) })
    items.push({ label: 'Zmień posiłek', onClick: run(() => setAddSlot({ ...slot, allowAudience: audience === 'all' })) })

    if (mealType.splittable) {
      if (audience === 'all') {
        items.push({ label: `${AUDIENCES.kids.emoji} ${AUDIENCES.adults.emoji} Osobno dla dzieci i dorosłych`, onClick: run(() => plan.splitMeal(slot.date, mealType.id)) })
      } else {
        items.push({ label: `${AUDIENCES.all.emoji} Wspólna kolacja (to danie dla wszystkich)`, onClick: run(() => plan.mergeMeal(slot.date, mealType.id, audience)) })
        if (otherRow?.skipped) {
          items.push({ label: `🍽 ${AUDIENCES[other].label} jednak jedzą kolację`, onClick: run(() => plan.removeMeal(otherRow.id)) })
        } else {
          items.push({ label: `💤 ${AUDIENCES[other].label} bez kolacji`, onClick: run(() => skip(slot, other)) })
        }
      }
    }
    items.push({ label: 'Usuń z planu', danger: true, onClick: run(() => plan.removeMeal(meal.id)) })
    return items
  }

  const element = (
    <>
      {addSlot && (
        <AddMealSheet
          title={title(addSlot)}
          onClose={close(setAddSlot)}
          audience={addSlot.audience ?? 'all'}
          onAudienceChange={addSlot.mealType.splittable && addSlot.allowAudience
            ? a => setAddSlot(s => ({ ...s, audience: a }))
            : undefined}
          onSkip={addSlot.mealType.splittable && !addSlot.allowAudience && addSlot.audience && addSlot.audience !== 'all'
            ? async () => { await skip(addSlot, addSlot.audience); setAddSlot(null) }
            : undefined}
          skipLabel={addSlot.audience && addSlot.audience !== 'all' ? `${AUDIENCES[addSlot.audience].label} bez kolacji` : ''}
          onPickRecipe={async recipe => { await save(addSlot, { recipeId: recipe.id }); setAddSlot(null) }}
          onAddCustom={async name => { await save(addSlot, { customName: name }); setAddSlot(null) }}
        />
      )}

      {suggestSlot && (
        <AISuggestSheet
          isOpen
          onClose={close(setSuggestSlot)}
          mealType={suggestSlot.mealType.id}
          mealTypeLabel={title(suggestSlot).replace(/^\S+\s/, '')}
          audience={suggestSlot.audience ?? 'all'}
          plannedToday={plan.meals.filter(m => m.date === suggestSlot.date && !m.skipped).map(mealName).filter(Boolean)}
          onSelect={async ({ name, recipeId }) => {
            await save(suggestSlot, { recipeId: recipeId ?? null, customName: recipeId ? null : name })
            setSuggestSlot(null)
          }}
        />
      )}

      <BottomSheet isOpen={!!optionsSlot} onClose={close(setOptionsSlot)} title={optionsSlot ? title(optionsSlot) : ''}>
        {optionsSlot && (
          <div className={styles.optionsList}>
            {optionsSlot.meal && !optionsSlot.meal.skipped && (
              <p className={styles.optionsDish}>{mealName(optionsSlot.meal)}</p>
            )}
            {optionItems(optionsSlot).map(it => (
              <button
                key={it.label}
                className={`${styles.optionItem} ${it.danger ? styles.optionDanger : ''}`}
                onClick={it.onClick}
                disabled={it.disabled}
                type="button"
              >{it.label}</button>
            ))}
          </div>
        )}
      </BottomSheet>
    </>
  )

  return {
    openAdd: slot => setAddSlot({ allowAudience: true, audience: 'all', ...slot }),
    openSuggest: slot => setSuggestSlot({ audience: 'all', ...slot }),
    openOptions: slot => setOptionsSlot(slot),
    element,
  }
}
