import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { invokeAi } from '../../lib/ai'
import { useMealPlan } from '../../hooks/useMealPlan'
import { getWeekStart, toDateString, getWeekRange } from '../../lib/dates'
import { MEAL_TYPES } from '../../lib/meals'
import { parseProfileCard } from '../../lib/profile'
import styles from './PlanWizardPage.module.css'

const TOTAL_STEPS = 4

// Krok 2 — preferencje (doc/design-guide.md → sekcja 9)
const PREFERENCE_GROUPS = [
  { title: 'Dieta', options: ['Wegetariańskie', 'Wegańskie', 'Bez glutenu', 'Bez laktozy', 'Bez mięsa czerwonego', 'Bez ryb'] },
  { title: 'Czas', options: ['Błyskawiczne (do 15 min)', 'Szybkie (15–30 min)', 'Spokojne (ponad 30 min)', 'Bez gotowania'] },
  { title: 'Charakter', options: ['Na ciepło', 'Na zimno', 'Lekkie', 'Syte', 'Zupa', 'Sałatka', 'Jednogarnkowe', 'Coś słodkiego'] },
  { title: 'Dla kogo', options: ['Dla dzieci', 'Dla całej rodziny'] },
  { title: 'Kuchnia', options: ['Polska', 'Włoska', 'Azjatycka', 'Meksykańska', 'Śródziemnomorska'] },
  { title: 'Inne', options: ['Coś nowego (nie gotowałem ostatnio)', 'Sezonowe', 'Z resztek'] },
]

const SCOPES = [
  { id: 'meal', label: 'Jeden posiłek', emoji: '🍽' },
  { id: 'day',  label: 'Cały dzień',    emoji: '☀️' },
  { id: 'week', label: 'Cały tydzień',  emoji: '📅' },
]

const DAY_NAMES = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
const DAY_SHORT = ['Nd', 'Pn', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob']
const TODAY_STR = toDateString(new Date())
// 'RRRR-MM-DD' → data lokalna (new Date('RRRR-MM-DD') to północ UTC)
const parseDay = s => new Date(`${s}T00:00:00`)

const mealLabel = id => MEAL_TYPES.find(t => t.id === id)?.label ?? id
const mealEmoji = id => MEAL_TYPES.find(t => t.id === id)?.emoji ?? '🍽'

function dayTitle(dateStr) {
  const d = parseDay(dateStr)
  const name = DAY_NAMES[d.getDay()]
  return `${name[0].toUpperCase()}${name.slice(1)}, ${d.getDate()} ${d.toLocaleDateString('pl-PL', { month: 'short' }).replace('.', '')}`
}

function mealsCountLabel(n) {
  if (n === 1) return '1 posiłek'
  if (n >= 2 && n <= 4) return `${n} posiłki`
  return `${n} posiłków`
}

export default function PlanWizardPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const weekStart = useMemo(() => getWeekStart(params.get('week') ? parseDay(params.get('week')) : new Date()), [params])
  const weekStartStr = toDateString(weekStart)
  const { meals, addMeals } = useMealPlan(weekStart)

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return toDateString(d)
  }), [weekStart])
  const futureDays = weekDays.filter(d => d >= TODAY_STR)

  // Kroki 1–3
  const [step,        setStep]        = useState(1)
  const [pantry,      setPantry]      = useState('')
  const [prefs,       setPrefs]       = useState(() => new Set())
  const [notes,       setNotes]       = useState('')
  const [scope,       setScope]       = useState('day')
  const [day,         setDay]         = useState(futureDays[0] ?? weekDays[0])
  const [mealTypes,   setMealTypes]   = useState(['breakfast', 'lunch', 'dinner'])
  const [overwrite,   setOverwrite]   = useState(false)

  // Krok 4
  const [proposal,    setProposal]    = useState([])   // [{ date, mealType, options, idx }]
  const [tip,         setTip]         = useState('')
  const [generating,  setGenerating]  = useState(false)
  const [correcting,  setCorrecting]  = useState(false)
  const [aiError,     setAiError]     = useState(null)
  const [instruction, setInstruction] = useState('')
  const [saving,      setSaving]      = useState(false)

  // Kontekst dla AI: przepisy, domownicy, ostatnio jedzone
  const [context, setContext] = useState({ recipes: [], household: [], recentMeals: [] })
  useEffect(() => {
    const since = new Date(weekStart)
    since.setDate(since.getDate() - 14)
    Promise.all([
      supabase.from('recipes').select('id, name, tags, prep_time, photo_url').order('name'),
      supabase.from('household_members').select('name, ai_profile_card').eq('is_active', true),
      supabase.from('meal_plans').select('custom_name, recipe:recipes(name)')
        .gte('date', toDateString(since)).lt('date', weekStartStr),
    ]).then(([rec, mem, recent]) => {
      setContext({
        recipes: rec.data || [],
        household: (mem.data || [])
          .map(m => ({ name: m.name, brief: parseProfileCard(m.ai_profile_card)?.planner_brief }))
          .filter(m => m.brief),
        recentMeals: [...new Set((recent.data || []).map(m => m.recipe?.name || m.custom_name).filter(Boolean))],
      })
    })
  }, [weekStart, weekStartStr])

  const recipesByName = useMemo(
    () => new Map(context.recipes.map(r => [r.name.trim().toLowerCase(), r])),
    [context.recipes]
  )

  const plannedMap = useMemo(() => {
    const map = {}
    for (const m of meals) map[`${m.date}|${m.meal_type}`] = m.recipe?.name || m.custom_name
    return map
  }, [meals])

  // Pory do zaplanowania wg zakresu
  const slots = useMemo(() => {
    const days = scope === 'week' ? futureDays : [day]
    const types = scope === 'meal' ? mealTypes.slice(0, 1) : mealTypes
    const all = days.flatMap(date => MEAL_TYPES
      .filter(t => types.includes(t.id))
      .map(t => ({ date, mealType: t.id })))
    return overwrite ? all : all.filter(s => !plannedMap[`${s.date}|${s.mealType}`])
  }, [scope, day, futureDays, mealTypes, overwrite, plannedMap])

  const skippedCount = useMemo(() => {
    const days = scope === 'week' ? futureDays : [day]
    const types = scope === 'meal' ? mealTypes.slice(0, 1) : mealTypes
    return days.flatMap(date => types.map(t => `${date}|${t}`)).filter(k => plannedMap[k]).length
  }, [scope, day, futureDays, mealTypes, plannedMap])

  function togglePref(p) {
    setPrefs(prev => {
      const next = new Set(prev)
      next.has(p) ? next.delete(p) : next.add(p)
      return next
    })
  }

  function toggleMealType(id) {
    if (scope === 'meal') { setMealTypes([id]); return }
    setMealTypes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function chooseScope(id) {
    setScope(id)
    if (id === 'meal') setMealTypes(prev => [prev[0] ?? 'lunch'])
    else if (mealTypes.length < 2) setMealTypes(['breakfast', 'lunch', 'dinner'])
  }

  function requestBody(extra = {}) {
    const slotsWithLabels = slots.map(s => ({ ...s, dayLabel: DAY_NAMES[parseDay(s.date).getDay()] }))
    const slotKeys = new Set(slots.map(s => `${s.date}|${s.mealType}`))
    return {
      slots: slotsWithLabels,
      recipes: context.recipes.map(r => ({ name: r.name, tags: r.tags, prep_time: r.prep_time })),
      household: context.household,
      recentMeals: context.recentMeals,
      existingPlan: meals
        .filter(m => !slotKeys.has(`${m.date}|${m.meal_type}`))
        .map(m => ({ date: m.date, mealType: m.meal_type, name: m.recipe?.name || m.custom_name })),
      pantry,
      preferences: [...prefs],
      notes,
      ...extra,
    }
  }

  async function generate() {
    setStep(4)
    setGenerating(true)
    setAiError(null)
    const { data, error } = await invokeAi('plan-meals', requestBody())
    setGenerating(false)
    if (error) { setAiError(error); return }
    setProposal(data.plan.map(p => ({ ...p, idx: 0 })))
    setTip(data.tip || '')
  }

  async function correct() {
    const text = instruction.trim()
    if (!text || correcting) return
    setCorrecting(true)
    setAiError(null)
    const currentPlan = proposal
      .filter(p => p.options.length)
      .map(p => ({ date: p.date, mealType: p.mealType, name: p.options[p.idx].name }))
    const { data, error } = await invokeAi('plan-meals', requestBody({ currentPlan, instruction: text }))
    setCorrecting(false)
    if (error) { setAiError(error); return }
    setProposal(data.plan.map(p => ({ ...p, idx: 0 })))
    if (data.tip) setTip(data.tip)
    setInstruction('')
  }

  function cycle(i, dir) {
    setProposal(prev => prev.map((p, j) => j !== i || !p.options.length
      ? p
      : { ...p, idx: (p.idx + dir + p.options.length) % p.options.length }))
  }

  async function save() {
    setSaving(true)
    const rows = proposal
      .filter(p => p.options.length)
      .map(p => {
        const opt = p.options[p.idx]
        const recipe = recipesByName.get(opt.name.trim().toLowerCase())
        return { date: p.date, mealType: p.mealType, recipeId: recipe?.id, customName: recipe ? null : opt.name }
      })
    const { error } = await addMeals(rows)
    setSaving(false)
    if (error) { setAiError('Nie udało się zapisać planu. Spróbuj ponownie.'); return }
    navigate(`/plan?week=${weekStartStr}`)
  }

  function back() {
    if (step === 1) navigate(`/plan?week=${weekStartStr}`)
    else setStep(step === 4 ? 3 : step - 1)
  }

  // Swipe na kafelku propozycji
  const touchX = useRef(null)

  const proposalDays = useMemo(() => {
    const groups = []
    proposal.forEach((p, i) => {
      let g = groups.find(x => x.date === p.date)
      if (!g) { g = { date: p.date, items: [] }; groups.push(g) }
      g.items.push({ ...p, i })
    })
    return groups
  }, [proposal])

  return (
    <div className={styles.page}>
      <header className={styles.topBar}>
        <button className={styles.backLink} onClick={back} type="button">‹ Powrót</button>
        <span className={styles.topTitle}>Zaplanuj z AI</span>
        <span className={styles.stepCount}>Krok {step}/{TOTAL_STEPS}</span>
      </header>

      {/* ── Krok 1: składniki ─────────────────────── */}
      {step === 1 && (
        <section className={styles.body}>
          <h1 className={styles.stepTitle}>Co masz w domu?</h1>
          <p className={styles.stepSub}>Składniki, które chcesz wykorzystać — AI ułoży wokół nich posiłki. Możesz pominąć.</p>
          <textarea
            className={`glass-input ${styles.bigInput}`}
            placeholder="np. jajka, makaron, pomidory, pół dyni…"
            value={pantry}
            onChange={e => setPantry(e.target.value)}
            rows={5}
          />
          <div className={styles.actions}>
            <button className={`btn-glow ${styles.secondary}`} onClick={() => { setPantry(''); setStep(2) }} type="button">Pomiń</button>
            <button className={`btn-primary ${styles.primary}`} onClick={() => setStep(2)} type="button">Dalej</button>
          </div>
        </section>
      )}

      {/* ── Krok 2: preferencje ───────────────────── */}
      {step === 2 && (
        <section className={styles.body}>
          <h1 className={styles.stepTitle}>Preferencje</h1>
          <p className={styles.stepSub}>
            Zaznacz, na co masz ochotę. {context.household.length > 0
              ? `Profile domowników (${context.household.map(h => h.name).join(', ')}) AI uwzględni automatycznie.`
              : 'Możesz pominąć.'}
          </p>
          {PREFERENCE_GROUPS.map(g => (
            <div key={g.title} className={styles.prefGroup}>
              <p className={styles.groupLabel}>{g.title}</p>
              <div className={styles.chips}>
                {g.options.map(o => (
                  <button
                    key={o}
                    className={`${styles.chip} ${prefs.has(o) ? styles.chipOn : ''}`}
                    onClick={() => togglePref(o)}
                    type="button"
                  >{o}</button>
                ))}
              </div>
            </div>
          ))}
          <textarea
            className={`glass-input ${styles.notesInput}`}
            placeholder="Coś jeszcze? Wpisz własne wymagania…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
          />
          <div className={styles.actions}>
            <button className={`btn-primary ${styles.primary}`} onClick={() => setStep(3)} type="button">Dalej</button>
          </div>
        </section>
      )}

      {/* ── Krok 3: zakres ────────────────────────── */}
      {step === 3 && (
        <section className={styles.body}>
          <h1 className={styles.stepTitle}>Zakres</h1>
          <p className={styles.stepSub}>Tydzień {getWeekRange(weekStart)}</p>

          <div className={styles.scopes}>
            {SCOPES.map(s => (
              <button
                key={s.id}
                className={`glass ${scope === s.id ? 'glow' : ''} ${styles.scopeBtn} ${scope === s.id ? styles.scopeOn : ''}`}
                onClick={() => chooseScope(s.id)}
                type="button"
              >
                <span className={styles.scopeEmoji}>{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          {scope !== 'week' && (
            <>
              <p className={styles.groupLabel}>Dzień</p>
              <div className={styles.dayRow}>
                {weekDays.map(d => {
                  const date = parseDay(d)
                  const past = d < TODAY_STR
                  return (
                    <button
                      key={d}
                      className={`${styles.dayBtn} ${day === d ? styles.dayOn : ''}`}
                      onClick={() => setDay(d)}
                      disabled={past}
                      type="button"
                    >
                      <span className={styles.dayShort}>{DAY_SHORT[date.getDay()]}</span>
                      <span className={styles.dayNum}>{date.getDate()}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <p className={styles.groupLabel}>{scope === 'meal' ? 'Posiłek' : 'Posiłki'}</p>
          <div className={styles.chips}>
            {MEAL_TYPES.map(t => (
              <button
                key={t.id}
                className={`${styles.chip} ${mealTypes.includes(t.id) ? styles.chipOn : ''}`}
                onClick={() => toggleMealType(t.id)}
                type="button"
              >{t.emoji} {t.label}</button>
            ))}
          </div>

          <button
            className={`glass ${styles.toggleRow}`}
            onClick={() => setOverwrite(o => !o)}
            type="button"
            role="switch"
            aria-checked={overwrite}
          >
            <span className={styles.toggleText}>
              <span className={styles.toggleTitle}>Zastąp już zaplanowane</span>
              <span className={styles.toggleSub}>
                {skippedCount > 0
                  ? (overwrite ? `${skippedCount} zaplanowanych pór zostanie zastąpionych` : `${skippedCount} zaplanowanych pór zostanie bez zmian`)
                  : 'W wybranym zakresie nic nie jest jeszcze zaplanowane'}
              </span>
            </span>
            <span className={`${styles.switch} ${overwrite ? styles.switchOn : ''}`}><span className={styles.knob} /></span>
          </button>

          {futureDays.length === 0 && (
            <p className={styles.warn}>Ten tydzień już minął — wybierz bieżący lub następny tydzień na ekranie Planu.</p>
          )}

          <div className={styles.actions}>
            <button
              className={`btn-primary ${styles.primary}`}
              onClick={generate}
              disabled={slots.length === 0}
              type="button"
            >
              {slots.length === 0 ? 'Brak pór do zaplanowania' : `Zaproponuj ✨ (${mealsCountLabel(slots.length)})`}
            </button>
          </div>
        </section>
      )}

      {/* ── Krok 4: propozycje ────────────────────── */}
      {step === 4 && (
        <section className={`${styles.body} ${styles.proposalBody}`}>
          <h1 className={`${styles.stepTitle} ${styles.center}`}>Propozycje</h1>

          {generating && (
            <div className={`glass glow ${styles.generating}`}>
              <span className={styles.spark}>✨</span>
              <p>Układam {mealsCountLabel(slots.length)}…</p>
              <p className={styles.muted}>Biorę pod uwagę profile domowników, Twoje przepisy i ostatnie posiłki.</p>
            </div>
          )}

          {!generating && aiError && (
            <div className={`glass ${styles.errorBox}`}>
              <p>{aiError}</p>
              <button className="btn-glow" onClick={proposal.length ? () => setAiError(null) : generate} type="button" style={{ padding: '8px 16px' }}>
                {proposal.length ? 'OK' : 'Spróbuj ponownie'}
              </button>
            </div>
          )}

          {!generating && proposal.length > 0 && (
            <div className={`${styles.days} ${correcting ? styles.dimmed : ''}`}>
              {proposalDays.map(g => (
                <div key={g.date} className={`glass glow ${styles.dayCard}`}>
                  <div className={styles.dayCardHead}>
                    <span className={styles.dayCardTitle}>{dayTitle(g.date)}</span>
                    <span className={styles.muted}>{mealsCountLabel(g.items.length)}</span>
                  </div>

                  {g.items.map(item => {
                    const opt = item.options[item.idx]
                    const recipe = opt && recipesByName.get(opt.name.trim().toLowerCase())
                    return (
                      <div
                        key={item.mealType}
                        className={`glass glow ${styles.slot}`}
                        onTouchStart={e => { touchX.current = e.touches[0].clientX }}
                        onTouchEnd={e => {
                          if (touchX.current === null) return
                          const dx = touchX.current - e.changedTouches[0].clientX
                          if (Math.abs(dx) > 40) cycle(item.i, dx > 0 ? 1 : -1)
                          touchX.current = null
                        }}
                      >
                        <div className={styles.slotText}>
                          <span className={styles.slotMeal}>{mealLabel(item.mealType)}</span>
                          <span className={styles.slotDish}>{opt ? opt.name : 'Brak propozycji'}</span>
                          <span className={styles.slotMeta}>
                            {opt?.prep_time ? `⏱ ${opt.prep_time} min` : ''}
                            {opt?.from_db && <span className={styles.badge}>z Twoich przepisów</span>}
                          </span>
                          {item.options.length > 1 && (
                            <span className={styles.switcher}>
                              <button onClick={() => cycle(item.i, -1)} type="button" aria-label="Poprzednia propozycja">‹</button>
                              {item.options.map((_, k) => (
                                <span key={k} className={`${styles.dot} ${k === item.idx ? styles.dotOn : ''}`} />
                              ))}
                              <button onClick={() => cycle(item.i, 1)} type="button" aria-label="Następna propozycja">›</button>
                            </span>
                          )}
                        </div>
                        {recipe?.photo_url
                          ? <img src={recipe.photo_url} alt="" className={styles.photoBg} />
                          : <span className={styles.emojiBg} aria-hidden="true">{opt?.emoji || mealEmoji(item.mealType)}</span>}
                      </div>
                    )
                  })}
                </div>
              ))}

              {tip && <p className={`glass ${styles.tip}`}>💡 {tip}</p>}
            </div>
          )}

          {!generating && proposal.length > 0 && (
            <div className={styles.footer}>
              <div className={`glass glow ${styles.chatPill}`}>
                <input
                  className={styles.chatInput}
                  placeholder="np. zamień obiad na bezmięsny"
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && correct()}
                  disabled={correcting}
                />
                <button className={styles.sendBtn} onClick={correct} disabled={!instruction.trim() || correcting} type="button" aria-label="Wyślij korektę">
                  {correcting
                    ? <span className={styles.spinner} />
                    : <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2 15 12 3.4 13.8z" /></svg>}
                </button>
              </div>
              <button className={`btn-primary ${styles.saveBtn}`} onClick={save} disabled={saving || correcting} type="button">
                {saving ? 'Zapisuję…' : `Dodaj do planu (${mealsCountLabel(proposal.filter(p => p.options.length).length)})`}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
