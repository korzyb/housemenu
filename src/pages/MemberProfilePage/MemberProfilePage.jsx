import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useMember } from '../../hooks/useMembers'
import {
  LIFE_PHASES, profileCompleteness, profileToPromptText, parseProfileCard,
} from '../../lib/profile'
import styles from './MemberProfilePage.module.css'

function roleLabel(member) {
  const phases = member.profile?.base?.life_phase || []
  return phases.map(id => LIFE_PHASES.find(p => p.id === id)?.label ?? id).join(', ')
}

export default function MemberProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { member, loading, updateMember } = useMember(id)

  const [genError, setGenError] = useState(null)
  const [manualGenerating, setManualGenerating] = useState(false)
  const inFlight = useRef(false)

  const card = parseProfileCard(member?.ai_profile_card)
  const hasProfileData = member && profileCompleteness(member.profile) > 0
  // Karta wymaga (re)generacji: brak karty lub profil zmieniony od ostatniej generacji
  const needsCard = hasProfileData && (!card || member.card_stale)
  const generating = manualGenerating || (needsCard && !genError)

  async function generateCard() {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const { data, error } = await supabase.functions.invoke('generate-profile-card', {
        body: { profileText: profileToPromptText(member) },
      })
      if (error || data?.error) throw new Error(data?.error ?? error.message)
      const res = await updateMember({ ai_profile_card: JSON.stringify(data.card), card_stale: false })
      if (res.error) throw res.error
      setGenError(null)
    } catch (err) {
      setGenError(err.message || 'Nie udało się wygenerować karty')
    } finally {
      inFlight.current = false
      setManualGenerating(false)
    }
  }

  // Automatyczna generacja po wejściu na ekran, gdy karta jest nieaktualna
  useEffect(() => {
    if (needsCard && !genError && !inFlight.current) generateCard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsCard, genError])

  function handleRegenerate() {
    setGenError(null)
    setManualGenerating(true)
    generateCard()
  }

  async function toggleActive() {
    await updateMember({ is_active: !member.is_active })
  }

  if (loading) return <div className={styles.page}><p className={styles.muted}>Wczytywanie…</p></div>
  if (!member) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>Nie znaleziono domownika.</p>
        <button className="btn-glow" onClick={() => navigate('/settings/household')} type="button">Wróć</button>
      </div>
    )
  }

  const role = roleLabel(member)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={`glass ${styles.backBtn}`} onClick={() => navigate('/settings/household')} aria-label="Wstecz">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button className={`btn-glow ${styles.editBtn}`} onClick={() => navigate(`/settings/household/${id}/edit`)} type="button">
          Edytuj profil
        </button>
      </header>

      <div className={styles.identity}>
        <span className={styles.avatar}>{member.emoji || '🙂'}</span>
        <div>
          <h1 className="page-title">{member.name}</h1>
          {role && <p className={styles.role}>{role}</p>}
        </div>
      </div>

      {/* Uwzględnianie w planowaniu AI */}
      <button
        className={`glass ${styles.toggleRow}`}
        onClick={toggleActive}
        type="button"
        role="switch"
        aria-checked={member.is_active}
      >
        <span className={styles.toggleText}>
          <span className={styles.toggleTitle}>Uwzględniaj w planowaniu AI</span>
          <span className={styles.toggleSub}>
            {member.is_active ? 'Sugestie posiłków biorą pod uwagę ten profil' : 'Np. gdy wyjeżdża — AI pominie ten profil'}
          </span>
        </span>
        <span className={[styles.switch, member.is_active ? styles.switchOn : ''].join(' ')}>
          <span className={styles.knob} />
        </span>
      </button>

      <h2 className={styles.sectionTitle}>Karta profilu</h2>

      {!hasProfileData && (
        <div className={`glass ${styles.cardBox}`}>
          <p className={styles.muted}>Uzupełnij profil, a AI przygotuje ściągawkę dla kucharza: cel, logistykę, smaki i konkretne wskazówki.</p>
        </div>
      )}

      {hasProfileData && generating && (
        <div className={`glass glow ${styles.cardBox} ${styles.generating}`}>
          <span className={styles.spark}>✨</span>
          <p>Przygotowuję kartę profilu…</p>
          <p className={styles.muted}>To zwykle trwa kilka–kilkanaście sekund.</p>
        </div>
      )}

      {hasProfileData && !generating && genError && (
        <div className={`glass ${styles.cardBox}`}>
          <p className={styles.errorText}>{genError}</p>
          <button className="btn-primary" onClick={handleRegenerate} type="button">Spróbuj ponownie</button>
        </div>
      )}

      {hasProfileData && !generating && !genError && card && (
        <>
          <section className={`glass glow ${styles.cardBox}`}>
            <h3 className={styles.cardHeading}>🎯 Główny cel</h3>
            <p>{card.goal}</p>

            <h3 className={styles.cardHeading}>🕒 Okno logistyczne</h3>
            <p>{card.logistics}</p>

            <h3 className={styles.cardHeading}>🍽 Kulinarny paszport</h3>
            {card.loves?.length > 0 && (
              <div className={styles.chipRow}>
                <span className={styles.chipLabel}>Lubi</span>
                {card.loves.map(x => <span key={x} className={`${styles.chip} ${styles.chipLove}`}>{x}</span>)}
              </div>
            )}
            {card.avoids?.length > 0 && (
              <div className={styles.chipRow}>
                <span className={styles.chipLabel}>Unika</span>
                {card.avoids.map(x => <span key={x} className={`${styles.chip} ${styles.chipAvoid}`}>{x}</span>)}
              </div>
            )}
            {card.textures && <p className={styles.muted}>{card.textures}</p>}

            {card.alerts?.length > 0 && (
              <div className={styles.alerts}>
                <h3 className={styles.cardHeading}>⚠️ Sygnały alarmowe</h3>
                <ul>
                  {card.alerts.map(a => <li key={a}>{a}</li>)}
                </ul>
              </div>
            )}
          </section>

          <h2 className={styles.sectionTitle}>Strategia dla kucharza</h2>
          <div className={styles.tips}>
            {card.tips?.map((tip, i) => (
              <div key={i} className={`glass ${styles.tip}`}>
                <span className={styles.tipNum}>{i + 1}</span>
                <div>
                  <p className={styles.tipTitle}>{tip.title}</p>
                  <p className={styles.tipText}>{tip.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.footer}>
            <p className={styles.disclaimer}>
              Karta wygenerowana przez AI na podstawie profilu — to kuchenna ściągawka, nie porada medyczna.
            </p>
            <button className={styles.regenBtn} onClick={handleRegenerate} type="button">
              ↻ Wygeneruj ponownie
            </button>
          </div>
        </>
      )}
    </div>
  )
}
