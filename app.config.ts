import { loadProjectEnv, logLoadedEnv } from '@expo/env';
import type { ConfigContext, ExpoConfig } from 'expo/config';

const projectRoot = process.cwd();

try {
  const envInfo = loadProjectEnv(projectRoot, { silent: true });
  logLoadedEnv(envInfo, { silent: true });
} catch (error) {
  console.warn('No se pudieron cargar las variables de entorno desde los archivos .env:', error);
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
] as const;

type PublicEnvKey = (typeof PUBLIC_ENV_KEYS)[number];

type PublicEnv = Partial<Record<PublicEnvKey, string | undefined>>;

const collectPublicEnv = (): PublicEnv => {
  return PUBLIC_ENV_KEYS.reduce<PublicEnv>((acc, key) => {
    const value = process.env[key];
    if (typeof value === 'string') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const publicEnv = collectPublicEnv();
  const oneSignalMode = publicEnv.EXPO_PUBLIC_ONESIGNAL_MODE ?? 'development';

  return {
    ...config,
    name: 'Visitme',
    slug: 'visitme-app',
    version: '1.52.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'visitmeapp',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'cl.visitme.app',
      usesAppleSignIn: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Visitme necesita acceder a tu ubicación para ofrecer funciones relacionadas con tu comunidad y visitas cercanas.',
        NSPhotoLibraryUsageDescription:
          'Visitme necesita acceso a tu galería para que puedas seleccionar una foto de perfil.',
        NSCameraUsageDescription:
          'Visitme necesita acceso a la cámara si deseas tomar una nueva foto de perfil.',
        NSMicrophoneUsageDescription:
          'Visitme podría usar tu micrófono para grabaciones en funciones futuras.',
        ITSAppUsesNonExemptEncryption: false,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              'com.googleusercontent.apps.211418787779-sriiok9em6j73qj5vtb24e30qglmhd4j'
            ],
          },
        ],
        GIDClientID:
          '211418787779-sriiok9em6j73qj5vtb24e30qglmhd4j.apps.googleusercontent.com',
        GIDServerClientID:
          '211418787779-e6vpo0jbucmua4hiuro63v57jia39hco3.apps.googleusercontent.com',
      },
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
      versionCode: 52,
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
          image: './assets/images/favicon.png',
          resizeMode: 'contain',
          backgroundColor: '#4a6aac',
          dark: {
            image: './assets/images/favicon.png',
            backgroundColor: '#4a6aac',
          },
          ios: {
            enableFullScreenImage_legacy: true,
            image: './assets/images/splash.png',
            resizeMode: 'cover',
          },
          android: {
            image: './assets/images/favicon.png',
            resizeMode: 'contain',
            backgroundColor: '#4a6aac',
            enableLegacy: false
          }
        }
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
  };
};
