import {
    BottomSheetModal
} from '@gorhom/bottom-sheet'
import { useIsFocused } from '@react-navigation/native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Dimensions,
    FlatList,
    Platform,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import Toast from 'react-native-toast-message'

import { useResidentContext } from '@/components/contexts/ResidentContext'
import EmptyActionCard from '@/components/ui/EmptyActionCard'
import { supabase } from '@/lib/supabase'
import dayjs, { fromServerDate, getTZ, now } from '@/lib/time'
import { useWeatherForReservations, type ReservationWithWeather } from '@/lib/useWeatherForReservations'
import { useUser } from '@/providers/user-provider'
import * as FileSystem from 'expo-file-system/legacy'
import { useRouter } from 'expo-router'
import { CalendarDays, History } from 'lucide-react-native'
import { MotiView } from 'moti'
import ReservationCard from './ReservationCard'
import { ReservationDetailSheet } from './ReservationDetailSheet'

// Tz de referencia sacada de dayjs configurado en @/lib/time
const tz = getTZ()

const { width } = Dimensions.get('window')

type ReservationsWithAction = ReservationWithWeather | { id: 'new' }

export default function ReservationsSlider() {
  const { 
    reservations, 
    fetchReservations, 
    selectedReservation, 
    setReservationDetail, 
    isReservationPanelOpen, 
    setReservationPanelOpen 
  } = useResidentContext()
  const { communitySlug, id: userId } = useUser()
  const router = useRouter()
  const filteredReservations = useMemo(() => {
    const today = now().startOf('day')
    const sevenDaysAgo = today.subtract(7, 'day')
    
    return [...reservations]
      .filter(res => {
        const d = dayjs(res.date)
        return d.isAfter(sevenDaysAgo) || d.isSame(sevenDaysAgo)
      })
      .sort((a, b) => {
        const dateA = dayjs(a.date)
        const dateB = dayjs(b.date)
        const isPastA = dateA.isBefore(today)
        const isPastB = dateB.isBefore(today)

        if (isPastA && !isPastB) return 1
        if (!isPastA && isPastB) return -1
        
        // Futuras: la más cercana primero
        if (!isPastA) return dateA.diff(dateB)
        // Pasadas: la más reciente primero
        return dateB.diff(dateA)
      })
  }, [reservations])

  const reservationsWithWeather = useWeatherForReservations(filteredReservations)

  const [justification, setJustification] = useState('')
  const [cancellationError, setCancellationError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showCancellationForm, setShowCancellationForm] = useState(false)

  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const isFocused = useIsFocused()

  // Sync ref with context state
  useEffect(() => {
    if (isFocused && isReservationPanelOpen && selectedReservation) {
      // Check if consent is required and not given
      const res = selectedReservation as ReservationWithWeather
      const isPast = dayjs(res.date).isBefore(dayjs(), 'day')
      const isCancelled = res.status === 'cancelado'

      if (res.common_spaces?.requires_consent && !res.resident_consent_given && !isPast && !isCancelled) {
        setReservationPanelOpen(false)
        router.push(`/reservations/consent/${res.id}`)
        return
      }
      bottomSheetRef.current?.present()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [isReservationPanelOpen, selectedReservation, isFocused, router, setReservationPanelOpen])

  const handleNavigateToWizard = useCallback(() => {
    if (communitySlug) {
      router.push({ pathname: '/reservations/new', params: { community: communitySlug } })
    } else {
      router.push('/reservations/new')
    }
  }, [communitySlug, router])

  const openDetail = useCallback((reservation: ReservationWithWeather) => {
    // Check if consent is required and not given
    const isPast = dayjs(reservation.date).isBefore(dayjs(), 'day')
    const isCancelled = reservation.status === 'cancelado'

    console.log(`[ReservationsSlider] 🧐 openDetail for ${reservation.id}:`, {
      date: reservation.date,
      status: reservation.status,
      isPast,
      isCancelled,
      requires_consent: reservation.common_spaces?.requires_consent,
      consent_given: reservation.resident_consent_given
    })

    if (reservation.common_spaces?.requires_consent && !reservation.resident_consent_given && !isPast && !isCancelled) {
      console.log(`[ReservationsSlider] 🚀 Redirecting to consent for ${reservation.id}`)
      router.push(`/reservations/consent/${reservation.id}`)
      return
    }

    setReservationDetail(reservation)
    setJustification('')
    setCancellationError('')
    setShowCancellationForm(false)
    setReservationPanelOpen(true)
  }, [router, setReservationDetail, setReservationPanelOpen])

  const closeDetail = useCallback(() => {
    setReservationPanelOpen(false)
    setTimeout(() => {
      setReservationDetail(null)
      setJustification('')
      setCancellationError('')
      setShowCancellationForm(false)
    }, 250)
  }, [setReservationDetail, setReservationPanelOpen])



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

  const performCancelReservation = useCallback(async (reasonArg?: string) => {
    const reasonToUse = reasonArg ?? justification
    
    // Simple validation if reasonArg is provided directly
    if (reasonArg && reasonArg.trim().length < 5) {
        setCancellationError('Ingresa una justificación de al menos 5 caracteres.')
        return
    }

    if (!reasonArg && !validateCancellation()) {
      return
    }

    try {
      setIsCancelling(true)
      setCancellationError('')

      const { error } = await supabase
        .from('common_space_reservations')
        .update({
          status: 'cancelado',
          cancellation_reason: reasonToUse.trim(),
        })
        .eq('id', selectedReservation?.id)
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



  const escapeICS = useCallback((value: string) => {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  }, [])

  const handleDownloadCalendar = useCallback(async () => {
    if (!selectedReservation?.id || !selectedReservation.date) return

    try {
      setIsDownloading(true)
      const baseDate = fromServerDate(selectedReservation.date)
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
      const nowStamp = now().utc().format('YYYYMMDD[T]HHmmss[Z]')
      const dtStart = `${startDateTime.format('YYYYMMDD[T]HHmmss')}`
      const dtEnd = `${endDateTime.format('YYYYMMDD[T]HHmmss')}`

      const icsLines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//VisitMe//Reservas//ES',
        'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT',
        `UID:${selectedReservation?.id}`,
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

      const fileName = `reserva-${selectedReservation?.id}.ics`
      const fileUri = `${FileSystem.cacheDirectory ?? ''}${fileName}`
      await FileSystem.writeAsStringAsync(fileUri, ics, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      let shareUrl = fileUri
      if (Platform.OS === 'android') {
        shareUrl = await FileSystem.getContentUriAsync(fileUri)
      }

      await Share.share(
        {
          url: shareUrl,
          title: 'Agregar al calendario',
          message: 'Reserva VisitMe',
        },
        {
          subject: 'Reserva VisitMe',
          dialogTitle: 'Agregar al calendario',
        }
      )
    } catch (error) {
      console.error('Error al generar archivo ICS:', error)
      Toast.show({ type: 'error', text1: 'No se pudo descargar el evento' })
    } finally {
      setIsDownloading(false)
    }
  }, [escapeICS, selectedReservation])



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

        <View style={styles.headerActions}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => router.push('/reservations')}
            style={styles.historyIconButton}
          >
            <History size={20} color="#4338ca" />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.92} onPress={handleNavigateToWizard} style={styles.ctaButton}>
            <CalendarDays size={18} color="#fff" />
            <Text style={styles.ctaButtonText}>Reservar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[...reservationsWithWeather, { id: 'new' }] as ReservationsWithAction[]}
        keyExtractor={(item, index) => item.id ?? `new-${index}`}
        renderItem={({ item }) =>
          item.id === 'new' ? (
            <View style={styles.cardWrapper}>
              <EmptyActionCard onCreate={handleNavigateToWizard} width="w-full" height="h-[320px]">
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

      <ReservationDetailSheet
        ref={bottomSheetRef}
        reservation={selectedReservation as any}
        onClose={closeDetail}
        onCancelReservation={async (id, reason) => {
          // Wrapped to match signature, logic handled in component generally but here we pass the action
          // Actually, the new component handles the UI, but we need to pass the logic.
          // Let's adapt the performCancelReservation to receive params if needed, or update state before calling.
          // Wait, the shared component calls onCancelReservation(id, reason).
          // We need to implement a wrapper here.
          
          // Re-implementing logic lightly or refactoring performCancelReservation to accept args?
          // Let's refactor performCancelReservation below to be flexible.
          await performCancelReservation(reason)
        }}
        onDownloadCalendar={handleDownloadCalendar}
        isCancelling={isCancelling}
        isDownloading={isDownloading}
      />
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
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyIconButton: {
    width: 42,
    height: 42,
    backgroundColor: '#ebeaff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    height: 42,
  },
  ctaButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  cardWrapper: {
    width: 210,
    marginRight: 16,
    paddingBottom: 8,
  },
  listContent: {
    paddingRight: 16,
    paddingBottom: 24,
  },
})
