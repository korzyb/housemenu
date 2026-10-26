import { useEffect } from 'react'
import styles from './BottomSheet.module.css'

// action — opcjonalny przycisk w prawym górnym rogu (obok tytułu)
export default function BottomSheet({ isOpen, onClose, title, action, children }) {
  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>
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
