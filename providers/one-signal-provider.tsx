import { initializeOneSignal, loginOneSignalUser, syncOneSignalEmail, syncOneSignalTags, updatePushSubscription } from '@/lib/notifications/oneSignal'
import { PropsWithChildren, useEffect } from 'react'
import { useUser } from './user-provider'

export function OneSignalProvider({ children }: PropsWithChildren) {
  const { id, email, role, communitySlug, acceptsNotifications, loading } = useUser()

  useEffect(() => {
    initializeOneSignal()
  }, [])

  useEffect(() => {
    if (loading) return

    if (id) {
      loginOneSignalUser(id)
    } else {
      loginOneSignalUser(null)
    }
  }, [id, loading])

  useEffect(() => {
    if (loading) return

    if (!id) {
      updatePushSubscription(false)
      return
    }

    updatePushSubscription(acceptsNotifications)
  }, [acceptsNotifications, id, loading])

  // 🔹 Sincronizar email y tags
  useEffect(() => {
    if (loading || !id) return

    if (email) syncOneSignalEmail(email)

    syncOneSignalTags({
      role: role || 'unknown',
      community: communitySlug || 'none',
      accepts_notifications: acceptsNotifications,
    })
  }, [id, email, role, communitySlug, acceptsNotifications, loading])

  return <>{children}</>
}
