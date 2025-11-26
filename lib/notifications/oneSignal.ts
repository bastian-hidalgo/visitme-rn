import { InteractionManager, Platform } from 'react-native'
import { OneSignal } from 'react-native-onesignal'

import { env } from '@/constants/env'

const ONESIGNAL_APP_ID = env.oneSignalAppId
const LOG_PREFIX = '[OneSignal]'

let initialized = false
let initializingPromise: Promise<boolean> | null = null
let lastLoggedInUserId: string | null = null
let lastSyncedEmail: string | null = null
let lastSyncedTags: Record<string, string> = {}

const log = (message: string, ...args: unknown[]) => {
  console.log(`${LOG_PREFIX} ${message}`, ...args)
}

const warn = (message: string, ...args: unknown[]) => {
  console.warn(`${LOG_PREFIX} ${message}`, ...args)
}

const error = (message: string, ...args: unknown[]) => {
  console.error(`${LOG_PREFIX} ${message}`, ...args)
}

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
    addEmail?: (email: string) => Promise<void>
    removeEmail?: (email?: string) => Promise<void>
    addTag?: (key: string, value: string) => Promise<void>
    removeTag?: (key: string) => Promise<void>
    pushSubscription?: {
      optIn?: () => unknown
      optOut?: () => unknown
    }
  }
}

const getOneSignal = (): OneSignalModule | undefined => {
  if (Platform.OS === 'web') {
    warn('SDK no disponible en plataforma web, se omite la inicialización')
    return undefined
  }

  const oneSignal = OneSignal as unknown as OneSignalModule | undefined

  if (!oneSignal?.initialize) {
    warn(
      'SDK nativo no disponible. Asegúrate de usar una build con el plugin de OneSignal instalado.',
    )
    return undefined
  }

  return oneSignal
}

const waitForNativeReady = async () =>
  new Promise<void>(resolve => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(resolve, 120)
    })
  })

export const initializeOneSignal = async (): Promise<boolean> => {
  if (initialized) return true
  if (initializingPromise) return initializingPromise

  if (!ONESIGNAL_APP_ID) {
    warn('Falta EXPO_PUBLIC_ONESIGNAL_APP_ID en tu entorno (.env)')
    return false
  }

  const oneSignal = getOneSignal()
  if (!oneSignal) return false

  initializingPromise = (async () => {
    try {
      await waitForNativeReady()
      oneSignal.initialize?.(ONESIGNAL_APP_ID)

      oneSignal.Notifications?.addEventListener?.('click', event => {
        log('Notificación abierta', event?.notification?.notificationId)
      })

      oneSignal.Notifications?.addEventListener?.('foregroundWillDisplay', event => {
        log('Notificación recibida en foreground', event?.notification?.notificationId)
        event?.getNotification?.()?.display?.()
      })

      initialized = true
      log('Inicializado correctamente')
      return true
    } catch (err) {
      error('Error al inicializar SDK', err)
      return false
    } finally {
      initializingPromise = null
    }
  })()

  return initializingPromise
}

export const loginUser = async (userId?: string | null, email?: string | null) => {
  if (!userId) {
    warn('login omitido: userId no disponible')
    return
  }

  const ready = await initializeOneSignal()
  if (!ready) return

  if (lastLoggedInUserId === userId) {
    log(`Usuario ya logueado: ${userId}`)
  } else {
    try {
      const oneSignal = getOneSignal()
      if (!oneSignal) return

      oneSignal.login?.(userId)
      lastLoggedInUserId = userId
      log(`Usuario logueado con external_id ${userId}`)
    } catch (err) {
      error('Error en login del usuario', err)
    }
  }

  if (email) {
    await syncEmail(email)
  }
}

export const logoutUser = async () => {
  if (!initialized) {
    warn('logout omitido: SDK aún no inicializado')
    return
  }

  try {
    const oneSignal = getOneSignal()
    if (!oneSignal) return

    oneSignal.logout?.()
    lastLoggedInUserId = null
    await syncEmail(null)
    await syncTags({})
    lastSyncedEmail = null
    log('Usuario deslogueado de OneSignal')
  } catch (err) {
    error('Error al hacer logout', err)
  }
}

export const syncEmail = async (email: string | null) => {
  const ready = await initializeOneSignal()
  if (!ready) return

  const oneSignal = getOneSignal()
  if (!oneSignal) return

  try {
    const normalizedEmail = email?.trim().toLowerCase() || null
    if (lastSyncedEmail === normalizedEmail) return

    if (normalizedEmail) {
      await oneSignal.User?.addEmail?.(normalizedEmail)
      lastSyncedEmail = normalizedEmail
      log(`Email sincronizado: ${normalizedEmail}`)
    } else if (lastSyncedEmail) {
      await oneSignal.User?.removeEmail?.(lastSyncedEmail)
      lastSyncedEmail = null
      log('Email removido de OneSignal')
    }
  } catch (err) {
    error('Error al sincronizar email', err)
  }
}

export const syncTags = async (tags: Record<string, string | number | boolean>) => {
  const ready = await initializeOneSignal()
  if (!ready) return

  const oneSignal = getOneSignal()
  if (!oneSignal) return

  try {
    const normalizedEntries = Object.entries(tags).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        acc[key] = String(value)
        return acc
      },
      {},
    )

    const keysToRemove = Object.keys(lastSyncedTags).filter(key => !(key in normalizedEntries))

    await Promise.all(
      keysToRemove.map(async key => {
        try {
          await oneSignal.User?.removeTag?.(key)
        } catch (err) {
          error(`Error al remover tag ${key}`, err)
        }
      }),
    )

    await Promise.all(
      Object.entries(normalizedEntries).map(async ([key, value]) => {
        if (lastSyncedTags[key] === value) return
        await oneSignal.User?.addTag?.(key, value)
      }),
    )

    lastSyncedTags = normalizedEntries
    log('Tags sincronizados', normalizedEntries)
  } catch (err) {
    error('Error al sincronizar tags', err)
  }
}

export const updatePushSubscription = async (enabled: boolean) => {
  const ready = await initializeOneSignal()
  if (!ready) return

  try {
    const oneSignal = getOneSignal()
    if (!oneSignal) return

    const pushSubscription = oneSignal.User?.pushSubscription

    if (!pushSubscription) {
      warn('pushSubscription no disponible todavía')
      return
    }

    if (enabled) {
      pushSubscription.optIn?.()
    } else {
      pushSubscription.optOut?.()
    }

    log(`Push ${enabled ? 'activadas' : 'desactivadas'}`)
  } catch (err) {
    error('Error al actualizar la suscripción push', err)
  }
}

export const promptForPushPermission = async (): Promise<boolean> => {
  const ready = await initializeOneSignal()
  if (!ready) return false

  try {
    const permission = await OneSignal.Notifications?.requestPermission?.(true)
    const granted = Boolean(permission)
    await updatePushSubscription(granted)
    return granted
  } catch (err) {
    error('Error al solicitar permiso de notificaciones', err)
    await updatePushSubscription(false)
    return false
  }
}
