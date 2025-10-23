import { ThemedText } from '@/components/themed-text'
import { ThemedView } from '@/components/themed-view'
import { supabase } from '@/lib/supabase'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'
import { useUser } from '@/providers/user-provider'
import type { CommunityMembershipRow } from '@/types/communities'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native'

const AnimatedImage = Animated.createAnimatedComponent(Image)

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
  const { session, isLoading: authLoading } = useSupabaseAuth()
  const { setUserData } = useUser()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDarkMode = colorScheme === 'dark'

  const [communities, setCommunities] = useState<CommunityOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectingId, setSelectingId] = useState<string | null>(null)

  const scrollY = useRef(new Animated.Value(0)).current
  const { height: windowHeight } = useWindowDimensions()

  const loadCommunities = useCallback(async () => {
    setLoading(true)
    setError(null)
    setCommunities([])

    try {
      if (!session?.user) {
        await AsyncStorage.multiRemove(SESSION_CACHE_KEYS)
        router.replace('/login')
        return
      }

      const { data, error: membershipsError } = await supabase
        .from('user_communities')
        .select('community:community_id(id, slug, name)')
        .eq('user_id', session.user.id)
        .returns<CommunityMembershipRow[]>()

      if (membershipsError) throw membershipsError

      const formatted = (data ?? [])
        .map((entry) => entry.community)
        .filter((c): c is { id: string; slug: string; name: string | null } => !!c?.id && !!c?.slug)
        .map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name?.trim() || c.slug,
        }))

      if (formatted.length === 0) {
        setError('No encontramos comunidades asociadas a tu cuenta.')
        return
      }

      setCommunities(formatted)
    } catch (err) {
      console.error('[choose-community] loadCommunities error', err)
      setError('No pudimos cargar tus comunidades. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }, [session, router])

  useEffect(() => {
    if (!authLoading) loadCommunities()
  }, [authLoading, loadCommunities])

  const handleSelect = async (community: CommunityOption) => {
    setSelectingId(community.id)
    try {
      await AsyncStorage.multiSet([
        [SELECTED_COMMUNITY_KEY, community.slug],
        [SELECTED_COMMUNITY_ID_KEY, community.id],
        [SELECTED_COMMUNITY_NAME_KEY, community.name],
      ])
      await setUserData({
        communitySlug: community.slug,
        communityId: community.id,
        communityName: community.name,
      })
      await AsyncStorage.removeItem(SKIP_COMMUNITY_AUTO_REDIRECT_KEY)
      router.replace({ pathname: '/(tabs)', params: { community: community.slug } })
    } catch (err) {
      console.error('[choose-community] handleSelect error', err)
      Alert.alert('Ups, algo falló', 'No pudimos ingresar a la comunidad seleccionada.')
    } finally {
      setSelectingId(null)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } finally {
      await AsyncStorage.multiRemove(SESSION_CACHE_KEYS)
      router.replace('/login')
    }
  }

  const parallaxOffset = scrollY.interpolate({
    inputRange: [-180, 0, 240],
    outputRange: [-90, 0, 60],
    extrapolate: 'clamp',
  })

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C5CE7" />
        <Text style={styles.loadingText}>Cargando tus comunidades...</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      style={{ flex: 1, backgroundColor: '#0f172a' }}
    >
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { minHeight: windowHeight }]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      >
        <View style={[styles.background, { minHeight: windowHeight }]}>
          {/* Fondo parallax */}
          <View pointerEvents="none" style={styles.decorations}>
            <AnimatedImage
              source={require('@/assets/backgrounds/loading-illustration.webp')}
              style={[
                styles.backgroundImage,
                { transform: [{ scale: 1.16 }, { translateY: parallaxOffset }] },
              ]}
              resizeMode="cover"
            />
          </View>

          {/* Card principal */}
          <View style={[styles.contentWrapper, { minHeight: windowHeight }]}>
            <ThemedView
              lightColor="#ffffff"
              darkColor="#111827"
              style={[styles.card, styles.cardDark]}
            >
              {/* Logo dinámico */}
              <View style={styles.logoContainer}>
                <Image
                  source={
                    isDarkMode
                      ? require('@/assets/logo-white.png') // 🌙 versión nocturna
                      : require('@/assets/logo.png')       // ☀️ versión normal
                  }
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <ThemedText type="title" style={styles.title}>
                Elige tu comunidad
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Selecciona la comunidad a la que deseas ingresar para continuar.
              </ThemedText>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={loadCommunities} style={styles.retryButton}>
                    <Text style={styles.retryText}>Reintentar</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.communityList}>
                  {communities.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => handleSelect(c)}
                      disabled={!!selectingId && selectingId !== c.id}
                      style={styles.communityButton}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.communityName}>{c.name}</Text>
                      {selectingId === c.id ? (
                        <ActivityIndicator size="small" color="#6C5CE7" />
                      ) : (
                        <Text style={styles.enterText}>Ingresar</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity onPress={handleSignOut}>
                <Text style={styles.signOutText}>Usar otra cuenta</Text>
              </TouchableOpacity>
            </ThemedView>
          </View>
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  background: { flex: 1, overflow: 'hidden' },
  decorations: { ...StyleSheet.absoluteFillObject },
  backgroundImage: { ...StyleSheet.absoluteFillObject, opacity: 0.55 },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 24,
    padding: 32,
    gap: 24,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#1f2937',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardDark: { borderWidth: 1, borderColor: '#1f2937', shadowOpacity: 0.25 },
  logoContainer: { alignItems: 'center', gap: 12 },
  logo: { width: 180, height: 52, borderRadius: 16 },
  title: { textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#fff' },
  subtitle: { textAlign: 'center', color: '#CBD5F5', fontSize: 14 },
  communityList: { width: '100%', gap: 12 },
  communityButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  communityName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  enterText: { color: '#6C5CE7', fontWeight: '600', fontSize: 14 },
  signOutText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'underline',
  },
  errorBox: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderColor: 'rgba(244,63,94,0.4)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  errorText: { color: '#fecdd3', textAlign: 'center', marginBottom: 8 },
  retryButton: {
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: '#CBD5F5', marginTop: 12 },
})
