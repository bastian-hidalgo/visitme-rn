import dayjsLib, { type ConfigType, type Dayjs } from 'dayjs'
import 'dayjs/locale/es'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import { env } from '@/constants/env'

dayjsLib.extend(utc)
dayjsLib.extend(timezone)
dayjsLib.extend(localizedFormat)
dayjsLib.extend(relativeTime)
dayjsLib.locale('es')

const TZ = env.timezone || 'America/Santiago'
const DATETIME_FORMAT = env.datetimeFormat || 'YYYY-MM-DD HH:mm'
const DATE_FORMAT = env.dateFormat || 'YYYY-MM-DD'
const TIME_FORMAT = env.timeFormat || 'HH:mm'

// Detección básica de RN / web
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative'

export const dayjs = (value?: ConfigType): Dayjs => dayjsLib(value)
export const now = (): Dayjs => dayjsLib()

/**
 * Corrige la conversión UTC → local para RN.
 * En RN, .utc().tz() no aplica bien el offset, por eso usamos parse directo.
 */
export const fromServer = (value: ConfigType): Dayjs => {
  if (!value) return dayjsLib()

  const str = String(value)
  const hasZ = str.endsWith('Z') || str.includes('+00:00')

  let converted: Dayjs

  if (isReactNative) {
    // ✅ React Native: parse directo, luego forzamos tz sin cambiar hora
    converted = hasZ
      ? dayjsLib(str).tz(TZ, true)
      : dayjsLib(str).tz(TZ, true)
  } else {
    // ✅ Web / Node: método clásico UTC→TZ
    converted = hasZ
      ? dayjsLib.utc(str).tz(TZ)
      : dayjsLib(str).tz(TZ, true)
  } 

  return converted
}

export const fromServerDate = (value: ConfigType): Dayjs =>
  dayjsLib.utc(value).tz(TZ, true)

export const formatDateLogical = (value: ConfigType): string => {
  if (!value) return ''
  const s = String(value)

  // 1) Extrae solo la parte de fecha si viene como ISO con tiempo/offset
  //    Ej: "2025-11-28T00:00:00+00:00" -> "2025-11-28"
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  const datePart = m ? m[1] : s

  // 2) Parsear como fecha local *sin* aplicar TZ (no cambia el día)
  const d = dayjsLib(datePart) // "YYYY-MM-DD" se parsea directo

  return d.format(DATE_FORMAT) // p.ej. 'YYYY-MM-DD'
}

export const format = (value: ConfigType, fmt: string = DATETIME_FORMAT): string => {
  const base =
    typeof value === 'object' && value !== null && (value as any).isDayjs
      ? (value as Dayjs)
      : fromServer(value)

  const result = base.format(fmt)
  return result
}

export const formatDate = (value: ConfigType): string => format(value, DATE_FORMAT)
export const formatTime = (value: ConfigType): string => format(value, TIME_FORMAT)
export const fromNow = (value: ConfigType): string => fromServer(value).fromNow()
export const toServerUTC = (value: ConfigType): string => dayjs(value).utc().toISOString()
export const getTZ = (): string => TZ

export default dayjs
