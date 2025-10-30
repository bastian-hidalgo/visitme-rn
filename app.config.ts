import type { ConfigContext, ExpoConfig } from 'expo/config'
import { loadProjectEnv, logLoadedEnv } from '@expo/env'

const projectRoot = process.cwd()

try {
  const envInfo = loadProjectEnv(projectRoot, { silent: true })
  logLoadedEnv(envInfo, { silent: true })
} catch (error) {
  console.warn('No se pudieron cargar las variables de entorno desde los archivos .env:', error)
}

const PUBLIC_ENV_KEYS = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_ONESIGNAL_APP_ID',
  'EXPO_PUBLIC_ONESIGNAL_MODE',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  'EXPO_PUBLIC_URL_VISITME',
  'EXPO_PUBLIC_URL_AUTH',
  'EXPO_PUBLIC_TIME_ZONE',
  'EXPO_PUBLIC_DATETIME_FORMAT',
  'EXPO_PUBLIC_DATE_FORMAT',
  'EXPO_PUBLIC_TIME_FORMAT',
] as const

type PublicEnvKey = (typeof PUBLIC_ENV_KEYS)[number]

type PublicEnv = Partial<Record<PublicEnvKey, string | undefined>>

const collectPublicEnv = (): PublicEnv => {
  return PUBLIC_ENV_KEYS.reduce<PublicEnv>((acc, key) => {
    const value = process.env[key]
    if (typeof value === 'string') {
      acc[key] = value
    }
    return acc
  }, {})
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const publicEnv = collectPublicEnv()
  const oneSignalMode = publicEnv.EXPO_PUBLIC_ONESIGNAL_MODE ?? 'development'

  return {
    ...config,
    name: 'visitme-app',
    slug: 'visitme-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'visitmeapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'cl.visitme.app',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: 'cl.visitme.app',
      permissions: ['android.permission.RECORD_AUDIO'],
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash.png',
          resizeMode: 'cover',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'Permite a Visite acceder a tus fotos.',
        },
      ],
      [
        'onesignal-expo-plugin',
        {
          mode: oneSignalMode,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      router: {},
      eas: {
        projectId: '4e8f5104-2d4b-482f-930b-02f83a7005d9',
      },
      publicEnv,
      supabase: {
        url: publicEnv.EXPO_PUBLIC_SUPABASE_URL ?? '',
        anonKey: publicEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      },
      oneSignal: {
        appId: publicEnv.EXPO_PUBLIC_ONESIGNAL_APP_ID ?? '',
        mode: oneSignalMode,
      },
    },
  }
}
