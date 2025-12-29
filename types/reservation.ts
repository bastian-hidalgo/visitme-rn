import type { Database } from './supabase'

export type Reservation = Database['public']['Views']['common_space_reservations_with_user']['Row'] & {
  department_number?: string | null
  user_name?: string | null
  user_email?: string | null
  image_url?: string | null
  common_space_image_url?: string | null
  weather?: 'sunny' | 'rainy' | 'cloudy' | 'windy'
  weather_description?: string | null
  common_spaces?: {
    requires_consent: boolean | null
    consent_text: string | null
  } | null
}
