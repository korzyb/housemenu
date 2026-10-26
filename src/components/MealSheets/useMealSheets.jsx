import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomSheet from '../BottomSheet/BottomSheet'
import AddMealSheet from '../AddMealSheet/AddMealSheet'
import AISuggestSheet from '../AISuggestSheet/AISuggestSheet'
import { AUDIENCES, otherAudience, mealName } from '../../lib/meals'
import { importRecipeFromUrl } from '../../lib/recipeImport'
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
  const [webPick,     setWebPick]     = useState(null) // { slot, suggestion, busy?, error? }

  const title = (slot, prefix = '') => {
    const aud = slot.audience && slot.audience !== 'all' ? ` · ${AUDIENCES[slot.audience].emoji} ${AUDIENCES[slot.audience].label}` : ''
    return `${prefix}${slot.mealType.emoji} ${slot.mealType.label}${aud}${showDate ? ` · ${shortDate(slot.date)}` : ''}`
  }

  const save = (slot, fields) => plan.addMeal({ date: slot.date, mealType: slot.mealType.id, audience: slot.audience ?? 'all', ...fields })

  async function skip(slot, audience) {
    await plan.addMeal({ date: slot.date, mealType: slot.mealType.id, audience, skipped: true })
  }

  const close = setter => () => setter(null)

  // Dania zaplanowane już na ten dzień — AI ich nie powtarza
  const plannedOn = slot => plan.meals.filter(m => m.date === slot.date && !m.skipped).map(mealName).filter(Boolean)

  // Wybrana propozycja AI → do planu; danie z sieci (z linkiem) → najpierw pytanie, czy dodać do przepisów
  async function pickSuggestion(slot, suggestion) {
    if (suggestion.url && !suggestion.recipeId) { setWebPick({ slot, suggestion }); return }
    await save(slot, { recipeId: suggestion.recipeId ?? null, customName: suggestion.recipeId ? null : suggestion.name })
  }

  // ── Propozycja z sieci: import do przepisów (albo sama nazwa w planie) ──
  async function addWebPick(toRecipes) {
    const { slot, suggestion } = webPick
    if (!toRecipes) {
      setWebPick(null)
      await save(slot, { customName: suggestion.name })
      return
    }
    setWebPick(p => ({ ...p, busy: true, error: null }))
    const { recipe, error } = await importRecipeFromUrl(suggestion.url, { fallback: suggestion, mealType: slot.mealType.id })
    if (error) {
      setWebPick(p => ({ ...p, busy: false, error: `${error} Możesz dodać danie tylko do planu.` }))
      return
    }
    setWebPick(null)
    await save(slot, { recipeId: recipe.id })
  }

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
          ai={{ mealType: addSlot.mealType.id, plannedToday: plannedOn(addSlot) }}
          onPickSuggestion={async suggestion => {
            const slot = { ...addSlot, audience: addSlot.audience ?? 'all' }
            setAddSlot(null)
            await pickSuggestion(slot, suggestion)
          }}
        />
      )}

      {suggestSlot && (
        <AISuggestSheet
          isOpen
          onClose={close(setSuggestSlot)}
          mealType={suggestSlot.mealType.id}
          mealTypeLabel={title(suggestSlot).replace(/^\S+\s/, '')}
          audience={suggestSlot.audience ?? 'all'}
          plannedToday={plannedOn(suggestSlot)}
          onSelect={async suggestion => {
            const slot = suggestSlot
            setSuggestSlot(null)
            await pickSuggestion(slot, suggestion)
          }}
        />
      )}

      {/* Propozycja z sieci wybrana → dodać do moich przepisów? */}
      <BottomSheet isOpen={!!webPick} onClose={() => !webPick?.busy && setWebPick(null)} title="Dodać do Twoich przepisów?">
        {webPick && (
          <div className={styles.webPick}>
            <div className={styles.webDish}>
              {webPick.suggestion.photo_url && <img src={webPick.suggestion.photo_url} alt="" className={styles.webPhoto} />}
              <div>
                <p className={styles.webName}>{webPick.suggestion.name}</p>
                <p className={styles.webSource}>
                  przepis z <a href={webPick.suggestion.url} target="_blank" rel="noreferrer">{webPick.suggestion.source}</a>
                </p>
              </div>
            </div>
            <p className={styles.webText}>
              Dodam przepis ze składnikami, krokami i zdjęciem — będzie w bazie przepisów, na liście zakupów i w kolejnych propozycjach AI.
            </p>
            {webPick.error && <p className={styles.webError}>{webPick.error}</p>}
            <button className="btn-primary" onClick={() => addWebPick(true)} disabled={webPick.busy} type="button">
              {webPick.busy ? 'Pobieram przepis…' : 'Tak, dodaj do przepisów'}
            </button>
            <button className={`btn-glow ${styles.webSecondary}`} onClick={() => addWebPick(false)} disabled={webPick.busy} type="button">
              Nie, tylko do planu
            </button>
          </div>
        )}
      </BottomSheet>

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
