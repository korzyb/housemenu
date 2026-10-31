import { createClient } from '@supabase/supabase-js'
import { DEVICE_ID } from './device'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// x-device-id: wyzwalacze powiadomień w bazie wiedzą, z którego urządzenia przyszła zmiana
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { 'x-device-id': DEVICE_ID } },
})
