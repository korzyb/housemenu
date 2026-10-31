// Identyfikator tego urządzenia (przeglądarki) — trafia w nagłówku x-device-id do każdego zapisu w bazie,
// żeby powiadomienie o zmianie nie przychodziło na urządzenie, które ją zrobiło.
const KEY = 'mealplanner.deviceId'

function load() {
  try {
    let id = localStorage.getItem(KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export const DEVICE_ID = load()
