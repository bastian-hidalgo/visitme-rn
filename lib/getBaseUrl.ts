// lib/getBaseUrl.ts
import Constants from 'expo-constants'

import { env } from '@/constants/env'

export function getBaseUrl(): string {
  // 🔹 En entornos móviles (React Native / Expo)
  // Usa la variable de entorno pública
  if (typeof window === 'undefined') {
    return env.visitmeUrl || Constants.expoConfig?.extra?.apiUrl || 'https://app.visitme.cl'
  }

  // 🔹 En web (Next.js o navegador)
  const { protocol, hostname, port } = window.location
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`
}
