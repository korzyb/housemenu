// Powiadomienia push na tym urządzeniu: włącz / wyłącz / stan.
// Subskrypcja (adres + klucze od przeglądarki) trafia do bazy przez funkcję push_subscribe;
// wysyła Edge Function send-push, gdy na innym urządzeniu doda się przepis albo zmieni plan.
import { supabase } from './supabase'
import { DEVICE_ID } from './device'

// Klucz publiczny VAPID (para do sekretu VAPID_PRIVATE_KEY w Supabase) — jawny z założenia
const VAPID_PUBLIC_KEY = 'BNhFjNbCsiSU6j2ZKINkvvyYLPz5z0foDdQEZb46I8IBBF1K4rUNEcfBJDXB8rFDoI-CAZIYQYy_Ai5bQFsGDEY'

export const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function keyBytes(base64url) {
  const b64 = (base64url + '='.repeat((4 - base64url.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration()) ??
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
}

// 'unsupported' | 'denied' | 'on' | 'off'
export async function pushState() {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  return sub && Notification.permission === 'granted' ? 'on' : 'off'
}

// Zwraca { state, error }
export async function enablePush() {
  if (!pushSupported()) return { state: 'unsupported', error: null }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { state: permission === 'denied' ? 'denied' : 'off', error: null }
  try {
    const reg = await registration()
    await navigator.serviceWorker.ready
    const sub = (await reg.pushManager.getSubscription()) ??
      await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) })
    const { endpoint, keys } = sub.toJSON()
    const { error } = await supabase.rpc('push_subscribe', {
      p_endpoint: endpoint, p_p256dh: keys.p256dh, p_auth: keys.auth, p_device: DEVICE_ID,
    })
    if (error) return { state: 'off', error: 'Nie udało się zapisać urządzenia. Spróbuj ponownie.' }
    return { state: 'on', error: null }
  } catch {
    return { state: 'off', error: 'Nie udało się włączyć powiadomień na tym urządzeniu.' }
  }
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await supabase.rpc('push_unsubscribe', { p_endpoint: sub.endpoint })
    await sub.unsubscribe()
  }
  return { state: 'off', error: null }
}
