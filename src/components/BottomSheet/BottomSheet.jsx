import { useEffect } from 'react'
import styles from './BottomSheet.module.css'

export default function BottomSheet({ isOpen, onClose, title, children }) {
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
        {title && <p className={styles.title}>{title}</p>}
        {children}
      </div>
    </div>
  )
}
