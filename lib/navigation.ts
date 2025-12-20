import { router } from 'expo-router'

/**
 * Helper para navegar desde servicios externos (como OneSignal)
 * En Expo Router, el objeto `router` se puede importar estáticamente.
 * Sin embargo, para mayor seguridad, envolvemos la llamada.
 */
export function navigateToDeepLink(route: string, params: Record<string, any> = {}) {
  console.log(`[Navigation] 🚀 Attempting router.push to: ${route} with params:`, JSON.stringify(params))
  
  try {
    // @ts-ignore - Expo router types can be strict with dynamic strings
    router.push({ pathname: route, params })
    console.log('[Navigation] ✅ Router.push called successfully')
  } catch (error) {
    console.error('[Navigation] ❌ Error executing router.push:', error)
  }
}
