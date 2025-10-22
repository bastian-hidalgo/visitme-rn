import { MotiView } from 'moti'
import React, { useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native'

import { useResidentContext } from '@/components/contexts/ResidentContext'
import Header from '@/components/resident/Header'
import HeroBanner from '@/components/resident/HeroBanner'
import InvitationsSlider from '@/components/resident/InvitationsSlider'
import NewsSlider from '@/components/resident/NewsSlider'
import PackageSlider from '@/components/resident/PackageSlider'
import QuickAccess from '@/components/resident/QuickAccess'
import ReservationsSlider from '@/components/resident/ReservationsSlider'
import SurveysSlider from '@/components/resident/SurveysSlider'
import getReservationBannerStatus from '@/lib/getReservationsBannerStatus'

const { width } = Dimensions.get('window')

export default function ResidentDashboard() {
  const { reservations } = useResidentContext()
  const colorScheme = useColorScheme()

  // Estado local de modales
  const [cancelReservationId, setCancelReservationId] = useState<string | null>(null)
  const [cancellationReason, setCancellationReason] = useState<string | null>(null)

  // Acciones de modal
  const openCancelModal = (id: string) => setCancelReservationId(id)
  const openReasonModal = (reason: string) => setCancellationReason(reason)
  const closeCancelModal = () => setCancelReservationId(null)
  const closeReasonModal = () => setCancellationReason(null)

  // Estado del banner de reserva (hoy / mañana / pasada)
  const { status, formattedDate } = getReservationBannerStatus(reservations)

  return (
    <View style={[styles.screen, colorScheme === 'dark' && styles.screenDark]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 140,
          paddingTop: 20,
        }}
      >
        {/* Header */}
        <Header />

        {/* Hero Banner */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.heroSection}
        >
          <HeroBanner reservationStatus={status} reservationDate={formattedDate} />
        </MotiView>

        {/* Encuestas */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100, duration: 400 }}
          style={styles.section}
        >
          <SurveysSlider />
        </MotiView>

        {/* Noticias */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200, duration: 400 }}
          style={styles.section}
        >
          <NewsSlider />
        </MotiView>

        {/* Reservas */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300, duration: 400 }}
          style={styles.section}
        >
          <ReservationsSlider
            onCancel={openCancelModal}
            onViewReason={openReasonModal}
          />
        </MotiView>

        {/* Invitaciones */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 400, duration: 400 }}
          style={styles.section}
        >
          <InvitationsSlider />
        </MotiView>

        {/* Encomiendas */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 500, duration: 400 }}
          style={styles.section}
        >
          <PackageSlider />
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
        animate={{ translateY: -10, scale: 1 }}
        transition={{
          type: 'spring',
          stiffness: 160,
          damping: 24,
          delay: 700,
        }}
        style={styles.quickAccessWrapper}
      >
        <View style={styles.quickAccessInner}>
          <QuickAccess />
        </View>
      </MotiView>

      {/* TODO: agregar modales de cancelación y motivo */}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    position: 'relative',
  },
  screenDark: {
    backgroundColor: '#020617',
  },
  heroSection: {
    marginTop: 8,
  },
  section: {
    marginTop: 24,
  },
  placeholder: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
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
    width: '85%',
    maxWidth: 768,
    padding: 16,
  },
})
