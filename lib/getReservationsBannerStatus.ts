import { fromServerDate, now } from './time'
import type { ReservationWithWeather } from './useWeatherForReservations'

/**
 * Verifica si una reserva tiene fecha válida
 */
const hasDate = (
  reservation: ReservationWithWeather
): reservation is ReservationWithWeather & { date: string } =>
  Boolean(reservation.date)

/**
 * Determina el estado de banner según la próxima reserva
 * Retorna:
 *  - 'none': no hay reservas
 *  - 'upcoming': reserva hoy
 *  - 'tomorrow': reserva mañana
 *  - 'post': todas las reservas pasaron
 */
export default function getReservationBannerStatus(
  reservations: ReservationWithWeather[]
): {
  status: 'none' | 'upcoming' | 'tomorrow' | 'post'
  formattedDate?: string
} {
  const today = now().startOf('day')
  const reservationsWithDate = reservations.filter(hasDate)

  if (reservationsWithDate.length === 0) {
    return { status: 'none' }
  }

  // Ordenar por fecha
  const sorted = [...reservationsWithDate].sort(
    (a, b) => fromServerDate(a.date).valueOf() - fromServerDate(b.date).valueOf()
  )

  // Buscar próxima reserva activa
  const upcoming = sorted.find((reservation) => {
    if (reservation.status === 'cancelado') return false
    const reservationDate = fromServerDate(reservation.date).startOf('day')
    return reservationDate.diff(today, 'day') >= 0
  })

  if (upcoming) {
    const reservationDate = fromServerDate(upcoming.date).startOf('day')
    const diff = reservationDate.diff(today, 'day')
    const formattedDate = fromServerDate(upcoming.date).format('DD [de] MMMM')

    if (diff === 0) {
      return { status: 'upcoming', formattedDate }
    }

    if (diff === 1) {
      return { status: 'tomorrow', formattedDate }
    }

    return { status: 'none' }
  }

  // Última reserva pasada
  const lastReservation = sorted[sorted.length - 1]
  const lastReservationDate = fromServerDate(lastReservation.date).startOf('day')

  if (lastReservationDate.isBefore(today)) {
    return { status: 'post' }
  }

  return { status: 'none' }
}
