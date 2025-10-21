import dayjsLib, { type ConfigType, type Dayjs } from 'dayjs'
import 'dayjs/locale/es'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

// 🔧 Plugins
dayjsLib.extend(utc)
dayjsLib.extend(timezone)
dayjsLib.extend(localizedFormat)
dayjsLib.extend(relativeTime)
dayjsLib.locale('es')

// 🔹 Variables (usa EXPO_PUBLIC_ en vez de NEXT_PUBLIC_)
const TZ = process.env.EXPO_PUBLIC_TIME_ZONE || 'America/Santiago'
const DATETIME_FORMAT = process.env.EXPO_PUBLIC_DATETIME_FORMAT || 'YYYY-MM-DD HH:mm'
const DATE_FORMAT = process.env.EXPO_PUBLIC_DATE_FORMAT || 'YYYY-MM-DD'
const TIME_FORMAT = process.env.EXPO_PUBLIC_TIME_FORMAT || 'HH:mm'

// 🔹 Wrappers
export const dayjs = (value?: ConfigType): Dayjs => dayjsLib(value).tz(TZ)
export const now = (): Dayjs => dayjs()
export const fromServer = (value: ConfigType): Dayjs => dayjsLib.utc(value).tz(TZ)

/**
 * Algunas tablas (por ejemplo, reservas) almacenan fechas sin información de hora.
 * Al convertir desde UTC se debe mantener la fecha original para evitar que se
 * "corra" un día al ajustar la zona horaria.
 */
export const fromServerDate = (value: ConfigType): Dayjs => dayjsLib.utc(value).tz(TZ, true)

export const format = (value: ConfigType, fmt: string = DATETIME_FORMAT): string =>
  fromServer(value).format(fmt)

export const formatDate = (value: ConfigType): string => format(value, DATE_FORMAT)
export const formatTime = (value: ConfigType): string => format(value, TIME_FORMAT)
export const fromNow = (value: ConfigType): string => fromServer(value).fromNow()
export const toServerUTC = (value: ConfigType): string => dayjs(value).utc().toISOString()
export const getTZ = (): string => TZ

export default dayjs
