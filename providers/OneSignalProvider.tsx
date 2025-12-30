import { navigateToDeepLink } from '@/lib/navigation'
import {
  initializeOneSignal,
  loginUser,
  logoutUser,
  syncTags,
  updatePushSubscription
} from '@/lib/notifications/oneSignal'
import {
  ensureCurrentPlayerSynced,
  registerPushSubscriptionListener,
} from '@/lib/notifications/oneSignalSync'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import { OneSignal } from 'react-native-onesignal'

import { useUser } from './user-provider'

const PERMISSION_STORAGE_KEY = 'onesignal_permission_prompt'

// 🛡️ Global guard to ensure only one listener is EVER added to the SDK
let globalClickListenerAdded = false

export function OneSignalProvider({ children }: PropsWithChildren) {
  const { id, email, role, communitySlug, communityId, acceptsNotifications, loading } = useUser()
  const [memberships, setMemberships] = useState<{ id: string; slug: string }[]>([])
  const [ready, setReady] = useState(false)
  const clickHandlerRef = useRef<(event: any) => void>(null)
  const lastNotificationIdRef = useRef<string | null>(null)

  // 1. Efecto único para inicialización y listeners globales (Clicks)
  useEffect(() => {
    let mounted = true

    // Definimos el handler estable
    const handleNotificationClick = (event: any) => {
      const { notification } = event
      const notificationId = notification.notificationId
      
      // 🛡️ Debounce simple: ignorar si es el mismo ID en menos de 2s
      if (lastNotificationIdRef.current === notificationId) {
        return
      }
      lastNotificationIdRef.current = notificationId
      setTimeout(() => { if (lastNotificationIdRef.current === notificationId) lastNotificationIdRef.current = null }, 2000)

      const data = notification.additionalData
      if (!data) return
      
      if (data.route === 'encomienda' || data.type === 'package-arrived') {
        const parcelId = data.parcel_id || data.id
        navigateToDeepLink('/(tabs)', { parcelId })
      } 
      else if (data.route === 'reservation') {
        const id = data.id || data.reservation_id
        if (id) navigateToDeepLink('/reservations/[id]', { id })
      }
      else if (data.type === 'ALERTA' || data.route === 'alerta' || data.route === 'alert' || data.type === 'info') {
        const alertId = data.id || data.alert_id
        console.log(`[OneSignal] 📢 Processing ALERT notification. ID: ${alertId}`)
        navigateToDeepLink('/(tabs)', { alertId })
      } else {
        console.log('[OneSignal] ❓ Unknown notification type. No specific routing applied.')
      }
    }

    // @ts-ignore
    clickHandlerRef.current = handleNotificationClick

    // Inicializar OneSignal
    console.log('[OneSignalProvider] 🟢 Mounting Provider')
    initializeOneSignal().then(isReady => {
      if (mounted && isReady) {
        if (!globalClickListenerAdded) {
          console.log('[OneSignalProvider] Adding GLOBAL click listener')
          OneSignal.Notifications.addEventListener('click', handleNotificationClick)
          globalClickListenerAdded = true
        } else {
          console.log('[OneSignalProvider] 🛡️ Global click listener already exists. Skipping add.')
        }
        setReady(true)
      }
    })

    return () => {
      mounted = false
    }
  }, []) // 👈 Sin dependencias

  // 2. Efecto para Login/Logout y Permisos (Depende de usuario y ready)
  useEffect(() => {
    if (!ready || loading) return

    if (id) {
      void loginUser(id, email)
    } else {
      void logoutUser()
    }
    
    // Manejo de permisos basado en estado del usuario
    const handlePermissions = async () => {
      const stored = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY)

      if (!id || !acceptsNotifications || stored === 'denied') {
        await updatePushSubscription(false)
        return
      }

      if (stored === 'granted') {
        await updatePushSubscription(true)
        return
      }

      try {
        const permission = await OneSignal.Notifications?.requestPermission?.(true)
        const granted = Boolean(permission)
        await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, granted ? 'granted' : 'denied')
        await updatePushSubscription(granted)
      } catch (err) {
        console.error('[OneSignalProvider] Error solicitando permiso', err)
        await AsyncStorage.setItem(PERMISSION_STORAGE_KEY, 'denied')
        await updatePushSubscription(false)
      }
    }

    void handlePermissions()

  }, [ready, loading, id, email, acceptsNotifications])

  const membershipSlugs = useMemo(() => memberships.map(m => m.slug), [memberships])

  const tagPayload = useMemo(() => {
    if (!id) return null

    const normalizedEmail = email?.trim().toLowerCase() || undefined
    const normalizedPrimaryCommunity = communitySlug?.trim().toLowerCase() || 'none'
    const baseTags: Record<string, string | number | boolean> = {
      user_id: id,
      role: role || 'resident',
      primary_community: normalizedPrimaryCommunity,
      community_memberships: membershipSlugs.length,
      accepts_notifications: acceptsNotifications,
    }

    if (normalizedEmail) {
      baseTags.email = normalizedEmail
    }

    membershipSlugs.forEach(slug => {
      baseTags[`community_${slug}`] = true
    })

    return baseTags
  }, [id, email, role, communitySlug, acceptsNotifications, membershipSlugs])

  useEffect(() => {
    if (!ready || loading) return

    if (!tagPayload) {
      void syncTags({})
      return
    }

    void syncTags(tagPayload)
  }, [ready, loading, tagPayload])

  useEffect(() => {
    if (!ready || loading) return

    if (!id) {
      console.log('[OneSignal] Sync omitido: usuario no autenticado todavía')
      return
    }

    if (!communityId) {
      console.log('[OneSignal] Sync omitido: communityId no disponible aún')
      return
    }

    const cleanup = registerPushSubscriptionListener(id, communityId)

    void ensureCurrentPlayerSynced(id, communityId)

    return () => {
      cleanup?.()
    }
  }, [ready, loading, id, communityId])

  useEffect(() => {
    if (!ready || loading) return
    if (!id || !communityId) return
    if (!acceptsNotifications) {
      console.log('[OneSignal] Sync omitido: usuario no acepta notificaciones')
      return
    }

    console.log('[OneSignal] Sync explícito por acceptsNotifications=true')
    void ensureCurrentPlayerSynced(id, communityId)
  }, [ready, loading, id, communityId, acceptsNotifications])

  return <>{children}</>
}
