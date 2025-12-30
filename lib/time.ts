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

export const TZ = env.timezone || 'America/Santiago'
dayjsLib.tz.setDefault(TZ)
const DATETIME_FORMAT = env.datetimeFormat || 'YYYY-MM-DD HH:mm'
const DATE_FORMAT = env.dateFormat || 'YYYY-MM-DD'
const TIME_FORMAT = env.timeFormat || 'HH:mm'

// Detección básica de RN / web
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative'

export const now = (): Dayjs => {
  // Intentamos obtener el tiempo en la zona destino usando el plugin oficial
  let d = dayjsLib.tz()

  // ✅ Fallback para React Native: si el plugin no restó el offset (la hora sigue igual que UTC)
  // y no estamos queriendo explícitamente UTC, forzamos la obtención vía Intl.
  if (isReactNative && d.hour() === dayjsLib.utc().hour() && TZ !== 'UTC') {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      
      // format(Date) en en-CA devuelve "YYYY-MM-DD, HH:mm:ss"
      const parts = formatter.format(new Date()).replace(', ', 'T')
      const logical = dayjsLib(parts).tz(TZ, true)
      
      if (logical.isValid()) return logical
    } catch (e) {
      // Sin Intl disponible o error de zona, retornamos el original
      return d
    }
  }

  return d
}

export const dayjs = (value?: ConfigType): Dayjs => (value ? dayjsLib(value) : now())

/**
 * Corrige la conversión UTC → local para RN.
 * En RN, .utc().tz() no aplica bien el offset, por eso usamos parse directo.
 */
export const fromServer = (value: ConfigType): Dayjs => {
  if (!value) return dayjsLib()

  // Si ya es un objeto dayjs, retornarlo directamente
  if (typeof value === 'object' && value !== null && (value as any).isDayjs) {
    return value as Dayjs
  }

  const str = String(value).trim()
  if (str === 'null' || str === 'undefined' || !str) return dayjsLib()

  // Detectar si es un timestamp ISO o tiene indicadores de zona (Z, +00, etc.)
  const isISO = str.includes('T') || str.includes('Z') || /[\+\-]\d{2}:?\d{2}/.test(str)

  if (isISO) {
    // Es un timestamp (ej: created_at). Queremos shift: 14:45Z → 11:45 Santiago.
    const utcTime = dayjsLib.utc(str)
    const shifted = utcTime.tz(TZ)

    // ✅ Fallback para React Native: si .tz() no aplicó el offset (la hora sigue igual que UTC),
    // usamos .local() que suele ser más confiable para obtener el horario del dispositivo (Santiago).
    if (isReactNative && shifted.hour() === utcTime.hour() && TZ !== 'UTC') {
      const localTime = utcTime.local()
      return localTime.isValid() ? localTime : shifted
    }

    return shifted.isValid() ? shifted : dayjsLib()
  }

  // No es ISO, probablemente "YYYY-MM-DD HH:mm:ss". Lo tratamos como local Santiago (sin shift).
  const converted = dayjsLib(str).tz(TZ, true)
  return converted.isValid() ? converted : dayjsLib()
}

export const fromServerDate = (value: ConfigType): Dayjs => {
  if (!value) return now().startOf('day')

  // Si ya es un objeto dayjs, asegurar que esté en la zona correcta
  if (typeof value === 'object' && value !== null && (value as any).isDayjs) {
    return (value as Dayjs).tz(TZ)
  }

  const str = String(value).trim()
  // Extraer solo la parte de la fecha (YYYY-MM-DD) para evitar ruidos de T00:00:00Z
  const match = str.match(/^(\d{4}-\d{2}-\d{2})/)
  const datePart = match ? match[1] : str

  // Parsear como UTC (para ignorar shift inicial) y mapear a Santiago manteniendo la hora literal
  return dayjsLib.utc(datePart).tz(TZ, true).startOf('day')
}

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
