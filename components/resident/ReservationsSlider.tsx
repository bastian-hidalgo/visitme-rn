import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import {
  CalendarDays,
  Clock3,
  Download,
  MapPin,
  ShieldAlert,
  XCircle,
} from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'
import * as FileSystem from 'expo-file-system/legacy'

import EmptyActionCard from '@/components/ui/EmptyActionCard'
import { useResidentContext } from '@/components/contexts/ResidentContext'
import ReservationCard from './ReservationCard'
import { useWeatherForReservations, type ReservationWithWeather } from '@/lib/useWeatherForReservations'
import { useUser } from '@/providers/user-provider'
import { supabase } from '@/lib/supabase'
import getUrlImageFromStorage from '@/lib/getUrlImageFromStorage'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('es')
const tz = dayjs.tz.guess()

const { width } = Dimensions.get('window')

type ReservationsWithAction = ReservationWithWeather | { id: 'new' }

export default function ReservationsSlider() {
  const { reservations, fetchReservations } = useResidentContext()
  const { communitySlug, id: userId } = useUser()
  const router = useRouter()
  const reservationsWithWeather = useWeatherForReservations(reservations)

  const [selectedReservation, setSelectedReservation] = useState<ReservationWithWeather | null>(null)
  const [justification, setJustification] = useState('')
  const [cancellationError, setCancellationError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showCancellationForm, setShowCancellationForm] = useState(false)

  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const handleNavigateToWizard = useCallback(() => {
    if (communitySlug) {
      router.push({ pathname: '/reservations/new', params: { community: communitySlug } })
    } else {
      router.push('/reservations/new')
    }
  }, [communitySlug, router])

  const openDetail = useCallback((reservation: ReservationWithWeather) => {
    setSelectedReservation(reservation)
    setJustification('')
    setCancellationError('')
    setShowCancellationForm(false)
    bottomSheetRef.current?.present()
  }, [])

  const closeDetail = useCallback(() => {
    bottomSheetRef.current?.dismiss()
      setTimeout(() => {
        setSelectedReservation(null)
        setJustification('')
        setCancellationError('')
        setShowCancellationForm(false)
      }, 250)
  }, [])

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        style={{ backgroundColor: 'rgba(15,23,42,0.65)' }}
      />
    ),
    []
  )

  const validateCancellation = useCallback(() => {
    if (!selectedReservation?.id || !userId) {
      setCancellationError('No fue posible validar la reserva.')
      return false
    }

    if (selectedReservation.status === 'cancelado') {
      setCancellationError('Esta reserva ya fue cancelada.')
      return false
    }

    if (justification.trim().length < 5) {
      setCancellationError('Ingresa una justificación de al menos 5 caracteres.')
      return false
    }

    return true
  }, [justification, selectedReservation, userId])

  const performCancelReservation = useCallback(async () => {
    if (!validateCancellation()) {
      return
    }

    try {
      setIsCancelling(true)
      setCancellationError('')

      const { error } = await supabase
        .from('common_space_reservations')
        .update({
          status: 'cancelado',
          cancellation_reason: justification.trim(),
        })
        .eq('id', selectedReservation.id)
        .eq('reserved_by', userId)

      if (error) {
        console.error('Error al cancelar reserva:', error)
        setCancellationError('Ocurrió un error al anular la reserva.')
        return
      }

      Toast.show({ type: 'success', text1: 'Reserva anulada correctamente' })
      await fetchReservations()
      closeDetail()
    } catch (error) {
      console.error('Error inesperado al cancelar reserva:', error)
      setCancellationError('Ocurrió un error inesperado. Inténtalo nuevamente.')
    } finally {
      setIsCancelling(false)
    }
  }, [closeDetail, fetchReservations, justification, selectedReservation, userId, validateCancellation])

  const handleConfirmCancelPress = useCallback(() => {
    if (!validateCancellation()) {
      return
    }

    Alert.alert(
      'Confirmar anulación',
      '¿Estás seguro de que deseas anular esta reserva?',
      [
        { text: 'Mantener', style: 'cancel' },
        { text: 'Sí, anular', style: 'destructive', onPress: performCancelReservation },
      ]
    )
  }, [performCancelReservation, validateCancellation])

  const escapeICS = useCallback((value: string) => {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  }, [])

  const handleDownloadCalendar = useCallback(async () => {
    if (!selectedReservation?.id || !selectedReservation.date) return

    try {
      setIsDownloading(true)
      const baseDate = dayjs.utc(selectedReservation.date).tz(tz, true)
      const startHour =
        selectedReservation.block === 'morning'
          ? 9
          : selectedReservation.block === 'afternoon'
            ? 15
            : 10
      const durationHours = selectedReservation.duration_hours ?? 2
      const startDateTime = baseDate.hour(startHour).minute(0).second(0)
      const endDateTime = startDateTime.add(durationHours, 'hour')
      const summary = escapeICS(selectedReservation.common_space_name ?? 'Reserva VisitMe')
      const descriptionLines = [
        selectedReservation.block === 'morning'
          ? 'Bloque: AM'
          : selectedReservation.block === 'afternoon'
            ? 'Bloque: PM'
            : 'Bloque sin asignar',
        selectedReservation.duration_hours
          ? `Duración: ${selectedReservation.duration_hours} hora(s)`
          : null,
        selectedReservation.department_number ? `Departamento: ${selectedReservation.department_number}` : null,
      ]
        .filter(Boolean)
        .join('\n')

      const description = escapeICS(descriptionLines)
      const location = escapeICS(selectedReservation.common_space_name ?? 'Espacio común')
      const nowStamp = dayjs().utc().format('YYYYMMDD[T]HHmmss[Z]')
      const dtStart = `${startDateTime.format('YYYYMMDD[T]HHmmss')}`
      const dtEnd = `${endDateTime.format('YYYYMMDD[T]HHmmss')}`

      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//VisitMe//Reservas//ES',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${selectedReservation.id}`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;TZID=${tz}:${dtStart}`,
        `DTEND;TZID=${tz}:${dtEnd}`,
        `SUMMARY:${summary}`,
        `LOCATION:${location}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ]

      const ics = `${icsLines.join('\r\n')}\r\n`

      const fileName = `reserva-${selectedReservation.id}.ics`
      const fileUri = `${FileSystem.cacheDirectory ?? ''}${fileName}`
      await FileSystem.writeAsStringAsync(fileUri, ics, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      let shareUrl = fileUri
      if (Platform.OS === 'android') {
        shareUrl = await FileSystem.getContentUriAsync(fileUri)
      }

      await Share.share({
        url: shareUrl,
        title: 'Agregar al calendario',
        subject: 'Reserva VisitMe',
      })
    } catch (error) {
      console.error('Error al generar archivo ICS:', error)
      Toast.show({ type: 'error', text1: 'No se pudo descargar el evento' })
    } finally {
      setIsDownloading(false)
    }
  }, [escapeICS, selectedReservation])

  const snapPoints = useMemo(() => ['92%'], [])

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 600 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Organiza tus tiempos</Text>
          <Text style={styles.headerTitle}>Tus reservas</Text>
        </View>

        <TouchableOpacity activeOpacity={0.92} onPress={handleNavigateToWizard} style={styles.ctaButton}>
          <CalendarDays size={18} color="#fff" />
          <Text style={styles.ctaButtonText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[...reservationsWithWeather, { id: 'new' }] as ReservationsWithAction[]}
        keyExtractor={(item, index) => item.id ?? `new-${index}`}
        renderItem={({ item }) =>
          item.id === 'new' ? (
            <View style={styles.cardWrapper}>
              <EmptyActionCard onCreate={handleNavigateToWizard} width="w-full" height="h-[220px]">
                Agendar nueva{'\n'}reserva
              </EmptyActionCard>
            </View>
          ) : (
            <View style={styles.cardWrapper}>
              {'block' in item ? <ReservationCard data={item} onPress={openDetail} /> : null}
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
      />

      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        onDismiss={closeDetail}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        bottomInset={Platform.OS === 'ios' ? 36 : 24}
      >
        {selectedReservation ? (
          <BottomSheetScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.sheetHeroContainer}>
              <Image
                source={{
                  uri:
                    getUrlImageFromStorage(
                      selectedReservation.common_space_image_url ?? '',
                      'common-spaces'
                    ) ||
                    getUrlImageFromStorage(
                      selectedReservation.common_space_image_url ?? '',
                      'common-space-images'
                    ) ||
                    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
                }}
                style={styles.sheetHeroImage}
                contentFit="cover"
              />
              <LinearGradient colors={['rgba(15,23,42,0.85)', 'transparent']} style={styles.sheetHeroOverlay} />

              <View style={styles.sheetHeroContent}>
                <Text style={styles.sheetStatus}>
                  {selectedReservation.status === 'cancelado'
                    ? 'Reserva cancelada'
                    : selectedReservation.status === 'pendiente'
                      ? 'Reserva pendiente'
                      : 'Reserva confirmada'}
                </Text>
                <Text style={styles.sheetTitle}>{selectedReservation.common_space_name ?? 'Espacio VisitMe'}</Text>
                <View style={styles.sheetInfoRow}>
                  <Clock3 size={18} color="#fff" />
                  <Text style={styles.sheetInfoText}>
                    {dayjs.utc(selectedReservation.date).tz(tz, true).format('dddd DD [de] MMMM YYYY')}
                  </Text>
                </View>
                <View style={styles.sheetInfoRow}>
                  <MapPin size={18} color="#fff" />
                  <Text style={styles.sheetInfoText}>Departamento {selectedReservation.department_number ?? '-'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionTitle}>Detalles</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Bloque</Text>
                <Text style={styles.detailValue}>
                  {selectedReservation.block === 'morning'
                    ? 'Mañana (AM)'
                    : selectedReservation.block === 'afternoon'
                      ? 'Tarde (PM)'
                      : 'Sin horario definido'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duración</Text>
                <Text style={styles.detailValue}>
                  {selectedReservation.duration_hours
                    ? `${selectedReservation.duration_hours} hora(s)`
                    : 'Sin información'}
                </Text>
              </View>
            </View>

            {selectedReservation.status === 'cancelado' && selectedReservation.cancellation_reason ? (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Motivo de cancelación</Text>
                <View style={styles.cancellationReasonBox}>
                  <ShieldAlert size={18} color="#F87171" />
                  <Text style={styles.cancellationReasonText}>{selectedReservation.cancellation_reason}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>Anular reserva</Text>
                <Text style={styles.sheetSectionDescription}>
                  Cuéntanos el motivo para que podamos notificar al equipo de la comunidad.
                </Text>

                {!showCancellationForm ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      setShowCancellationForm(true)
                      setCancellationError('')
                    }}
                    style={styles.expandCancelButton}
                  >
                    <ShieldAlert size={18} color="#ef4444" />
                    <Text style={styles.expandCancelText}>Escribir justificación</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <BottomSheetTextInput
                      placeholder="Escribe tu justificación"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      multiline
                      value={justification}
                      onChangeText={setJustification}
                      style={styles.input}
                      textAlignVertical="top"
                      enablesReturnKeyAutomatically
                    />
                    {cancellationError ? (
                      <Text style={styles.errorText}>{cancellationError}</Text>
                    ) : null}
                    <View style={styles.cancelActionsRow}>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => {
                          setShowCancellationForm(false)
                          setJustification('')
                          setCancellationError('')
                        }}
                        style={styles.cancelSecondaryButton}
                      >
                        <XCircle size={18} color="#cbd5f5" />
                        <Text style={styles.cancelSecondaryText}>Descartar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleConfirmCancelPress}
                        disabled={isCancelling}
                        style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
                      >
                        {isCancelling ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.cancelButtonText}>Confirmar anulación</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}

            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionTitle}>Agregar a tu calendario</Text>
              <Text style={styles.sheetSectionDescription}>
                Descarga el evento en formato compatible con tu calendario personal.
              </Text>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleDownloadCalendar}
                disabled={isDownloading}
                style={[styles.calendarButton, isDownloading && styles.calendarButtonDisabled]}
              >
                {isDownloading ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <>
                    <Download size={18} color="#111827" />
                    <Text style={styles.calendarButtonText}>Descargar evento (.ics)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>
        ) : null}
      </BottomSheetModal>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerEyebrow: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f97316',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  cardWrapper: {
    width: width * 0.72,
    marginRight: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingRight: 16,
    paddingBottom: 24,
  },
  sheetBackground: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetHandle: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  sheetScroll: {
    paddingHorizontal: 20,
  },
  sheetContentContainer: {
    paddingBottom: 36,
  },
  sheetHeroContainer: {
    borderRadius: 22,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 24,
  },
  sheetHeroImage: {
    width: '100%',
    height: 220,
  },
  sheetHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetHeroContent: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    gap: 8,
  },
  sheetStatus: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  sheetInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetInfoText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  sheetSection: {
    marginBottom: 24,
  },
  sheetSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sheetSectionDescription: {
    color: 'rgba(226,232,240,0.7)',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148,163,184,0.3)',
  },
  detailLabel: {
    color: 'rgba(226,232,240,0.75)',
    fontSize: 14,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancellationReasonBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(248,113,113,0.12)',
    padding: 16,
    borderRadius: 16,
  },
  cancellationReasonText: {
    color: '#FCA5A5',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    padding: 16,
    color: '#fff',
    minHeight: 120,
    marginBottom: 12,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    marginBottom: 12,
  },
  expandCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(15,23,42,0.35)',
  },
  expandCancelText: {
    color: '#fca5a5',
    fontWeight: '700',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(15,23,42,0.2)',
  },
  cancelSecondaryText: {
    color: '#cbd5f5',
    fontWeight: '600',
    fontSize: 14,
  },
  calendarButton: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBBF24',
    paddingVertical: 14,
    borderRadius: 16,
  },
  calendarButtonDisabled: {
    opacity: 0.6,
  },
  calendarButtonText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 15,
  },
})
