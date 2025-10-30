import OneSignal from 'react-native-onesignal'

// Solo inicializamos una vez
let initialized = false

// Se obtiene el App ID desde tu .env
const ONESIGNAL_APP_ID = process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID

// Inicializa OneSignal de forma segura
export const initializeOneSignal = () => {
  if (initialized) return

  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] Falta EXPO_PUBLIC_ONESIGNAL_APP_ID en tu entorno (.env)')
    return
  }

  try {
    // Inicialización principal
    OneSignal.initialize(ONESIGNAL_APP_ID)

    // Recomendado: solicitar permisos automáticamente la primera vez
    OneSignal.Notifications.requestPermission(true)

    // Configurar comportamiento al abrir una notificación
    OneSignal.Notifications.addEventListener('click', event => {
      console.log('[OneSignal] Notificación abierta:', event.notification)
      // Aquí podrías hacer navegación o tracking
    })

    // Configurar listener cuando se recibe una notificación
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', event => {
      console.log('[OneSignal] Notificación recibida en foreground:', event.notification)
      // Muestra la notificación (por defecto la suprime)
      event.getNotification().display()
    })

    initialized = true
    console.log('[OneSignal] Inicializado correctamente')
  } catch (error) {
    console.error('[OneSignal] Error al inicializar SDK:', error)
  }
}

// Inicia sesión con un usuario (para segmentar notificaciones)
export const loginOneSignalUser = (userId: string | null) => {
  if (!initialized) initializeOneSignal()

  try {
    if (userId) {
      OneSignal.login(userId)
      console.log(`[OneSignal] Usuario logueado: ${userId}`)
    } else {
      OneSignal.logout()
      console.log('[OneSignal] Usuario deslogueado')
    }
  } catch (error) {
    console.error('[OneSignal] Error en login/logout del usuario:', error)
  }
}

// Actualiza si el usuario tiene activadas las notificaciones
export const updatePushSubscription = (enabled: boolean) => {
  if (!initialized) initializeOneSignal()

  try {
    OneSignal.User.pushSubscription.optIn = enabled
    console.log(`[OneSignal] Push ${enabled ? 'activadas' : 'desactivadas'}`)
  } catch (error) {
    console.error('[OneSignal] Error al actualizar la suscripción push:', error)
  }
}

// Solicita permisos de notificación manualmente
export const promptForPushPermission = async (): Promise<boolean> => {
  if (!initialized) initializeOneSignal()

  try {
    const granted = await OneSignal.Notifications.requestPermission(true)
    console.log('[OneSignal] Permiso de notificación:', granted)
    return Boolean(granted)
  } catch (error) {
    console.error('[OneSignal] Error al solicitar permiso:', error)
    return false
  }
}

// Cierra sesión del usuario actual
export const logoutOneSignalUser = () => {
  loginOneSignalUser(null)
}
