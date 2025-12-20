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
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { OneSignal } from 'react-native-onesignal'

import { useUser } from './user-provider'

const PERMISSION_STORAGE_KEY = 'onesignal_permission_prompt'

export function OneSignalProvider({ children }: PropsWithChildren) {
  const { id, email, role, communitySlug, communityId, acceptsNotifications, loading } = useUser()
  const [memberships, setMemberships] = useState<{ id: string; slug: string }[]>([])
  const [ready, setReady] = useState(false)

  // 1. Efecto único para inicialización y listeners globales (Clicks)
  useEffect(() => {
    let mounted = true

    // Listener de clicks en notificaciones (Global)
    const handleNotificationClick = (event: any) => {
      console.log('🔴🔴🔴 [OneSignal] CLICK LISTENER FIRED! 🔴🔴🔴')
      console.log('--------------------------------------------------')
      console.log('[OneSignal] Notification Clicked Event Received')

      const { notification } = event
      const data = notification.additionalData

      console.log('[OneSignal] Full Notification Object:', JSON.stringify(notification, null, 2))
      console.log('[OneSignal] Additional Data:', JSON.stringify(data, null, 2))

      if (!data) {
        console.log('[OneSignal] No additional data found. Do nothing.')
        return
      }

      // Usar nuestro helper para navegar con seguridad
      // 1. Manejo de Encomiendas
      if (data.route === 'encomienda') {
        const id = data.id || data.encomienda_id
        console.log(`[OneSignal] Processing ENCOMIENDA route. ID: ${id}`)
        if (id) {
          console.log('[OneSignal] Navigating to /packages/[id]')
          navigateToDeepLink('/packages/[id]', { id })
        } else {
            console.warn('[OneSignal] Missing ID for ENCOMIENDA')
        }
      } 
      // 2. Manejo de Reservas
      else if (data.route === 'reserva') {
        const id = data.id || data.reservation_id
        console.log(`[OneSignal] Processing RESERVA route. ID: ${id}`)
        if (id) {
          console.log('[OneSignal] Navigating to /reservations/[id]')
          navigateToDeepLink('/reservations/[id]', { id })
        } else {
            console.warn('[OneSignal] Missing ID for RESERVA')
        }
      }
      // 3. Manejo de Alertas
      else if (data.type === 'ALERTA' || data.route === 'alerta') {
        console.log('[OneSignal] Processing ALERTA/route')
        navigateToDeepLink('/alerts/index', {
          title: data.title || notification.title,
          message: data.message || notification.body,
          type: data.type || 'ALERTA',
          // Pass additional standard fields if available
          id: data.id,
          created_at: data.created_at,
          image_url: data.image_url
        })
      } else {
        console.log('[OneSignal] Unknown route/type in data:', data)
      }
      console.log('--------------------------------------------------')
    }

    // Inicializar OneSignal
    console.log('[OneSignalProvider] 🟢 Mounting Provider - triggering init immediately')
    
    // Eliminamos retardos artificiales localmente para asegurar el listener ASAP
    initializeOneSignal().then(isReady => {
      console.log('[OneSignalProvider] 🟢 Initialization done. isReady:', isReady)
      if (mounted && isReady) {
        // SOLO agregar el listener cuando OneSignal esté inicializado
        console.log('[OneSignalProvider] Adding click listener')
        OneSignal.Notifications.addEventListener('click', handleNotificationClick)
        setReady(true)
      }
    })

    return () => {
      mounted = false
      // Es seguro llamar removeEventListener incluso si no se agregó, o podríamos chequear ready, 
      // pero para evitar memory leaks en desmontajes rápidos, lo dejamos.
      // Sin embargo, si init no terminó, esto podría (raramente) fallar si el SDK no está listo.
      // Pero 'removeEventListener' suele ser seguro. De todos modos, try/catch por si acaso.
      try {
        console.log('[OneSignalProvider] Removing click listener')
        OneSignal.Notifications.removeEventListener('click', handleNotificationClick)
      } catch(e) {
        console.warn('[OneSignalProvider] Error removing listener (might not be inited)', e)
      }
    }
  }, []) // 👈 Sin dependencias, corre siempre al montar el provider

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
