import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutChangeEvent, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useResidentContext } from '@/components/contexts/ResidentContext'
import FeedbackPanel from '@/components/resident/FeedbackPanel'
import Header from '@/components/resident/Header'
import HeroBanner from '@/components/resident/HeroBanner'
import InvitationsSlider from '@/components/resident/InvitationsSlider'
import NewsDetailModal from '@/components/resident/NewsDetailModal'
import NewsSlider from '@/components/resident/NewsSlider'
import PackageSlider from '@/components/resident/PackageSlider'
import QuickAccess from '@/components/resident/QuickAccess'
import ReservationsSlider from '@/components/resident/ReservationsSlider'
import SurveyPanel from '@/components/resident/SurveyPanel'
import SurveysSlider from '@/components/resident/SurveysSlider'
import UserMenuPanel from '@/components/resident/sidepanels/UserMenuPanel'
import getReservationBannerStatus from '@/lib/getReservationsBannerStatus'
import getUrlImageFromStorage from '@/lib/getUrlImageFromStorage'
import { format, fromNow } from '@/lib/time'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { PackageDetailSheet } from './PackageDetailSheet'

export default function ResidentDashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuProgress = useSharedValue(0)
  useEffect(() => {
    menuProgress.value = withTiming(isMenuOpen ? 1 : 0, { duration: 300 })
  }, [isMenuOpen, menuProgress])
  const dashboardStyle = useAnimatedStyle(() => {
    const progress = menuProgress.value
    return {
      transform: [
        { translateX: -progress * 120 },
        { scale: 1 - progress * 0.1 },
        { rotateY: `${progress * 8}deg` },
      ],
      borderRadius: progress * 26,
      shadowOpacity: progress ? 0.3 : 0,
    }
  })
  const { packages, selectedParcel, setParcelDetail, setPendingParcelId, setPendingAlertId, setPendingReservationId, reservations, refreshAll, surveys } = useResidentContext()
  const { parcelId, alertId, reservationId } = useLocalSearchParams<{ parcelId: string; alertId: string; reservationId: string }>()

  const router = useRouter()

  // 🆔 Instance tracking for debugging
  const instanceIdRef = useRef(Math.random().toString(36).substring(7))
  const processedParcelIdRef = useRef<string | null>(null)
  const processedAlertIdRef = useRef<string | null>(null)
  const processedReservationIdRef = useRef<string | null>(null)

  useEffect(() => {
    console.log(`[ResidentDashboard] 🧩 Instance ${instanceIdRef.current} MOUNTED. Params:`, JSON.stringify({ parcelId, alertId }))
    return () => console.log(`[ResidentDashboard] 🧩 Instance ${instanceIdRef.current} UNMOUNTED`)
  }, [])

  // 🔹 Manejo de Deep Link de Notificación (Paquetes)
  useEffect(() => {
    if (parcelId && parcelId !== processedParcelIdRef.current) {
      console.log(`[ResidentDashboard] (${instanceIdRef.current}) 🚀 New parcelId detected: ${parcelId}. Forwarding to context.`)
      processedParcelIdRef.current = parcelId
      setPendingParcelId(parcelId)
      
      // Limpiar el parámetro después de un pequeño delay para no interferir con la apertura
      setTimeout(() => {
        router.setParams({ parcelId: undefined })
      }, 500)
    }
  }, [parcelId, setPendingParcelId, router])

  // 🔹 Manejo de Deep Link de Notificación (Alertas)
  useEffect(() => {
    if (alertId && alertId !== processedAlertIdRef.current) {
      console.log(`[ResidentDashboard] (${instanceIdRef.current}) 🚀 New alertId detected: ${alertId}. Forwarding to context.`)
      processedAlertIdRef.current = alertId
      setPendingAlertId(alertId)
      
      setTimeout(() => {
        router.setParams({ alertId: undefined })
      }, 500)
    }
  }, [alertId, setPendingAlertId, router])

  // 🔹 Manejo de Deep Link de Notificación (Reservas)
  useEffect(() => {
    if (reservationId && reservationId !== processedReservationIdRef.current) {
      console.log(`[ResidentDashboard] (${instanceIdRef.current}) 🚀 New reservationId detected: ${reservationId}. Forwarding to context.`)
      processedReservationIdRef.current = reservationId
      setPendingReservationId(reservationId)
      
      setTimeout(() => {
        router.setParams({ reservationId: undefined })
      }, 500)
    }
  }, [reservationId, setPendingReservationId, router])

  // Estado del banner de reserva (hoy / mañana / pasada)
  const { status, formattedDate } = getReservationBannerStatus(reservations)

  const scrollViewRef = useRef<ScrollView>(null)
  const insets = useSafeAreaInsets()

  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({})
  const [refreshing, setRefreshing] = useState(false)

  const packageSheetRef = useRef<BottomSheetModal>(null)
  const hasPresentedPackage = useRef<string | null>(null)

  // 🔹 Efecto para sincronizar el ref de la hoja con el estado del contexto
  useEffect(() => {
    if (selectedParcel && packageSheetRef.current) {
      if (hasPresentedPackage.current !== selectedParcel.id) {
        console.log(`[ResidentDashboard] 🏁 NEW selection: ${selectedParcel.id}. Calling present().`)
        packageSheetRef.current.present()
        hasPresentedPackage.current = selectedParcel.id
      }
    } else if (!selectedParcel) {
      hasPresentedPackage.current = null
    }
  }, [selectedParcel])

  const registerSection = (sectionId: string) => ({ nativeEvent }: LayoutChangeEvent) => {
    setSectionPositions((prev) => ({
      ...prev,
      [sectionId]: nativeEvent.layout.y,
    }))
  }

  const handleNavigateToSection = (sectionId: string) => {
    const y = sectionPositions[sectionId]
    if (scrollViewRef.current && typeof y === 'number') {
      scrollViewRef.current.scrollTo({ y: Math.max(0, y - 32), animated: true })
    }
  }

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshAll()
    } finally {
      setRefreshing(false)
    }
  }, [refreshAll])

  const contentPaddingBottom = useMemo(() => insets.bottom + 160, [insets.bottom])

  return (
    <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ flex: 1 }}
        >
          <Animated.View style={[styles.screen, dashboardStyle]}>
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: contentPaddingBottom,
                paddingTop: 24,
              }}
              style={{backgroundColor: '#FFFFFF'}}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={['#7C3AED']}
                  tintColor="#7C3AED"
                />
              }
            >
              {/* Header */}
              <View style={[styles.sectionWrapper, styles.sectionHeader]}>
                <Header
                  onToggleMenu={() => setIsMenuOpen(true)}
                  progress={menuProgress}
                />
              </View>

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500 }}
                style={styles.sectionWrapper}
                onLayout={registerSection('hero')}
              >
                <View style={[styles.sectionSurface, styles.heroSurface]}>
                  <HeroBanner reservationStatus={status} reservationDate={formattedDate} />
                </View>
              </MotiView>

              {/* Encuestas */}
              {surveys.length > 0 && (
                <MotiView
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: 100, duration: 400 }}
                  style={styles.sectionWrapper}
                >
                  <View style={styles.sectionSurface}>
                    <SurveysSlider />
                  </View>
                </MotiView>
              )}

              {/* Noticias */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 200, duration: 400 }}
                style={styles.sectionWrapper}
                onLayout={registerSection('news')}
              >
                <View style={styles.sectionSurface}>
                  <NewsSlider />
                </View>
              </MotiView>

              {/* Encomiendas */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 500, duration: 400 }}
                style={styles.sectionWrapper}
                onLayout={registerSection('packages')}
              >
                <View style={styles.sectionSurface}>
                  <PackageSlider />
                </View>
              </MotiView>

              {/* Reservas */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 300, duration: 400 }}
                style={styles.sectionWrapper}
                onLayout={registerSection('reservations')}
              >
                <View style={styles.sectionSurface}>
                  <ReservationsSlider />
                </View>
              </MotiView>

              {/* Invitaciones */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 400, duration: 400 }}
                style={styles.sectionWrapper}
                onLayout={registerSection('invited')}
              >
                <View style={styles.sectionSurface}>
                  <InvitationsSlider />
                </View>
              </MotiView>
            </ScrollView>

            {/* Quick Access (fijo inferior) */}
            <MotiView
              from={{ translateY: 120, scale: 0.9 }}
              animate={{ translateY: 10, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 160,
                damping: 24,
                delay: 700,
              }}
              style={[styles.quickAccessWrapper, { paddingBottom: insets.bottom + 12 }]}
            >
              <View style={styles.quickAccessInner}>
                <QuickAccess onNavigate={handleNavigateToSection} />
              </View>
            </MotiView>
          </Animated.View>
          <NewsDetailModal />

          {/* Siempre montado para estabilidad de refs, pero solo 'presentado' si hay selección */}
          <PackageDetailSheet
            ref={packageSheetRef}
            {...useMemo(() => {
              const p = selectedParcel
              const fallbackImage = 'https://www.visitme.cl/img/placeholder-package.webp'
              
              if (!p) {
                return {
                  imageUrl: fallbackImage,
                  status: 'Recibida' as const,
                  date: '',
                  receivedAtLabel: '',
                }
              }

              const statusKey = (p.status ?? 'received') as 'received' | 'pending' | 'picked_up' | 'cancelled'
              const labels: Record<string, any> = { received: 'Recibida', pending: 'Esperando', picked_up: 'Retirada', cancelled: 'Anulada' }
              const imageUrl = p.photo_url ? getUrlImageFromStorage(p.photo_url, 'parcel-photos') || fallbackImage : fallbackImage
              const summaryPrefix = statusKey === 'picked_up' ? 'Retirada' : 'Recibida'
              const summaryBaseDate = p.picked_up_at || p.created_at
              const summaryDate = summaryBaseDate ? format(summaryBaseDate, 'DD MMM • HH:mm') : 'Sin fecha'
              
              return {
                imageUrl,
                status: labels[statusKey] ?? 'Recibida',
                apartment: p.department?.number ? String(p.department.number) : undefined,
                date: `${summaryPrefix} • ${summaryDate}`,
                receivedAtLabel: format(p.created_at, 'DD MMM YYYY • HH:mm'),
                receivedRelativeLabel: p.created_at ? fromNow(p.created_at) : undefined,
                pickedUpAtLabel: p.picked_up_at ? format(p.picked_up_at, 'DD MMM YYYY • HH:mm') : undefined,
                pickedUpRelativeLabel: p.picked_up_at ? fromNow(p.picked_up_at) : undefined,
                signatureCompleted: Boolean(p.signature_url),
                signatureImageUrl: p.signature_url ? getUrlImageFromStorage(p.signature_url, 'parcel-photos') : undefined,
                detailDescription: (p as any).description,
              }
            }, [selectedParcel])}
            onClose={() => {
              console.log(`[ResidentDashboard] 🚪 PackageDetailSheet onClose triggered. Clearing selection.`)
              setParcelDetail(null)
            }}
          />
        </LinearGradient>
        <UserMenuPanel
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          progress={menuProgress}
        />
        <SurveyPanel />
        <FeedbackPanel />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  sectionWrapper: {
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF'
  },
  sectionHeader: {
    paddingBottom: 8,
  },
  sectionSurface: {
    marginBottom: 8,
    shadowColor: 'rgba(256, 256, 256, 0)',
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    backgroundColor: '#FFFFFF'
  },
  heroSurface: {
    marginBottom: 0,
  },
  placeholder: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  placeholderText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 14,
  },
  quickAccessWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  quickAccessInner: {
    width: '90%',
    maxWidth: 420,
  },
})
