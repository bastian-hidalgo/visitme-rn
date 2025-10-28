import ResidentDashboard from '@/components/resident/ResidentDashboard'
import { SKIP_COMMUNITY_AUTO_REDIRECT_KEY } from '@/constants/storageKeys'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'
import { useUser } from '@/providers/user-provider'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import Toast from 'react-native-toast-message'

export default function ResidentPage() {
  const { session, isLoading: authLoading } = useSupabaseAuth()
  const { id, communitySlug: userCommunitySlug, loading: userLoading } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams()
  const [allowed, setAllowed] = useState(false)

  const routeCommunitySlug = params.community as string

  useEffect(() => {
    if (authLoading || userLoading) return
    if (!session || !id) {
      router.replace('/login')
      return
    }

    const checkCommunity = async () => {
      setAllowed(false)

      const selected =
        (await AsyncStorage.getItem('selected_community')) || userCommunitySlug

      if (!selected) {
        await AsyncStorage.setItem(SKIP_COMMUNITY_AUTO_REDIRECT_KEY, 'true')
        router.replace('../choose-community')
        return
      }

      if (!routeCommunitySlug) {
        router.replace({ pathname: '/(tabs)', params: { community: selected } })
        return
      }

      if (selected !== routeCommunitySlug) {
        await AsyncStorage.setItem(SKIP_COMMUNITY_AUTO_REDIRECT_KEY, 'true')
        router.replace('../choose-community')
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
