import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMembers, useMember } from '../../hooks/useMembers'
import {
  PROFILE_PILLARS, CORE_PROFILE_FIELDS, MEMBER_EMOJIS,
  emptyProfile, mergeProfile,
} from '../../lib/profile'
import styles from './MemberWizard.module.css'

// Filary jako kroki; z 'base' usuwamy pola core (są już w kroku 0 — tożsamość)
const pillarSteps = PROFILE_PILLARS.map(p => ({
  ...p,
  fields: p.key === 'base' ? p.fields.filter(f => !f.core) : p.fields,
}))
const totalSteps = pillarSteps.length + 1 // +1 = krok tożsamości

function toggleMulti(arr, id) {
  if (id === 'none') return arr.includes('none') ? [] : ['none']
  const base = arr.filter(x => x !== 'none')
  return base.includes(id) ? base.filter(x => x !== id) : [...base, id]
}

export default function MemberWizard() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const { addMember, updateMember, deleteMember } = useMembers()
  const { member, loading } = useMember(id)

  const [step,     setStep]     = useState(0)
  const [name,     setName]     = useState('')
  const [emoji,    setEmoji]    = useState(MEMBER_EMOJIS[0])
  const [profile,  setProfile]  = useState(emptyProfile())
  const [saving,   setSaving]   = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Po zmianie kroku przewiń widok na górę (kontener przewijany to <main>)
  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0 })
  }, [step])

  useEffect(() => {
    if (isEdit && member && !hydrated) {
      setName(member.name || '')
      setEmoji(member.emoji || MEMBER_EMOJIS[0])
      setProfile(mergeProfile(member.profile))
      setHydrated(true)
    }
  }, [isEdit, member, hydrated])

  function setField(pillarKey, fieldId, value) {
    setProfile(prev => ({
      ...prev,
      [pillarKey]: { ...prev[pillarKey], [fieldId]: value },
    }))
  }

  async function handleSave() {
    if (!name.trim()) { setStep(0); return }
    setSaving(true)
    const payload = { name: name.trim(), emoji, profile, card_stale: true }
    const res = isEdit ? await updateMember(id, payload) : await addMember(payload)
    setSaving(false)
    // Profil domownika — tam karta AI wygeneruje się sama (card_stale: true)
    if (!res.error) navigate(`/settings/household/${res.data.id}`, { replace: true })
  }

  async function handleDelete() {
    if (!window.confirm(`Usunąć domownika „${name}"?`)) return
    await deleteMember(id)
    navigate('/settings/household', { replace: true })
  }

  if (isEdit && !hydrated) {
    if (!loading && !member) {
      return (
        <div className={styles.page}>
          <p className={styles.notFound}>Nie znaleziono domownika.</p>
          <button className={styles.secondaryBtn} onClick={() => navigate('/settings/household')}>Wróć</button>
        </div>
      )
    }
    return <div className={styles.page}><p className={styles.notFound}>Wczytywanie…</p></div>
  }

  const isIdentity = step === 0
  const isLast     = step === totalSteps - 1
  const pillar     = isIdentity ? null : pillarSteps[step - 1]
  const canProceed = !isIdentity || name.trim()

  function renderField(pillarKey, field) {
    const value = profile[pillarKey][field.id]

    if (field.type === 'text') {
      return (
        <div key={field.id} className={styles.field}>
          <label className={styles.fieldLabel}>{field.label}</label>
          <textarea
            className={styles.textarea}
            placeholder={field.placeholder}
            value={value}
            onChange={e => setField(pillarKey, field.id, e.target.value)}
            rows={3}
          />
        </div>
      )
    }

    return (
      <div key={field.id} className={styles.field}>
        <label className={styles.fieldLabel}>{field.label}</label>
        <div className={styles.chips}>
          {field.options.map(opt => {
            const selected = field.type === 'single'
              ? value === opt.id
              : Array.isArray(value) && value.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                className={`${styles.chip} ${selected ? styles.chipOn : ''}`}
                onClick={() => {
                  if (field.type === 'single') {
                    setField(pillarKey, field.id, selected ? '' : opt.id)
                  } else {
                    setField(pillarKey, field.id, toggleMulti(value, opt.id))
                  }
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate(isEdit ? `/settings/household/${id}` : '/settings/household')} aria-label="Anuluj">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <h1 className={styles.title}>{isEdit ? 'Edytuj domownika' : 'Nowy domownik'}</h1>
        <span className={styles.stepCount}>{step + 1}/{totalSteps}</span>
      </header>

      <div className={styles.progress}>
        <span className={styles.progressFill} style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
      </div>

      <div className={styles.body}>
        {isIdentity ? (
          <>
            <h2 className={styles.stepTitle}>Kto to?</h2>
            <p className={styles.stepSub}>Imię i rola wystarczą, żeby zacząć — resztę profilu można uzupełnić później.</p>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Imię</label>
              <input
                className={styles.input}
                placeholder="np. Ania, Tata, Kuba…"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabel}>Awatar</label>
              <div className={styles.emojiRow}>
                {MEMBER_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    className={`${styles.emojiBtn} ${emoji === e ? styles.emojiOn : ''}`}
                    onClick={() => setEmoji(e)}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {CORE_PROFILE_FIELDS.map(field => renderField('base', field))}
          </>
        ) : (
          <>
            <h2 className={styles.stepTitle}>{pillar.title}</h2>
            <p className={styles.stepSub}>{pillar.subtitle}</p>
            {pillar.fields.map(field => renderField(pillar.key, field))}
          </>
        )}

        {isEdit && isLast && (
          <button className={styles.deleteBtn} onClick={handleDelete} type="button">
            Usuń domownika
          </button>
        )}
      </div>

      <footer className={styles.footer}>
        {step > 0 && (
          <button className={styles.secondaryBtn} onClick={() => setStep(step - 1)} type="button">
            Wstecz
          </button>
        )}
        {isLast ? (
          <button className={styles.primaryBtn} onClick={handleSave} disabled={saving || !name.trim()} type="button">
            {saving ? 'Zapisywanie…' : (isEdit ? 'Zapisz zmiany' : 'Zapisz domownika')}
          </button>
        ) : (
          <button className={styles.primaryBtn} onClick={() => setStep(step + 1)} disabled={!canProceed} type="button">
            {isIdentity ? 'Dalej' : 'Dalej'}
          </button>
        )}
      </footer>

      {!isIdentity && !isLast && name.trim() && (
        <button className={styles.saveNowLink} onClick={handleSave} type="button" disabled={saving}>
          Zapisz teraz i dokończ później
        </button>
      )}
    </div>
  )
}
