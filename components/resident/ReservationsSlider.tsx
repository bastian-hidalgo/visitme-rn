import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { CalendarDays, Clock3, Download, MapPin, ShieldAlert } from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
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
    bottomSheetRef.current?.present()
  }, [])

  const closeDetail = useCallback(() => {
    bottomSheetRef.current?.dismiss()
    setTimeout(() => {
      setSelectedReservation(null)
      setJustification('')
      setCancellationError('')
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

  const handleCancelReservation = useCallback(async () => {
    if (!selectedReservation?.id || !userId) {
      setCancellationError('No fue posible validar la reserva.')
      return
    }

    if (selectedReservation.status === 'cancelado') {
      setCancellationError('Esta reserva ya fue cancelada.')
      return
    }

    if (justification.trim().length < 5) {
      setCancellationError('Ingresa una justificación de al menos 5 caracteres.')
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
  }, [closeDetail, fetchReservations, justification, selectedReservation, userId])

  const escapeICS = useCallback((value: string) => {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  }, [])

  const handleDownloadCalendar = useCallback(async () => {
    if (!selectedReservation?.id || !selectedReservation.date) return

    try {
      setIsDownloading(true)
      const dateObj = dayjs.utc(selectedReservation.date).tz(tz, true)
      const startDate = dateObj.format('YYYYMMDD')
      const endDate = dateObj.add(1, 'day').format('YYYYMMDD')
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

      const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//VisitMe//Reservas//ES\nBEGIN:VEVENT\nUID:${selectedReservation.id}\nDTSTAMP:${nowStamp}\nDTSTART;VALUE=DATE:${startDate}\nDTEND;VALUE=DATE:${endDate}\nSUMMARY:${summary}\nLOCATION:${location}\nDESCRIPTION:${description}\nEND:VEVENT\nEND:VCALENDAR`

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
        message:
          Platform.OS === 'android'
            ? 'Descarga tu evento y agrégalo a tu calendario preferido.'
            : undefined,
        title: 'Agregar al calendario',
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
      >
        {selectedReservation ? (
          <BottomSheetScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeroContainer}>
              <Image
                source={{
                  uri:
                    selectedReservation.common_space_image_url ||
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
                <TextInput
                  placeholder="Escribe tu justificación"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  multiline
                  value={justification}
                  onChangeText={setJustification}
                  style={styles.input}
                  textAlignVertical="top"
                />
                {cancellationError ? <Text style={styles.errorText}>{cancellationError}</Text> : null}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleCancelReservation}
                  disabled={isCancelling}
                  style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
                >
                  {isCancelling ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.cancelButtonText}>Anular reserva</Text>
                  )}
                </TouchableOpacity>
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
  },
  listContent: {
    paddingRight: 16,
    paddingBottom: 12,
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
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
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
