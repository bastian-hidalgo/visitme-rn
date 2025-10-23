import { MotiView } from 'moti'
import React, { useMemo, useRef, useState } from 'react'
import {
  Alert,
  LayoutChangeEvent,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { useResidentContext } from '@/components/contexts/ResidentContext'
import Header from '@/components/resident/Header'
import HeroBanner from '@/components/resident/HeroBanner'
import InvitationsSlider from '@/components/resident/InvitationsSlider'
import NewsSlider from '@/components/resident/NewsSlider'
import PackageSlider from '@/components/resident/PackageSlider'
import QuickAccess from '@/components/resident/QuickAccess'
import ReservationsSlider from '@/components/resident/ReservationsSlider'
import SurveysSlider from '@/components/resident/SurveysSlider'
import InvitationPanel from '@/components/resident/sidepanels/InvitationPanel'
import ReservationPanel from '@/components/resident/sidepanels/ReservationPanel'
import getReservationBannerStatus from '@/lib/getReservationsBannerStatus'

export default function ResidentDashboard() {
  const { reservations, isInvitationPanelOpen, isReservationPanelOpen, closePanels } =
    useResidentContext()

  const handleCancelReservation = (id: string) => {
    Alert.alert(
      'Cancelar reserva',
      'Muy pronto podrás gestionar tus reservas desde la aplicación móvil. Por ahora te redirigiremos a la versión web.',
      [
        {
          text: 'Abrir en la web',
          onPress: () => {
            const url = `${process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://app.visitme.cl'}/reservas`
            Linking.openURL(url).catch((error) => {
              console.error('No fue posible abrir la URL de reservas', error)
            })
          },
        },
        { text: 'Cerrar', style: 'cancel' },
      ]
    )
  }

  const handleViewReason = (reason: string) => {
    Alert.alert('Motivo de cancelación', reason)
  }

  // Estado del banner de reserva (hoy / mañana / pasada)
  const { status, formattedDate } = getReservationBannerStatus(reservations)

  const scrollViewRef = useRef<ScrollView>(null)
  const insets = useSafeAreaInsets()
  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({})

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

  const contentPaddingBottom = useMemo(() => insets.bottom + 160, [insets.bottom])

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: contentPaddingBottom,
            paddingTop: 24,
          }}
        >
          {/* Header */}
          <View style={[styles.sectionWrapper, styles.sectionHeader]}>
            <Header />
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

          {/* Reservas */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300, duration: 400 }}
            style={styles.sectionWrapper}
            onLayout={registerSection('reservations')}
          >
            <View style={styles.sectionSurface}>
              <ReservationsSlider
                onCancel={handleCancelReservation}
                onViewReason={handleViewReason}
              />
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

          {/* Placeholder de acciones */}
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Aquí aparecerán tus próximas acciones ✨
            </Text>
          </View>
        </ScrollView>

        {/* Quick Access (fijo inferior) */}
        <MotiView
          from={{ translateY: 120, scale: 0.9 }}
          animate={{ translateY: -12, scale: 1 }}
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
      </View>
      <InvitationPanel isOpen={isInvitationPanelOpen} onClose={closePanels} />
      <ReservationPanel isOpen={isReservationPanelOpen} onClose={closePanels} />
      {/* TODO: agregar modales de cancelación y motivo */}
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
  },
  sectionHeader: {
    paddingBottom: 8,
  },
  sectionSurface: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    shadowColor: 'rgba(15, 23, 42, 0.08)',
    shadowOpacity: 1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
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
