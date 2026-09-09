export type ReservationScheduleFields = {
  start_time?: string | null
  end_time?: string | null
  block?: 'morning' | 'afternoon' | null
}

export function formatTime(value: string): string {
  return value.slice(0, 5)
}

export function formatReservationSchedule(
  reservation: ReservationScheduleFields,
): string {
  if (reservation.start_time && reservation.end_time) {
    const start = formatTime(reservation.start_time)
    const end = formatTime(reservation.end_time)
    return end <= start ? `${start} - ${end} del día siguiente` : `${start} - ${end}`
  }

  if (reservation.block === 'morning') return 'AM'
  if (reservation.block === 'afternoon') return 'PM'
  return 'Horario no definido'
}

export function calculateDurationHours(section: {
  start_time: string
  end_time: string
}): number {
  const toMinutes = (value: string) => {
    const [hours, minutes] = formatTime(value).split(':').map(Number)
    return hours * 60 + minutes
  }

  const start = toMinutes(section.start_time)
  let end = toMinutes(section.end_time)
  if (end <= start) end += 24 * 60
  return (end - start) / 60
}
