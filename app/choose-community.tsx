import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'

import { supabase } from '@/lib/supabase/client'
import type { CommunityMembershipRow } from '@/types/communities'

const SELECTED_COMMUNITY_KEY = 'selected_community'
const SELECTED_COMMUNITY_ID_KEY = 'selected_community_id'
const SELECTED_COMMUNITY_NAME_KEY = 'selected_community_name'
const SKIP_COMMUNITY_AUTO_REDIRECT_KEY = 'skip_auto_redirect'
const SESSION_CACHE_KEYS = [
  'visitme_user',
  SELECTED_COMMUNITY_KEY,
  SELECTED_COMMUNITY_ID_KEY,
  SELECTED_COMMUNITY_NAME_KEY,
  SKIP_COMMUNITY_AUTO_REDIRECT_KEY,
]

interface CommunityOption {
  id: string
  slug: string
  name: string
}

export default function ChooseCommunityScreen() {
  const router = useRouter()
  const [communities, setCommunities] = useState<CommunityOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const colorScheme = useColorScheme()

  const loadCommunities = useCallback(async () => {
    setLoading(true)
    setError(null)
    setCommunities([])

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      const userId = session?.user?.id
      if (!userId) {
        await AsyncStorage.multiRemove(SESSION_CACHE_KEYS)
        router.replace('/signin')
        return
      }

      const { data, error: membershipsError } = await supabase
        .from('user_communities')
        .select('community:community_id(id, slug, name)')
        .eq('user_id', userId)
        .returns<CommunityMembershipRow[]>()

      if (membershipsError) {
        throw membershipsError
      }

      const formatted = (data ?? [])
        .map((entry) => entry.community)
        .filter(
          (community): community is { id: string; slug: string; name: string | null } =>
            Boolean(community?.id && community?.slug)
        )
        .map((community) => ({
          id: community.id,
          slug: community.slug,
          name: community.name?.trim() || community.slug,
        }))

      if (formatted.length === 0) {
        setError('No encontramos comunidades asociadas a tu cuenta. Contacta a tu administrador.')
        return
      }

      setCommunities(formatted)
    } catch (err) {
      console.error('[choose-community] loadCommunities error', err)
      setError('No pudimos cargar tus comunidades. Intenta nuevamente en unos momentos.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadCommunities()
  }, [loadCommunities])

  const handleSelect = useCallback(
    async (community: CommunityOption) => {
      setSelectingId(community.id)
      try {
        await AsyncStorage.multiSet([
          [SELECTED_COMMUNITY_KEY, community.slug],
          [SELECTED_COMMUNITY_ID_KEY, community.id],
          [SELECTED_COMMUNITY_NAME_KEY, community.name],
        ])
        await AsyncStorage.removeItem(SKIP_COMMUNITY_AUTO_REDIRECT_KEY)

        router.replace({ pathname: '/(tabs)', params: { community: community.slug } })
      } catch (err) {
        console.error('[choose-community] handleSelect error', err)
        Alert.alert('Ups, algo falló', 'No pudimos ingresar a la comunidad seleccionada. Intenta nuevamente.')
      } finally {
        setSelectingId(null)
      }
    },
    [router]
  )

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      await AsyncStorage.multiRemove(SESSION_CACHE_KEYS)
      router.replace('/signin')
    }
  }, [router])

  if (loading) {
    return (
      <View style={[styles.loadingContainer, colorScheme === 'dark' && styles.loadingContainerDark]}>
        <ActivityIndicator size="large" color="#7e22ce" />
        <Text style={[styles.loadingText, colorScheme === 'dark' && styles.loadingTextDark]}>
          Cargando tus comunidades...
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, colorScheme === 'dark' && styles.containerDark]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={styles.content}>
          <View
            style={[
              styles.card,
              colorScheme === 'dark' && styles.cardDark,
            ]}
          >
            <Text style={[styles.title, colorScheme === 'dark' && styles.titleDark]}>
              Elige tu comunidad
            </Text>
            <Text style={[styles.subtitle, colorScheme === 'dark' && styles.subtitleDark]}>
              Selecciona la comunidad a la que deseas ingresar para continuar.
            </Text>

            {error ? (
              <View style={styles.errorContainer}>
                <View
                  style={[
                    styles.errorBox,
                    colorScheme === 'dark' && styles.errorBoxDark,
                  ]}
                >
                  <Text style={[styles.errorText, colorScheme === 'dark' && styles.errorTextDark]}>
                    {error}
                  </Text>
                </View>
                <TouchableOpacity onPress={loadCommunities} activeOpacity={0.85} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.communityList}>
                {communities.map((community) => (
                  <TouchableOpacity
                    key={community.id}
                    onPress={() => handleSelect(community)}
                    disabled={Boolean(selectingId && selectingId !== community.id)}
                    activeOpacity={0.85}
                    style={[
                      styles.communityButton,
                      colorScheme === 'dark' && styles.communityButtonDark,
                    ]}
                  >
                    <View style={styles.communityInfo}>
                      <Text style={[styles.communityName, colorScheme === 'dark' && styles.communityNameDark]}>
                        {community.name}
                      </Text>
                      <Text
                        style={[
                          styles.communitySlug,
                          colorScheme === 'dark' && styles.communitySlugDark,
                        ]}
                      >
                        {community.slug}
                      </Text>
                    </View>
                    {selectingId === community.id ? (
                      <ActivityIndicator size="small" color="#7e22ce" />
                    ) : (
                      <Text style={styles.communityAction}>Ingresar</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity onPress={handleSignOut} activeOpacity={0.75} style={styles.signOutButton}>
              <Text
                style={[
                  styles.signOutText,
                  colorScheme === 'dark' && styles.signOutTextDark,
                ]}
              >
                Usar otra cuenta
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  loadingContainerDark: {
    backgroundColor: '#020617',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  loadingTextDark: {
    color: '#cbd5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#e5e7eb',
  },
  containerDark: {
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  card: {
    width: '100%',
    maxWidth: 576,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  cardDark: {
    borderColor: '#334155',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    color: '#0f172a',
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
    color: '#475569',
  },
  subtitleDark: {
    color: '#cbd5f5',
  },
  errorContainer: {
    marginTop: 32,
    width: '100%',
    gap: 16,
  },
  errorBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorBoxDark: {
    borderColor: 'rgba(244, 63, 94, 0.4)',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#be123c',
  },
  errorTextDark: {
    color: '#fecdd3',
  },
  retryButton: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#7e22ce',
    paddingVertical: 12,
  },
  retryButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  communityList: {
    marginTop: 32,
    width: '100%',
    gap: 12,
  },
  communityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  communityButtonDark: {
    borderColor: '#334155',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  communityInfo: {
    flex: 1,
    paddingRight: 16,
  },
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  communityNameDark: {
    color: '#ffffff',
  },
  communitySlug: {
    marginTop: 4,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#64748b',
  },
  communitySlugDark: {
    color: '#94a3b8',
  },
  communityAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7e22ce',
  },
  signOutButton: {
    marginTop: 40,
  },
  signOutText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  signOutTextDark: {
    color: '#94a3b8',
  },
})
