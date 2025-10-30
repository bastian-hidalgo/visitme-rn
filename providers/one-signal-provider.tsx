import { PropsWithChildren, useEffect } from 'react'

import { initializeOneSignal, loginOneSignalUser, updatePushSubscription } from '@/lib/notifications/oneSignal'
import { useUser } from './user-provider'

export function OneSignalProvider({ children }: PropsWithChildren) {
  const { id, acceptsNotifications, loading } = useUser()

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

  return <>{children}</>
}
