import dayjsLib, { type ConfigType, type Dayjs } from 'dayjs'
import 'dayjs/locale/es'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjsLib.extend(utc)
dayjsLib.extend(timezone)
dayjsLib.extend(localizedFormat)
dayjsLib.extend(relativeTime)
dayjsLib.locale('es')

const TZ = process.env.EXPO_PUBLIC_TIME_ZONE || 'America/Santiago'
const DATETIME_FORMAT = process.env.EXPO_PUBLIC_DATETIME_FORMAT || 'YYYY-MM-DD HH:mm'
const DATE_FORMAT = process.env.EXPO_PUBLIC_DATE_FORMAT || 'YYYY-MM-DD'
const TIME_FORMAT = process.env.EXPO_PUBLIC_TIME_FORMAT || 'HH:mm'

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
