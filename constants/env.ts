import Constants from 'expo-constants'

type PublicEnvKey =
  | 'EXPO_PUBLIC_SUPABASE_URL'
  | 'EXPO_PUBLIC_SUPABASE_ANON_KEY'
  | 'EXPO_PUBLIC_ONESIGNAL_APP_ID'
  | 'EXPO_PUBLIC_ONESIGNAL_MODE'
  | 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'
  | 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
  | 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'
  | 'EXPO_PUBLIC_URL_VISITME'
  | 'EXPO_PUBLIC_URL_AUTH'
  | 'EXPO_PUBLIC_TIME_ZONE'
  | 'EXPO_PUBLIC_DATETIME_FORMAT'
  | 'EXPO_PUBLIC_DATE_FORMAT'
  | 'EXPO_PUBLIC_TIME_FORMAT'

type PublicEnv = Partial<Record<PublicEnvKey, string | undefined>>

type Extra = {
  publicEnv?: PublicEnv
  supabase?: {
    url?: string
    anonKey?: string
  }
  oneSignal?: {
    appId?: string
    mode?: string
  }
}

const resolveExtra = (): Extra => {
  const expoExtra = (Constants.expoConfig?.extra ?? {}) as Extra
  if (Object.keys(expoExtra).length > 0) {
    return expoExtra
  }

  // Compatibilidad con builds clásicas (manifest)
  const legacyExtra = (Constants.manifest?.extra ?? {}) as Extra
  if (legacyExtra) {
    return legacyExtra
  }

  return {}
}

const extra = resolveExtra()

const publicEnv: PublicEnv = extra.publicEnv ?? {}

const readEnv = (key: PublicEnvKey, fallback?: string): string | undefined => {
  const value = publicEnv[key] ?? process.env[key]
  if (typeof value === 'string' && value.length > 0) {
    return value
  }

  if (typeof fallback === 'string') {
    return fallback
  }

  return undefined
}

export const env = {
  supabaseUrl: extra.supabase?.url ?? readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: extra.supabase?.anonKey ?? readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  oneSignalAppId: extra.oneSignal?.appId ?? readEnv('EXPO_PUBLIC_ONESIGNAL_APP_ID'),
  oneSignalMode: extra.oneSignal?.mode ?? readEnv('EXPO_PUBLIC_ONESIGNAL_MODE', 'development'),
  googleAndroidClientId: readEnv('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
  googleIosClientId: readEnv('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  googleWebClientId: readEnv('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  visitmeUrl: readEnv('EXPO_PUBLIC_URL_VISITME', 'https://app.visitme.cl'),
  authBaseUrl: readEnv('EXPO_PUBLIC_URL_AUTH'),
  timezone: readEnv('EXPO_PUBLIC_TIME_ZONE', 'America/Santiago'),
  datetimeFormat: readEnv('EXPO_PUBLIC_DATETIME_FORMAT', 'YYYY-MM-DD HH:mm'),
  dateFormat: readEnv('EXPO_PUBLIC_DATE_FORMAT', 'YYYY-MM-DD'),
  timeFormat: readEnv('EXPO_PUBLIC_TIME_FORMAT', 'HH:mm'),
}

export const ensureEnv = (value: string | undefined, key: string): string => {
  if (!value) {
    throw new Error(
      `Missing environment variable "${key}". Asegúrate de definirla en tu archivo .env o en la configuración de EAS Build.`,
    )
  }

  return value
}
