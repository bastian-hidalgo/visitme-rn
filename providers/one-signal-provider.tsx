import {
  initializeOneSignal,
  loginOneSignalUser,
  promptForPushPermission,
  syncOneSignalEmail,
  syncOneSignalTags,
  updatePushSubscription,
} from '@/lib/notifications/oneSignal'
import { usePathname } from 'expo-router'
import { PropsWithChildren, useEffect, useRef } from 'react'
import { useUser } from './user-provider'

export function OneSignalProvider({ children }: PropsWithChildren) {
  const { id, email, role, communitySlug, acceptsNotifications, loading } = useUser()
  const pathname = usePathname()
  const permissionRequestedRef = useRef(false)

  useEffect(() => {
    initializeOneSignal()
  }, [])

  useEffect(() => {
    if (loading) return

    if (email) {
      loginOneSignalUser({ email, userId: id })
    } else if (id) {
      loginOneSignalUser({ userId: id })
    } else {
      loginOneSignalUser(null)
    }
  }, [email, id, loading])

  useEffect(() => {
    if (loading) return

    if (!id) {
      updatePushSubscription(false)
      permissionRequestedRef.current = false
      return
    }

    updatePushSubscription(acceptsNotifications)

    if (!acceptsNotifications) {
      permissionRequestedRef.current = false
    }
  }, [acceptsNotifications, id, loading])

  useEffect(() => {
    if (loading) return
    if (!id) return
    if (!acceptsNotifications) return

    const isOnDashboard = pathname?.startsWith('/(tabs)')
    if (!isOnDashboard) return
    if (permissionRequestedRef.current) return

    permissionRequestedRef.current = true
    promptForPushPermission()
  }, [acceptsNotifications, id, loading, pathname])

  // 🔹 Sincronizar email y tags
  useEffect(() => {
    if (loading || !id) return

    if (acceptsNotifications && email) {
      void syncOneSignalEmail(email)
    } else if (!acceptsNotifications || !email) {
      void syncOneSignalEmail(null)
    }

    syncOneSignalTags({
      role: role || 'unknown',
      community: communitySlug || 'none',
      accepts_notifications: acceptsNotifications,
    })
  }, [id, email, role, communitySlug, acceptsNotifications, loading])

  return <>{children}</>
}
