import ResidentDashboard from '@/components/resident/ResidentDashboard'
import { useUser } from '@/providers/UserProvider'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import Toast from 'react-native-toast-message'

const SKIP_COMMUNITY_AUTO_REDIRECT_KEY = 'skip_auto_redirect'

export default function ResidentPage() {
  const { id, communitySlug: userCommunitySlug, loading } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams()
  const [allowed, setAllowed] = useState(false)

  const routeCommunitySlug = params.community as string

  useEffect(() => {
    if (loading || !id) return

    const checkCommunity = async () => {
      const selected =
        (await AsyncStorage.getItem('selected_community')) || userCommunitySlug

      if (!selected || selected !== routeCommunitySlug) {
        await AsyncStorage.setItem(SKIP_COMMUNITY_AUTO_REDIRECT_KEY, 'true')
        router.replace('/choose-community')
        return
      }

      setAllowed(true)
    }

    checkCommunity()
  }, [id, loading, routeCommunitySlug, router, userCommunitySlug])

  if (loading || !allowed) {
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
    backgroundColor: '#e5e7eb',
  },
})
