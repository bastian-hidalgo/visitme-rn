import ResidentDashboard from '@/components/resident/ResidentDashboard'
import { SKIP_COMMUNITY_AUTO_REDIRECT_KEY } from '@/constants/storageKeys'
import { promptForPushPermission } from '@/lib/notifications/oneSignal'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'
import { useUser } from '@/providers/user-provider'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import Toast from 'react-native-toast-message'

export default function ResidentPage() {
  const { session, isLoading: authLoading } = useSupabaseAuth()
  const { id, communitySlug: userCommunitySlug, loading: userLoading, acceptsNotifications } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams()
  const [allowed, setAllowed] = useState(false)

  const routeCommunitySlug = Array.isArray(params.community)
    ? params.community[0]
    : (params.community as string | undefined)

  useEffect(() => {
    if (authLoading || userLoading) return

    if (!session) {
      router.replace('/login')
      return
    }

    if (!id) {
      setAllowed(false)
      return
    }

    const checkCommunity = async () => {
      const selected =
        (await AsyncStorage.getItem('selected_community')) || userCommunitySlug

      if (!selected) {
        await AsyncStorage.setItem(SKIP_COMMUNITY_AUTO_REDIRECT_KEY, 'true')
        router.replace('../choose-community')
        return
      }

      if (routeCommunitySlug !== selected) {
        router.replace({ pathname: '/(tabs)', params: { ...params, community: selected } })
        return
      }

      setAllowed(true)
    }

    checkCommunity()
  }, [
    authLoading,
    userLoading,
    session,
    id,
    routeCommunitySlug,
    router,
    userCommunitySlug,
  ])

  useEffect(() => {
    if (!allowed || !id || !acceptsNotifications) return

    let isMounted = true
    const storageKey = `onesignal_prompted_${id}`

    const maybePromptPermission = async () => {
      try {
        const hasPrompted = await AsyncStorage.getItem(storageKey)
        if (hasPrompted) return

        const granted = await promptForPushPermission()

        if (!isMounted) return
        await AsyncStorage.setItem(storageKey, granted ? 'granted' : 'denied')
      } catch (error) {
        console.error('[ResidentPage] Failed to prompt for notifications', error)
      }
    }

    void maybePromptPermission()

    return () => {
      isMounted = false
    }
  }, [allowed, id, acceptsNotifications])

  if (authLoading || userLoading || !allowed) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7e22ce" />
      </View>
    )
  }

  return (
    <>
      <ResidentDashboard />
      <Toast />
    </>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
})
