import { InteractionManager, Platform } from 'react-native'
import OneSignal from 'react-native-onesignal'

import { env } from '@/constants/env'
import {
  ensureCurrentPlayerSynced,
  getCurrentPlayerId,
  registerPushSubscriptionListener,
} from './oneSignalSync'

const APP_ID = env.oneSignalAppId
const LOG = '[OneSignal]'
const ERR = '[OneSignal:ERR]'

const isOneSignalAvailable = () => {
  const hasModule = Boolean((OneSignal as unknown as { initialize?: unknown })?.initialize)
  if (!hasModule) {
    console.error(
      `${ERR} Módulo nativo OneSignal no disponible (¿prebuild/Dev Client faltante o plugin no aplicado?)`,
    )
  }
  return hasModule
}

let initialized = false
let initializingPromise: Promise<boolean> | null = null
let lastExternalId: string | null = null
let lastEmail: string | null = null
let lastTags: Record<string, string> = {}
let lastListenerKey: string | null = null
let listenerCleanup: (() => void) | null = null

const log = (msg: string, ...args: unknown[]) => console.log(`${LOG} ${msg}`, ...args)
const logError = (msg: string, ...args: unknown[]) => console.error(`${ERR} ${msg}`, ...args)
const warn = (msg: string, ...args: unknown[]) => console.warn(`${LOG} ${msg}`, ...args)

const waitForNativeReady = async () =>
  new Promise<void>(resolve => {
    InteractionManager.runAfterInteractions(() => setTimeout(resolve, 120))
  })

const ensureSupportedPlatform = () => {
  if (Platform.OS === 'web') {
    warn('SDK omitido en web')
    return false
  }
  return true
}

export const initializeOneSignal = async (): Promise<boolean> => {
  if (initialized) return true
  if (initializingPromise) return initializingPromise
  if (!ensureSupportedPlatform()) return false

  if (!APP_ID) {
    logError('Falta EXPO_PUBLIC_ONESIGNAL_APP_ID en el entorno')
    return false
  }

  initializingPromise = (async () => {
    try {
      await waitForNativeReady()
      if (!isOneSignalAvailable()) {
        return false
      }
      OneSignal.initialize(APP_ID)

      OneSignal.Notifications?.addEventListener?.('click', event => {
        log('Notificación abierta', event?.notification?.notificationId)
      })

      OneSignal.Notifications?.addEventListener?.('foregroundWillDisplay', event => {
        const notificationId = event?.notification?.notificationId
        log('Notificación en foreground', notificationId)
        event?.getNotification?.()?.display?.()
      })

      initialized = true
      log('Inicializado correctamente')
      return true
    } catch (error) {
      logError('Error inicializando OneSignal', error)
      return false
    } finally {
      initializingPromise = null
    }
  })()

  return initializingPromise
}

export const promptForPushPermission = async (): Promise<boolean> => {
  const ready = await initializeOneSignal()
  if (!ready) return false

  try {
    const permission = await OneSignal.Notifications?.requestPermission?.(true)
    const granted = Boolean(permission)
    await updatePushSubscription(granted)
    return granted
  } catch (error) {
    logError('Error solicitando permiso de notificaciones', error)
    await updatePushSubscription(false)
    return false
  }
}

export const updatePushSubscription = async (enabled: boolean) => {
  const ready = await initializeOneSignal()
  if (!ready) return

  try {
    const pushSubscription = OneSignal.User?.pushSubscription
    if (!pushSubscription) {
      warn('pushSubscription aún no disponible')
      return
    }

    if (enabled) {
      pushSubscription.optIn?.()
    } else {
      pushSubscription.optOut?.()
    }

    log(`Push ${enabled ? 'activadas' : 'desactivadas'}`)
  } catch (error) {
    logError('No se pudo actualizar pushSubscription', error)
  }
}

export const syncEmail = async (email: string | null) => {
  const ready = await initializeOneSignal()
  if (!ready) return

  const normalized = email?.trim().toLowerCase() || null
  if (normalized === lastEmail) return

  try {
    if (normalized) {
      await OneSignal.User?.addEmail?.(normalized)
      lastEmail = normalized
      log(`Email sincronizado: ${normalized}`)
    } else if (lastEmail) {
      await OneSignal.User?.removeEmail?.(lastEmail)
      lastEmail = null
      log('Email removido de OneSignal')
    }
  } catch (error) {
    logError('No se pudo sincronizar email', error)
  }
}

export const syncTags = async (tags: Record<string, string | number | boolean>) => {
  const ready = await initializeOneSignal()
  if (!ready) return

  const next = Object.entries(tags).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[key] = String(value)
    return acc
  }, {})

  const keysToRemove = Object.keys(lastTags).filter(key => !(key in next))

  try {
    await Promise.all(
      keysToRemove.map(async key => {
        try {
          await OneSignal.User?.removeTag?.(key)
        } catch (error) {
          logError(`Error removiendo tag ${key}`, error)
        }
      }),
    )

    await Promise.all(
      Object.entries(next).map(async ([key, value]) => {
        if (lastTags[key] === value) return
        await OneSignal.User?.addTag?.(key, value)
      }),
    )

    lastTags = next
    log('Tags sincronizados', next)
  } catch (error) {
    logError('No se pudieron sincronizar tags', error)
  }
}

export const loginUser = async (
  userId?: string | null,
  email?: string | null,
  communityId?: string | null,
) => {
  if (!userId) {
    warn('login omitido: falta userId')
    return
  }

  const ready = await initializeOneSignal()
  if (!ready) return

  if (lastExternalId !== userId) {
    try {
      OneSignal.login(userId)
      lastExternalId = userId
      log(`Usuario logueado con external_id ${userId}`)
    } catch (error) {
      logError('No se pudo hacer login en OneSignal', error)
    }
  }

  if (email !== undefined) {
    await syncEmail(email)
  }

  if (communityId) {
    const listenerKey = `${userId}-${communityId}`
    if (listenerCleanup && listenerKey !== lastListenerKey) {
      listenerCleanup()
    }
    if (!listenerCleanup || listenerKey !== lastListenerKey) {
      listenerCleanup = registerPushSubscriptionListener(userId, communityId)
      lastListenerKey = listenerKey
    }

    await ensureCurrentPlayerSynced(userId, communityId)
  }
}

export const logoutUser = async () => {
  if (!initialized) return

  try {
    OneSignal.logout()
    lastExternalId = null
    await syncEmail(null)
    await syncTags({})
    listenerCleanup?.()
    listenerCleanup = null
    lastListenerKey = null
    log('Usuario deslogueado de OneSignal')
  } catch (error) {
    logError('Error en logout de OneSignal', error)
  }
}

export const getPlayerId = async (): Promise<string | null> => {
  const ready = await initializeOneSignal()
  if (!ready) return null

  return getCurrentPlayerId()
}
