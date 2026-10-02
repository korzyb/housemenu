import { useEffect } from 'react'
import styles from './Toast.module.css'

// Krótki komunikat nad dolną nawigacją; znika sam po kilku sekundach
export default function Toast({ message, warn = false, actionLabel, onAction, onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div className={`glass glow ${styles.toast} ${warn ? styles.warn : ''}`} role="status">
      <span className={styles.text}>{message}</span>
      {actionLabel && (
        <button className={styles.action} onClick={onAction} type="button">{actionLabel}</button>
      )}
    </div>
  )
}
