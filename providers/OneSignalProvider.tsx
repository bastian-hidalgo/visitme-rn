import {
  initializeOneSignal,
  loginUser,
  logoutUser,
  syncEmail,
  syncTags,
  updatePushSubscription,
} from '@/lib/notifications/oneSignal'
import {
  ensureCurrentPlayerSynced,
  registerPushSubscriptionListener,
} from '@/lib/notifications/oneSignalSync'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { InteractionManager } from 'react-native'
import { OneSignal } from 'react-native-onesignal'

import { useUser } from './user-provider'

const PERMISSION_STORAGE_KEY = 'onesignal_permission_prompt'

export function OneSignalProvider({ children }: PropsWithChildren) {
  const { id, email, role, communitySlug, communityId, acceptsNotifications, loading } = useUser()
  const [memberships, setMemberships] = useState<{ id: string; slug: string }[]>([])
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
      setMemberships([])
      return
    }

    let active = true

    const fetchMemberships = async () => {
      const { data, error } = await supabase
        .from('user_communities')
        .select('community_id, community:community_id(id,slug)')
        .eq('user_id', id)

      if (error) {
        console.error('[OneSignalProvider] Error cargando comunidades del usuario:', error)
        return
      }

      if (!active) return

      const uniqueById = new Map<string, { id: string; slug: string }>()

      ;(data ?? []).forEach(entry => {
        const slug = entry?.community?.slug?.trim().toLowerCase()
        const commId = entry?.community?.id ?? entry?.community_id

        if (!slug || !commId) return
        uniqueById.set(commId, { id: commId, slug })
      })

      setMemberships(Array.from(uniqueById.values()))
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
    if (!ready || loading || !id || !communityId) return

    const cleanup = registerPushSubscriptionListener(id, communityId)

    void ensureCurrentPlayerSynced(id, communityId)

    return () => {
      cleanup?.()
    }
  }, [ready, loading, id, communityId])

  useEffect(() => {
    if (!ready || loading || !id || !communityId || !acceptsNotifications) return

    void ensureCurrentPlayerSynced(id, communityId)
  }, [ready, loading, id, communityId, acceptsNotifications])

  return <>{children}</>
}
