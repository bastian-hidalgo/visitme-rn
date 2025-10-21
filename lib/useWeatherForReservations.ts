import { supabase } from '@/lib/supabase/client'; // ✅ cliente para RN
import { format } from '@/lib/time';
import type { Database } from '@/types/supabase';
import { useEffect, useState } from 'react';

// 🔹 Tipo base desde la tabla real
type BaseReservation = Database['public']['Views']['common_space_reservations_with_user']['Row']

// 🔹 Extiende con campos adicionales de clima
export type ReservationWithWeather = BaseReservation & {
  weather?: 'sunny' | 'rainy' | 'cloudy' | 'windy'
  weather_description?: string | null
}

export function useWeatherForReservations(
  reservations: BaseReservation[]
): ReservationWithWeather[] {
  const [result, setResult] = useState<ReservationWithWeather[]>([])

  useEffect(() => {
    if (!reservations?.length) {
      setResult([])
      return
    }

    const loadWeather = async () => {
      const valid = reservations.filter((r) => r.date && r.community_id)

      if (!valid.length) {
        setResult(reservations)
        return
      }

      const dates = [...new Set(valid.map((r) => format(r.date!, 'YYYY-MM-DD')))]
      const communities = [...new Set(valid.map((r) => r.community_id!))]

      const { data: forecasts, error } = await supabase
        .from('weather_forecast')
        .select('date, community_id, weather, description')
        .in('date', dates)
        .in('community_id', communities)

      if (error) {
        console.error('Error loading weather:', error)
        setResult(reservations)
        return
      }

      const enriched: ReservationWithWeather[] = reservations.map((res) => {
        const date = res.date ? format(res.date, 'YYYY-MM-DD') : null
        const match = forecasts?.find(
          (f) => f.date === date && f.community_id === res.community_id
        )

        return {
          ...res,
          weather: match?.weather as ReservationWithWeather['weather'],
          weather_description: match?.description ?? null,
        }
      })

      setResult(enriched)
    }

    loadWeather()
  }, [reservations])

  return result
}
