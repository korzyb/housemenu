import { useEffect, useState } from 'react'
import styles from './BottomSheet.module.css'

// Wysokość klawiatury ekranowej (px) i widoczna wysokość ekranu — z visualViewport.
// Na telefonie klawiatura zasłania dół strony, a okno przyklejone do dołu chowałoby się za nią.
function useKeyboard(active) {
  const [kb, setKb] = useState({ inset: 0, height: null })
  useEffect(() => {
    const vv = window.visualViewport
    if (!active || !vv) return
    const update = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
      setKb(inset > 80 ? { inset, height: Math.round(vv.height) } : { inset: 0, height: null })
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [active])
  return kb
}

// action — opcjonalny przycisk w prawym górnym rogu (obok tytułu)
export default function BottomSheet({ isOpen, onClose, title, action, children }) {
  const kb = useKeyboard(isOpen)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose} style={kb.inset ? { paddingBottom: kb.inset } : undefined}>
      <div
        className={`${styles.sheet} ${kb.inset ? styles.keyboardOpen : ''}`}
        onClick={e => e.stopPropagation()}
        style={kb.height ? { maxHeight: kb.height - 12 } : undefined}
      >
        <div className={styles.handle} />
        {(title || action) && (
          <div className={styles.header}>
            <p className={styles.title}>{title}</p>
            {action}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
