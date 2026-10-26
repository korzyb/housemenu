// Historia nawigacji jak w aplikacji mobilnej. Historia ma zawsze postać:
//   Dziś → [zakładka] → [podstrony zakładki]
// - „wstecz” w podstronach cofa do strony głównej zakładki, z niej na „Dziś”, a z „Dziś” zamyka aplikację;
// - przejście między zakładkami (dolny pasek) nie dokłada historii — zastępuje poprzednią zakładkę.
// React Router trzyma w history.state.idx numer wpisu w historii tej karty (0 = pierwszy po otwarciu aplikacji).
import { useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

export const HOME = '/today'
export const historyIndex = () => window.history.state?.idx ?? 0

let pending = null      // { idx, to } — zakładka do otwarcia po cofnięciu historii do wpisu idx
let normalized = false  // start aplikacji obsłużony

export function useTabNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  // Start poza „Dziś” (np. link do przepisu): pod spód wkładamy „Dziś”, żeby „wstecz” tam wracało
  useEffect(() => {
    if (normalized) return
    normalized = true
    if (historyIndex() === 0 && location.pathname !== HOME) {
      const target = location.pathname + location.search
      navigate(HOME, { replace: true })
      navigate(target)
    }
  }, [location, navigate])

  // Po cofnięciu historii: otwórz docelową zakładkę w miejscu wpisu idx
  useEffect(() => {
    if (pending && historyIndex() === pending.idx) {
      const { to } = pending
      pending = null
      if (location.pathname !== to) navigate(to, { replace: true })
    }
  }, [location, navigate])

  return useCallback(to => {
    const idx = historyIndex()
    if (to === HOME) {
      // „Dziś” = pierwszy wpis historii
      if (idx > 0) navigate(-idx)
      return
    }
    if (idx === 0) {
      navigate(to)                                   // z „Dziś”: zakładka nad „Dziś”
    } else if (idx === 1) {
      if (location.pathname !== to) navigate(to, { replace: true })
    } else {
      pending = { idx: 1, to }                       // z podstrony: cofnij do wpisu zakładki i podmień go
      navigate(-(idx - 1))
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
