import {
  initializeOneSignal,
  loginUser,
  logoutUser,
  syncEmail,
  syncTags,
  updatePushSubscription,
} from '@/lib/notifications/oneSignal'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { InteractionManager } from 'react-native'
import { OneSignal } from 'react-native-onesignal'

import { useUser } from './user-provider'

const PERMISSION_STORAGE_KEY = 'onesignal_permission_prompt'

export function OneSignalProvider({ children }: PropsWithChildren) {
  const { id, email, role, communitySlug, acceptsNotifications, loading } = useUser()
  const [membershipSlugs, setMembershipSlugs] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true

    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        initializeOneSignal().then(isReady => {
          if (mounted && isReady) {
            setReady(true)
          }
        })
      }, 120)
    })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!ready || loading) return

    if (id) {
      void loginUser(id, email)
    } else {
      void logoutUser()
    }
  }, [ready, loading, id, email])

  useEffect(() => {
    if (!ready || loading || !id) return

    if (email) {
      void syncEmail(email)
    } else {
      void syncEmail(null)
    }
  }, [ready, loading, id, email])

  useEffect(() => {
    if (!id) {
      setMembershipSlugs([])
      return
    }

    let active = true

    const fetchMemberships = async () => {
      const { data, error } = await supabase
        .from('user_communities')
        .select('community:community_id(slug)')
        .eq('user_id', id)

      if (error) {
        console.error('[OneSignalProvider] Error cargando comunidades del usuario:', error)
        return
      }

      if (!active) return

      const slugs = (data ?? [])
        .map(entry => entry?.community?.slug)
        .filter((slug): slug is string => Boolean(slug))
        .map(slug => slug.trim().toLowerCase())

      setMembershipSlugs(Array.from(new Set(slugs)))
    }

    fetchMemberships()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (!ready || loading) return

    const handlePermissions = async () => {
      const stored = await AsyncStorage.getItem(PERMISSION_STORAGE_KEY)

      if (!id) {
        await updatePushSubscription(false)
        return
      }

      if (!acceptsNotifications) {
        await updatePushSubscription(false)
        return
      }

      if (stored === 'denied') {
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
  }, [ready, loading, acceptsNotifications, id])

  const tagPayload = useMemo(() => {
    if (!id) return null

    const baseTags: Record<string, string | number | boolean> = {
      user_id: id,
      role: role || 'unknown',
      primary_community: communitySlug || 'none',
      accepts_notifications: acceptsNotifications,
    }

    membershipSlugs.forEach(slug => {
      baseTags[`community_${slug}`] = true
    })

    baseTags.community_memberships = membershipSlugs.length

    return baseTags
  }, [id, role, communitySlug, acceptsNotifications, membershipSlugs])

  useEffect(() => {
    if (!ready || loading) return

    if (!tagPayload) {
      void syncTags({})
      return
    }

    void syncTags(tagPayload)
  }, [ready, loading, tagPayload])

  return <>{children}</>
}
