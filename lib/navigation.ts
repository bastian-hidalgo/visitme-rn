import { router } from 'expo-router'

/**
 * Helper para navegar desde servicios externos (como OneSignal)
 * En Expo Router, el objeto `router` se puede importar estáticamente.
 * Sin embargo, para mayor seguridad, envolvemos la llamada.
 */
export function navigateToDeepLink(route: string, params: Record<string, any> = {}) {
  console.log(`[Navigation] 🚀 Attempting router.push to: ${route} with params:`, JSON.stringify(params))
  
  try {
    // 🛡️ De-duplicate stack: if going to dashboard, use replace
    if (route === '/(tabs)') {
      router.replace({ pathname: route, params })
      console.log(`[Navigation] ✅ Router.replace called successfully for ${route}`)
    } else {
      router.push({ pathname: route, params })
      console.log(`[Navigation] ✅ Router.push called successfully for ${route}`)
    }
  } catch (error) {
    console.error('[Navigation] ❌ Error executing router.push:', error)
  }
}
