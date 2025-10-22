import { now } from '@/lib/time'
// Fechas: usar util de tiempo de '@/lib/time' (no usar Date/ISO directos).

export function getGreeting(): string {
  const hour = now().hour()

  if (hour >= 5 && hour < 12) {
    return 'Buenos días 🌞'
  } else if (hour >= 12 && hour < 20) {
    return 'Buenas tardes 🍵'
  } else {
    return 'Buenas noches 🌙'
  }
}
