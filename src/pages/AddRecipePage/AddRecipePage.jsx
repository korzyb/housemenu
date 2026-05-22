import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRecipes } from '../../hooks/useRecipes'
import { supabase } from '../../lib/supabase'
import styles from './AddRecipePage.module.css'

const EMPTY_INGREDIENT = { amount: '', unit: '', name: '' }
const EMPTY_STEP       = { text: '' }

export default function AddRecipePage() {
  const navigate = useNavigate()
  const { addRecipe } = useRecipes()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    description: '',
    prep_time: '',
    servings: 4,
    difficulty: 'easy',
    temperature: 'hot',
    tags: [],
    notes: '',
    ingredients: [{ ...EMPTY_INGREDIENT }],
    steps: [{ ...EMPTY_STEP }],
  })
  const [tagInput,   setTagInput]   = useState('')
  const [importUrl,  setImportUrl]  = useState('')
  const [importing,  setImporting]  = useState(false)
  const [importErr,  setImportErr]  = useState(null)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // ─── Ingredients ───────────────────────────────────────
  function setIng(i, field, value) {
    const arr = [...form.ingredients]
    arr[i] = { ...arr[i], [field]: value }
    set('ingredients', arr)
  }
  const addIng    = () => set('ingredients', [...form.ingredients, { ...EMPTY_INGREDIENT }])
  const removeIng = i => set('ingredients', form.ingredients.filter((_, j) => j !== i))

  // ─── Steps ─────────────────────────────────────────────
  function setStep(i, value) {
    const arr = [...form.steps]
    arr[i] = { text: value }
    set('steps', arr)
  }
  const addStep    = () => set('steps', [...form.steps, { ...EMPTY_STEP }])
  const removeStep = i => set('steps', form.steps.filter((_, j) => j !== i))

  // ─── Import z URL ──────────────────────────────────────
  async function handleImport() {
    if (!importUrl.trim()) return
    setImporting(true)
    setImportErr(null)
    const { data, error } = await supabase.functions.invoke('import-recipe', {
      body: { url: importUrl.trim() },
    })
    setImporting(false)
    if (error || data?.error) {
      setImportErr(data?.error ?? error?.message ?? 'Błąd importu')
      return
    }
    setForm(f => ({
      ...f,
      name:        data.name        ?? f.name,
      description: data.description ?? f.description,
      prep_time:   data.prep_time   ? String(data.prep_time) : f.prep_time,
      servings:    data.servings    ?? f.servings,
      difficulty:  data.difficulty  ?? f.difficulty,
      temperature: data.temperature ?? f.temperature,
      tags:        data.tags?.length ? data.tags : f.tags,
      ingredients: data.ingredients?.length
        ? data.ingredients.map(i => ({ amount: i.amount ?? '', unit: i.unit ?? '', name: i.name ?? '' }))
        : f.ingredients,
      steps: data.steps?.length
        ? data.steps.map(s => ({ text: s.text ?? '' }))
        : f.steps,
    }))
    setImportUrl('')
  }

  // ─── Tags ──────────────────────────────────────────────
  function addTag() {
    if (!tagInput.trim()) return
    set('tags', [...form.tags, tagInput.trim()])
    setTagInput('')
  }

  // ─── Save ──────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data, error } = await addRecipe({
      name:        form.name.trim(),
      description: form.description.trim() || null,
      prep_time:   form.prep_time ? parseInt(form.prep_time) : null,
      servings:    form.servings || 4,
      difficulty:  form.difficulty,
      temperature: form.temperature,
      tags:        form.tags,
      notes:       form.notes.trim() || null,
      source_type: 'manual',
      ingredients: form.ingredients.filter(i => i.name.trim()).map(i => ({
        amount: i.amount, unit: i.unit, name: i.name.trim(),
      })),
      steps: form.steps.filter(s => s.text.trim()).map((s, i) => ({
        order: i + 1, text: s.text.trim(),
      })),
    })
    setSaving(false)
    if (!error) navigate(data?.id ? `/recipes/${data.id}` : '/recipes')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>←</button>
        <h1 className={styles.title}>Nowy przepis</h1>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!form.name.trim() || saving}
        >{saving ? '…' : 'Zapisz'}</button>
      </header>

      <div className={styles.form}>

        {/* Import z URL */}
        <div className={styles.importSection}>
          <div className={styles.importRow}>
            <input
              className={styles.importInput}
              type="url"
              placeholder="Wklej link do przepisu…"
              value={importUrl}
              onChange={e => { setImportUrl(e.target.value); setImportErr(null) }}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
            />
            <button
              className={styles.importBtn}
              onClick={handleImport}
              disabled={!importUrl.trim() || importing}
              type="button"
            >{importing ? '…' : '✨ Importuj'}</button>
          </div>
          {importErr && <p className={styles.importErr}>{importErr}</p>}
        </div>

        {/* Nazwa */}
        <input
          className={styles.nameInput}
          placeholder="Nazwa przepisu *"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          autoFocus
        />

        {/* Opis */}
        <textarea
          className={styles.textarea}
          placeholder="Krótki opis (opcjonalnie)"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          rows={2}
        />

        {/* Czas + porcje */}
        <div className={styles.row2}>
          <div className={styles.field}>
            <label className={styles.label}>⏱ Czas (min)</label>
            <input
              type="number" min="1" className={styles.numInput}
              placeholder="30"
              value={form.prep_time}
              onChange={e => set('prep_time', e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>👤 Porcje</label>
            <input
              type="number" min="1" className={styles.numInput}
              value={form.servings}
              onChange={e => set('servings', parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        {/* Trudność */}
        <div className={styles.chipGroup}>
          <span className={styles.chipLabel}>Trudność</span>
          <div className={styles.chips}>
            {[['easy','Łatwy'],['medium','Średni'],['hard','Trudny']].map(([v, l]) => (
              <button key={v} type="button"
                className={[styles.chip, form.difficulty === v ? styles.chipActive : ''].join(' ')}
                onClick={() => set('difficulty', v)}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Temperatura */}
        <div className={styles.chipGroup}>
          <span className={styles.chipLabel}>Podawać</span>
          <div className={styles.chips}>
            {[['hot','🌡 Na ciepło'],['cold','❄ Na zimno']].map(([v, l]) => (
              <button key={v} type="button"
                className={[styles.chip, form.temperature === v ? styles.chipActive : ''].join(' ')}
                onClick={() => set('temperature', v)}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Tagi */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Tagi</h2>
          <div className={styles.tagRow}>
            <input
              className={styles.tagInput}
              placeholder="np. wegetariańskie"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTag()}
            />
            <button className={styles.tagAddBtn} onClick={addTag} type="button">+</button>
          </div>
          {form.tags.length > 0 && (
            <div className={styles.tagList}>
              {form.tags.map((tag, i) => (
                <span key={i} className={styles.tagBadge}>
                  {tag}
                  <button onClick={() => set('tags', form.tags.filter((_, j) => j !== i))} type="button">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Składniki */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Składniki</h2>
          {form.ingredients.map((ing, i) => (
            <div key={i} className={styles.ingRow}>
              <input className={styles.ingAmount} placeholder="Ile" value={ing.amount}
                onChange={e => setIng(i, 'amount', e.target.value)} />
              <input className={styles.ingUnit} placeholder="j.m." value={ing.unit}
                onChange={e => setIng(i, 'unit', e.target.value)} />
              <input className={styles.ingName} placeholder="Składnik *" value={ing.name}
                onChange={e => setIng(i, 'name', e.target.value)} />
              {form.ingredients.length > 1 && (
                <button className={styles.removeBtn} onClick={() => removeIng(i)} type="button">×</button>
              )}
            </div>
          ))}
          <button className={styles.addRowBtn} onClick={addIng} type="button">+ Dodaj składnik</button>
        </div>

        {/* Kroki */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Przygotowanie</h2>
          {form.steps.map((step, i) => (
            <div key={i} className={styles.stepRow}>
              <span className={styles.stepNum}>{i + 1}</span>
              <textarea
                className={styles.stepText}
                placeholder="Opis kroku…"
                value={step.text}
                onChange={e => setStep(i, e.target.value)}
                rows={2}
              />
              {form.steps.length > 1 && (
                <button className={styles.removeBtn} onClick={() => removeStep(i)} type="button">×</button>
              )}
            </div>
          ))}
          <button className={styles.addRowBtn} onClick={addStep} type="button">+ Dodaj krok</button>
        </div>

        {/* Notatki */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Notatki własne</h2>
          <textarea
            className={styles.textarea}
            placeholder="Twoje modyfikacje i wskazówki…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
          />
        </div>

        <div className={styles.spacer} />
      </div>
    </div>
  )
}
