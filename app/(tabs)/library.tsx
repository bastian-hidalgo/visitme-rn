import DocumentCard from '@/components/resident/documents/DocumentCard'
import { SKIP_COMMUNITY_AUTO_REDIRECT_KEY } from '@/constants/storageKeys'
import {
  COMMUNITY_DOCUMENT_CATEGORY_OPTIONS,
  sortCommunityDocuments,
  type CommunityDocument,
  type CommunityDocumentCategory,
} from '@/lib/community-documents'
import { supabase } from '@/lib/supabase'
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'
import { useUser } from '@/providers/user-provider'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, FileText, Filter, Search } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

export default function CommunityLibraryScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const { session, isLoading: authLoading } = useSupabaseAuth()
  const { id, communityId, communitySlug: userCommunitySlug, communityName, loading: userLoading } = useUser()
  const insets = useSafeAreaInsets()

  const [allowed, setAllowed] = useState(false)
  const [documents, setDocuments] = useState<CommunityDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | CommunityDocumentCategory>('all')

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
      setAllowed(false)

      const selected = (await AsyncStorage.getItem('selected_community')) || userCommunitySlug

      if (!selected) {
        await AsyncStorage.setItem(SKIP_COMMUNITY_AUTO_REDIRECT_KEY, 'true')
        router.replace('../choose-community')
        return
      }

      if (routeCommunitySlug && routeCommunitySlug !== selected) {
        router.replace({ pathname: '/library', params: { community: selected } })
        return
      }

      setAllowed(true)
    }

    void checkCommunity()
  }, [authLoading, userLoading, session, id, routeCommunitySlug, router, userCommunitySlug])

  const fetchDocuments = useCallback(async () => {
    if (!communityId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('community_documents')
      .select('*')
      .eq('community_id', communityId)
      .order('published_at', { ascending: false })

    if (error) {
      console.error('[CommunityLibraryScreen] Error fetching documents', error)
      Toast.show({ type: 'error', text1: 'No pudimos cargar la biblioteca' })
      setDocuments([])
    } else {
      setDocuments(sortCommunityDocuments(data ?? []))
    }
    setLoading(false)
  }, [communityId])

  useEffect(() => {
    if (!allowed || !communityId) return
    void fetchDocuments()
  }, [allowed, communityId, fetchDocuments])

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return documents.filter((doc) => {
      const category = (doc.category as CommunityDocumentCategory | null) ?? 'otro'
      const matchesCategory = categoryFilter === 'all' || category === categoryFilter
      if (!matchesCategory) return false
      if (!normalizedSearch) return true
      return (
        doc.title.toLowerCase().includes(normalizedSearch) ||
        (doc.description ?? '').toLowerCase().includes(normalizedSearch)
      )
    })
  }, [documents, searchTerm, categoryFilter])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDocuments()
    setRefreshing(false)
  }

  if (authLoading || userLoading || !allowed) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient
        colors={['#7C3AED', '#5B21B6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.heroHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroTitleWrapper}>
            <Text style={styles.heroEyebrow}>Documentos</Text>
            <Text style={styles.heroTitle}>Biblioteca digital</Text>
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              Accede a los archivos públicos de {communityName || 'tu comunidad'} sin salir del dashboard.
            </Text>
          </View>
          <View style={styles.heroIcon}>
            <FileText size={26} color="#FDE68A" />
          </View>
        </View>

        <View style={styles.heroStats}>
          <View>
            <Text style={styles.heroStatNumber}>{documents.length}</Text>
            <Text style={styles.heroStatLabel}>documentos disponibles</Text>
          </View>
          {!loading && (
            <View style={styles.resultBadge}>
              <Text style={styles.resultBadgeText}>
                {filteredDocuments.length} resultado{filteredDocuments.length === 1 ? '' : 's'}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.filtersCard}>
          <View style={styles.searchRow}>
            <View style={styles.searchIcon}>
              <Search size={18} color="#6b7280" />
            </View>
            <TextInput
              placeholder="Buscar por título o descripción"
              placeholderTextColor="#9ca3af"
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchInput}
              autoCorrect={false}
            />
            <Filter size={18} color="#6b7280" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <TouchableOpacity
              onPress={() => setCategoryFilter('all')}
              style={[styles.chip, categoryFilter === 'all' && styles.chipActive]}
            >
              <Text style={[styles.chipText, categoryFilter === 'all' && styles.chipTextActive]}>Todas</Text>
            </TouchableOpacity>
            {COMMUNITY_DOCUMENT_CATEGORY_OPTIONS.map((option) => {
              const isActive = categoryFilter === option.value
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setCategoryFilter(option.value)}
                  style={[styles.chip, isActive && styles.chipActive]}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{option.label}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={styles.loadingText}>Cargando biblioteca...</Text>
          </View>
        ) : filteredDocuments.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <FileText size={28} color="#a78bfa" />
            </View>
            <Text style={styles.emptyTitle}>Aún no hay documentos</Text>
            <Text style={styles.emptyText}>
              Cuando tu administración publique información aquí podrás revisarla desde esta sección.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredDocuments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#7c3aed']}
                tintColor="#7c3aed"
              />
            }
            renderItem={({ item }) => <DocumentCard document={item} />}
          />
        )}
      </View>

      <Toast />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f3ff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f3ff',
  },
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  heroTitleWrapper: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroStats: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStatNumber: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  resultBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  resultBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },
  filtersCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    gap: 12,
    shadowColor: 'rgba(17,24,39,0.08)',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  searchIcon: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  chipsRow: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  chipActive: {
    backgroundColor: '#ede9fe',
    borderColor: '#c4b5fd',
  },
  chipText: {
    color: '#4b5563',
    fontWeight: '700',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#5b21b6',
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    shadowColor: 'rgba(17, 24, 39, 0.06)',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    lineHeight: 20,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 12,
    gap: 12,
  },
})
