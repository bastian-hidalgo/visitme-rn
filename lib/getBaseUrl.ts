// lib/getBaseUrl.ts
import Constants from 'expo-constants'

export function getBaseUrl(): string {
  // 🔹 En entornos móviles (React Native / Expo)
  // Usa la variable de entorno pública
  if (typeof window === 'undefined') {
    return (
      process.env.EXPO_PUBLIC_URL_VISITME ||
      Constants.expoConfig?.extra?.apiUrl ||
      'https://www.visitme.cl'
    )
  }

  // 🔹 En web (Next.js o navegador)
  const { protocol, hostname, port } = window.location
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`
}
