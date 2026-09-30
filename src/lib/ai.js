import { supabase } from './supabase'

// Wywołanie Edge Function z AI. Zwraca { data, error } — error to czytelny komunikat po polsku.
// supabase-js przy statusie ≠ 2xx daje tylko ogólne "non-2xx status code",
// więc treść błędu (np. limit zapytań Gemini) odczytujemy z odpowiedzi funkcji.
export async function invokeAi(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })

  if (error) {
    let message = null
    try {
      const payload = await error.context?.json()
      message = payload?.error
    } catch {
      // odpowiedź bez JSON — zostaje komunikat ogólny
    }
    if (!message) {
      message = error.name === 'FunctionsFetchError'
        ? 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.'
        : 'Asystent AI nie odpowiedział poprawnie. Spróbuj ponownie.'
    }
    return { data: null, error: message }
  }

  if (data?.error) return { data: null, error: data.error }
  return { data, error: null }
}
