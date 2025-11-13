import {
  initializeOneSignal,
  loginOneSignalUser,
  syncOneSignalEmail,
  syncOneSignalTags,
  updatePushSubscription,
} from '@/lib/notifications/oneSignal'
import { supabase } from '@/lib/supabase'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { useUser } from './user-provider'

export function OneSignalProvider({ children }: PropsWithChildren) {
  const { id, email, role, communitySlug, acceptsNotifications, loading } = useUser()
  const [membershipSlugs, setMembershipSlugs] = useState<string[]>([])

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
      return
    }

    updatePushSubscription(acceptsNotifications)
  }, [acceptsNotifications, id, loading])

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
    if (loading || !id) return

    if (email) {
      void syncOneSignalEmail(email)
    } else {
      void syncOneSignalEmail(null)
    }
  }, [id, email, loading])

  const tagPayload = useMemo(() => {
    if (!id) return null

    const baseTags: Record<string, string | number | boolean> = {
      role: role || 'unknown',
      primary_community: communitySlug || 'none',
      accepts_notifications: acceptsNotifications,
      user_id: id,
    }

    membershipSlugs.forEach(slug => {
      baseTags[`community_${slug}`] = true
    })

    baseTags.community_memberships = membershipSlugs.length

    return baseTags
  }, [id, role, communitySlug, acceptsNotifications, membershipSlugs])

  useEffect(() => {
    if (loading || !tagPayload) return

    void syncOneSignalTags(tagPayload)
  }, [loading, tagPayload])

  return <>{children}</>
}
