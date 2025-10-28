import InvitationWizard from '@/components/resident/invitations/InvitationWizard'
import { SKIP_COMMUNITY_AUTO_REDIRECT_KEY } from '@/constants/storageKeys'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'
import { useUser } from '@/providers/user-provider'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function NewInvitationPage() {
  const { session, isLoading: authLoading } = useSupabaseAuth()
  const { id, communitySlug: userCommunitySlug, loading: userLoading } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams()
  const [allowed, setAllowed] = useState(false)

  const routeCommunitySlug = Array.isArray(params.community)
    ? params.community[0]
    : (params.community as string | undefined)

  useEffect(() => {
    if (authLoading || userLoading) return

    if (!session || !id) {
      router.replace('/login')
      return
    }

    const ensureCommunity = async () => {
      const selected =
        (await AsyncStorage.getItem('selected_community')) || userCommunitySlug

      if (!selected) {
        await AsyncStorage.setItem(SKIP_COMMUNITY_AUTO_REDIRECT_KEY, 'true')
        router.replace('../choose-community')
        return
      }

      if (routeCommunitySlug && routeCommunitySlug !== selected) {
        router.replace({ pathname: '/invitations/new', params: { community: selected } })
        return
      }

      setAllowed(true)
    }

    ensureCommunity()
  }, [authLoading, userLoading, session, id, routeCommunitySlug, router, userCommunitySlug])

  if (authLoading || userLoading || !allowed) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <InvitationWizard onExit={() => router.back()} />
      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
})
