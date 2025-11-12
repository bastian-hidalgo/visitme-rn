import { LinearGradient } from 'expo-linear-gradient'
import { MotiView } from 'moti'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

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
  const { reservations, refreshAll } = useResidentContext()

  // Estado del banner de reserva (hoy / mañana / pasada)
  const { status, formattedDate } = getReservationBannerStatus(reservations)

  const scrollViewRef = useRef<ScrollView>(null)
  const insets = useSafeAreaInsets()

  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({})
  const [refreshing, setRefreshing] = useState(false)

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
                <View style={styles.sectionSurface}>
                  <HeroBanner reservationStatus={status} reservationDate={formattedDate} />
                </View>
              </MotiView>

              {/* Encuestas */}
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
    marginBottom: 24,
    shadowColor: 'rgba(256, 256, 256, 0)',
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    backgroundColor: '#FFFFFF'
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
