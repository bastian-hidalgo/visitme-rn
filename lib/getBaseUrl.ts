import { env } from '@/constants/env'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

export function getBaseUrl(): string {
  // 🔹 En entornos móviles (React Native / Expo)
  if (Platform.OS !== 'web') {
    return env.visitmeUrl || Constants.expoConfig?.extra?.apiUrl || 'https://app.visitme.cl'
  }

  // 🔹 En web (Navegador)
  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname, port } = window.location
    // Si estamos en desarrollo web (puerto 8081/19006, etc), preferimos la URL de la API
    if (hostname === 'localhost' || hostname.includes('192.168.')) {
      return env.visitmeUrl || 'https://app.visitme.cl'
    }
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`
  }

  return env.visitmeUrl || 'https://app.visitme.cl'
}
