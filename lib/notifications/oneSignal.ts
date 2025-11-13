import { Platform } from 'react-native'
import { OneSignal } from 'react-native-onesignal'

import { env } from '@/constants/env'

// Solo inicializamos una vez
let initialized = false

// Se obtiene el App ID desde tu .env
const ONESIGNAL_APP_ID = env.oneSignalAppId

type OneSignalNotifications = {
  requestPermission?: (requestOptions?: boolean) => Promise<boolean> | boolean
  addEventListener?: (event: string, listener: (event: any) => void) => void
}

type OneSignalModule = {
  initialize?: (appId: string) => void
  login?: (userId: string) => void
  logout?: () => void
  Notifications?: OneSignalNotifications
  User?: {
    pushSubscription?: {
      optIn?: () => unknown
      optOut?: () => unknown
    }
  }
}

type LoginPayload = {
  email?: string | null
  userId?: string | null
}

const warnOnce = (() => {
  const messages = new Set<string>()

  return (message: string) => {
    if (messages.has(message)) return
    messages.add(message)
    console.warn(message)
  }
})()

const getOneSignal = (): OneSignalModule | undefined => {
  if (Platform.OS === 'web') {
    warnOnce('[OneSignal] SDK no disponible en plataforma web, se omite la inicialización')
    return undefined
  }

  const oneSignal = OneSignal as unknown as OneSignalModule | undefined

  if (!oneSignal?.initialize) {
    warnOnce(
      '[OneSignal] SDK nativo no disponible. Asegúrate de usar una build con el plugin de OneSignal instalado.',
    )
    return undefined
  }

  return oneSignal
}

// Inicializa OneSignal de forma segura
export const initializeOneSignal = () => {
  console.log('[OneSignal] Intentando inicializar...')
  if (initialized) return
  console.log('[OneSignal] No estaba inicializado, procediendo...')

  if (!ONESIGNAL_APP_ID) {
    console.warn('[OneSignal] Falta EXPO_PUBLIC_ONESIGNAL_APP_ID en tu entorno (.env)')
    return
  }

  const oneSignal = getOneSignal()
  if (!oneSignal) return

  try {
    // Inicialización principal
    oneSignal.initialize?.(ONESIGNAL_APP_ID)

    // Configurar comportamiento al abrir una notificación
    oneSignal.Notifications?.addEventListener?.('click', event => {
      console.log('[OneSignal] Notificación abierta:', event?.notification)
      // Aquí podrías hacer navegación o tracking
    })

    // Configurar listener cuando se recibe una notificación
    oneSignal.Notifications?.addEventListener?.('foregroundWillDisplay', event => {
      console.log('[OneSignal] Notificación recibida en foreground:', event?.notification)
      // Muestra la notificación (por defecto la suprime)
      event?.getNotification?.()?.display?.()
    })

    initialized = true
    console.log('[OneSignal] Inicializado correctamente')
  } catch (error) {
    console.error('[OneSignal] Error al inicializar SDK:', error)
  }
}

// Inicia sesión con un usuario (para segmentar notificaciones)
export const loginOneSignalUser = (payload: LoginPayload | null) => {
  if (!initialized) initializeOneSignal()

  const oneSignal = getOneSignal()
  if (!oneSignal) return

  try {
    const email = payload?.email?.trim() || null
    const identifier = email?.toLowerCase() || payload?.userId || null

    if (identifier) {
      oneSignal.login?.(identifier)
      console.log(`[OneSignal] Usuario logueado: ${identifier}`)
    } else {
      oneSignal.logout?.()
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
    const oneSignal = getOneSignal()
    if (!oneSignal) return

    const pushSubscription = oneSignal.User?.pushSubscription

    if (!oneSignal.User) {
      console.warn('[OneSignal] SDK no disponible todavía para actualizar pushSubscription')
      return
    }

    if (!pushSubscription) {
      console.warn('[OneSignal] pushSubscription no disponible')
      return
    }

    if (enabled) {
      pushSubscription.optIn?.()
    } else {
      pushSubscription.optOut?.()
    }

    console.log(`[OneSignal] Push ${enabled ? 'activadas' : 'desactivadas'}`)
  } catch (error) {
    console.error('[OneSignal] Error al actualizar la suscripción push:', error)
  }
}

// Solicita permisos de notificación manualmente
export const promptForPushPermission = async (): Promise<boolean> => {
  if (!initialized) initializeOneSignal()

  const oneSignal = getOneSignal()
  if (!oneSignal) return false

  try {
    const granted = await oneSignal.Notifications?.requestPermission?.(true)
    console.log('[OneSignal] Permiso de notificación:', granted)
    return Boolean(granted)
  } catch (error) {
    console.error('[OneSignal] Error al solicitar permiso:', error)
    return false
  }
}

// Cierra sesión del usuario actual
export const logoutOneSignalUser = () => {
  if (!initialized) {
    console.warn('[OneSignal] logout() omitido: SDK aún no inicializado')
    return
  }

  loginOneSignalUser(null)
  void syncOneSignalEmail(null)
}

let lastSyncedEmail: string | null = null

export const syncOneSignalEmail = async (email: string | null) => {
  if (!initialized) initializeOneSignal()

  const oneSignal = getOneSignal()
  if (!oneSignal) return

  try {
    const normalizedEmail = email?.trim().toLowerCase() || null

    if (lastSyncedEmail === normalizedEmail) {
      return
    }

    if (normalizedEmail) {
      await OneSignal.User.addEmail(normalizedEmail)
      lastSyncedEmail = normalizedEmail
      console.log(`[OneSignal] Email sincronizado: ${email}`)
    } else {
      await OneSignal.User.removeEmail(lastSyncedEmail ?? undefined)
      lastSyncedEmail = null
      console.log('[OneSignal] Email removido de OneSignal')
    }
  } catch (error) {
    console.error('[OneSignal] Error al sincronizar email:', error)
  }
}

// Sincroniza tags personalizados (por ejemplo rol, comunidad, etc.)
export const syncOneSignalTags = (tags: Record<string, string | number | boolean>) => {
  const oneSignal = getOneSignal()
  if (!oneSignal) return

  try {
    for (const [key, value] of Object.entries(tags)) {
      OneSignal.User.addTag(key, String(value))
    }
    console.log('[OneSignal] Tags sincronizados:', tags)
  } catch (error) {
    console.error('[OneSignal] Error al sincronizar tags:', error)
  }
}