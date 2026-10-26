// Historia nawigacji jak w aplikacji mobilnej:
// - przejście między zakładkami (dolny pasek) nie dokłada historii — „wstecz” na stronie głównej zakładki zamyka aplikację;
// - wewnątrz zakładki „wstecz” cofa się po podstronach aż do strony głównej zakładki.
// React Router trzyma w history.state.idx numer wpisu w historii tej karty (0 = pierwszy po otwarciu aplikacji).
import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const historyIndex = () => window.history.state?.idx ?? 0

let pendingTab = null // zakładka do otwarcia po cofnięciu historii do początku

// Przejście na zakładkę: cofnij historię do pierwszego wpisu i zastąp go stroną zakładki
export function useTabNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (pendingTab && historyIndex() === 0) {
      const to = pendingTab
      pendingTab = null
      if (location.pathname !== to) navigate(to, { replace: true })
    }
  }, [location, navigate])

  return useCallback(to => {
    const idx = historyIndex()
    if (idx > 0) {
      pendingTab = to
      navigate(-idx)
    } else if (location.pathname !== to) {
      navigate(to, { replace: true })
    }
  }, [navigate, location.pathname])
}

// Przycisk „wstecz” w aplikacji: cofnij się w historii; gdy nie ma dokąd (np. wejście z linku) — przejdź do fallback
export function useGoBack(fallback) {
  const navigate = useNavigate()
  return useCallback(() => {
    if (historyIndex() > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}
