import { useResidentContext } from '@/components/contexts/ResidentContext'
import { useIsFocused } from '@react-navigation/native'
import * as FileSystem from 'expo-file-system/legacy'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, useRouter } from 'expo-router'
import { Banknote, CalendarDays, Clock, History as HistoryIcon, Info, MapPin, Plus } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Alert,
    FlatList,
    Image,
    Platform,
    Pressable,
    RefreshControl,
    Share,
    StyleSheet,
    Text,
    View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'

import { ReservationDetailSheet } from '@/components/resident/ReservationDetailSheet'
import { supabase } from '@/lib/supabase'
import { fromServerDate, now as timeNow } from '@/lib/time'
import { useUser } from '@/providers/user-provider'
import { BottomSheetModal } from '@gorhom/bottom-sheet'

export default function ReservationsIndexPage() {
  const { 
    reservations, 
    fetchReservations, 
    selectedReservation,
    setReservationDetail, 
    isReservationPanelOpen,
    setReservationPanelOpen 
  } = useResidentContext()
  const { id: userId } = useUser()
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const isFocused = useIsFocused()

  // Sync ref with context state
  useEffect(() => {
    if (isFocused && isReservationPanelOpen && selectedReservation) {
      bottomSheetRef.current?.present()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [isReservationPanelOpen, selectedReservation, isFocused])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchReservations(true)
    setRefreshing(false)
  }, [fetchReservations])

  useEffect(() => {
    fetchReservations(true)
  }, [fetchReservations])

  const closeDetail = useCallback(() => {
    setReservationPanelOpen(false)
    setTimeout(() => {
      setReservationDetail(null)
    }, 250)
  }, [setReservationDetail, setReservationPanelOpen])

  const escapeICS = useCallback((value: string) => {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  }, [])

  const handleDownloadCalendar = useCallback(async (reservation: any) => {
    if (!reservation?.id || !reservation.date) return

    try {
      setIsDownloading(true)
      const baseDate = fromServerDate(reservation.date)
      const startHour = reservation.block === 'morning' ? 9 : reservation.block === 'afternoon' ? 15 : 10
      const durationHours = reservation.duration_hours ?? 2
      const startDateTime = baseDate.hour(startHour).minute(0).second(0)
      const endDateTime = startDateTime.add(durationHours, 'hour')
      const summary = escapeICS(reservation.common_space_name ?? 'Reserva VisitMe')
      const descriptionLines = [
        reservation.block === 'morning' ? 'Bloque: AM' : reservation.block === 'afternoon' ? 'Bloque: PM' : 'Bloque sin asignar',
        reservation.duration_hours ? `Duración: ${reservation.duration_hours} hora(s)` : null,
        reservation.department_number ? `Departamento: ${reservation.department_number}` : null,
      ].filter(Boolean).join('\n')

      const description = escapeICS(descriptionLines)
      const location = escapeICS(reservation.common_space_name ?? 'Espacio común')
      const nowStamp = timeNow().utc().format('YYYYMMDD[T]HHmmss[Z]')
      const dtStart = `${startDateTime.format('YYYYMMDD[T]HHmmss')}`
      const dtEnd = `${endDateTime.format('YYYYMMDD[T]HHmmss')}`

      const icsLines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//VisitMe//Reservas//ES', 'CALSCALE:GREGORIAN',
        'BEGIN:VEVENT', `UID:${reservation.id}`, `DTSTAMP:${nowStamp}`, `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`, `SUMMARY:${summary}`, `LOCATION:${location}`, `DESCRIPTION:${description}`,
        'END:VEVENT', 'END:VCALENDAR',
      ]

      const ics = `${icsLines.join('\r\n')}\r\n`
      const fileName = `reserva-${reservation.id}.ics`
      const fileUri = `${FileSystem.cacheDirectory ?? ''}${fileName}`
      await FileSystem.writeAsStringAsync(fileUri, ics, { encoding: FileSystem.EncodingType.UTF8 })

      let shareUrl = fileUri
      if (Platform.OS === 'android') shareUrl = await FileSystem.getContentUriAsync(fileUri)

      await Share.share(
        { 
          url: shareUrl, 
          title: 'Agregar al calendario', 
          message: 'Reserva VisitMe' 
        },
        {
          subject: 'Reserva VisitMe',
          dialogTitle: 'Agregar al calendario'
        }
      )
    } catch (error) {
      console.error('Error al descargar evento:', error)
      Toast.show({ type: 'error', text1: 'No se pudo descargar el evento' })
    } finally { setIsDownloading(false) }
  }, [escapeICS])

  const performCancelReservation = useCallback(async (id: string, reason: string) => {
    try {
      setIsCancelling(true)
      const { error } = await supabase
        .from('common_space_reservations')
        .update({ status: 'cancelado', cancellation_reason: reason.trim() })
        .eq('id', id)
        .eq('reserved_by', userId)

      if (error) throw error

      Toast.show({ type: 'success', text1: 'Reserva anulada correctamente' })
      await fetchReservations(true)
      closeDetail()
    } catch (error) {
      console.error('Error al cancelar reserva:', error)
      Alert.alert('Error', 'No se pudo anular la reserva. Intenta nuevamente.')
    } finally { setIsCancelling(false) }
  }, [fetchReservations, userId, closeDetail])

  const { upcoming, history, totalPending } = useMemo(() => {
    const today = timeNow().startOf('day')
    const up: any[] = []
    const hist: any[] = []
    let pendingSum = 0

    reservations.forEach((res: any) => {
      const resDate = fromServerDate(res.date)
      if (resDate.isAfter(today) || (resDate.isSame(today) && res.status !== 'cancelado')) {
        up.push(res)
      } else {
        hist.push(res)
      }

      if ((res as any).payment_status === 'pending') {
        pendingSum += (res as any).cost_applied || 0
      }
    })

    return { 
      upcoming: up.sort((a, b) => fromServerDate(a.date).diff(fromServerDate(b.date))), 
      history: hist.sort((a, b) => fromServerDate(b.date).diff(fromServerDate(a.date))),
      totalPending: pendingSum
    }
  }, [reservations])

  const renderReservationItem = ({ item }: { item: any }) => {
    const payment = getPaymentInfo(item)

    return (
      <Pressable 
        onPress={() => {
          setReservationDetail(item)
          setReservationPanelOpen(true)
        }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{fromServerDate(item.date).format('DD')}</Text>
            <Text style={styles.dateMonth}>{fromServerDate(item.date).format('MMM').toUpperCase()}</Text>
          </View>
          <View style={styles.cardMainInfo}>
            <Text style={styles.cardTitle}>{item.common_space_name}</Text>
            <View style={styles.cardMetaRow}>
              <Clock size={12} color="#6b7280" />
              <Text style={styles.cardMetaText}>
                {item.block === 'morning' ? 'Mañana' : 'Tarde'}
              </Text>
              <View style={styles.dot} />
              <MapPin size={12} color="#6b7280" />
              <Text style={styles.cardMetaText}>Depto {item.department_number}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: payment.bg }]}>
            <Text style={[styles.statusText, { color: payment.color }]}>{payment.label}</Text>
          </View>
        </View>

        {item.cost_applied > 0 ? (
          <View style={styles.costRow}>
            <Banknote size={14} color="#4b5563" />
            <Text style={styles.costText}>${Math.round(item.cost_applied).toLocaleString('es-CL')}</Text>
          </View>
        ) : (
          <View style={styles.costRow}>
            <Info size={14} color="#64748b" />
            <Text style={[styles.costText, { color: '#64748b', fontWeight: '500' }]}>Gratis / Exento</Text>
          </View>
        )}
      </Pressable>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.replace('/')} style={styles.logoButton}>
            <Image
              source={require('@/assets/logo.png')}
              style={styles.logo}
            />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Mis Reservas</Text>
          </View>
        </View>
        
        <Pressable 
            onPress={() => router.push('/reservations/new')}
            style={styles.addButton}
        >
          <Plus size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={[
          { title: 'Próximas Reservas', data: upcoming, type: 'upcoming' },
          { title: 'Historial y Pagos', data: history, type: 'history' }
        ]}
        keyExtractor={(item) => item.type}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              {item.type === 'upcoming' ? <CalendarDays size={18} color="#4338ca" /> : <HistoryIcon size={18} color="#4338ca" />}
              <Text style={styles.sectionTitle}>{item.title}</Text>
            </View>
            {item.data.length === 0 ? (
              <Text style={styles.emptyText}>No hay registros en esta sección.</Text>
            ) : (
              item.data.map((res: any) => (
                  <View key={res.id}>
                    {renderReservationItem({ item: res })}
                  </View>
              ))
            )}
            {item.type === 'history' && totalPending > 0 && (
              <LinearGradient colors={['#fff', '#fefce8']} style={styles.pendingFooter}>
                <View style={styles.pendingInfo}>
                    <Info size={16} color="#a16207" />
                    <Text style={styles.pendingLabel}>Total Pendiente de Pago</Text>
                </View>
                <Text style={styles.pendingAmount}>${Math.round(totalPending).toLocaleString('es-CL')}</Text>
              </LinearGradient>
            )}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4338ca" />
        }
      />

      <ReservationDetailSheet
        ref={bottomSheetRef}
        reservation={selectedReservation as any}
        onClose={closeDetail}
        onCancelReservation={performCancelReservation}
        onDownloadCalendar={handleDownloadCalendar}
        isCancelling={isCancelling}
        isDownloading={isDownloading}
      />
    </SafeAreaView>
  )
}

const getPaymentInfo = (item: any) => {
  if (item.status === 'cancelado') return { label: 'Anulada', color: '#991b1b', bg: '#fef2f2' }
  if (item.cost_applied === 0 || item.is_grace_use) return { label: 'Gratis / Exento', color: '#475569', bg: '#f1f5f9' }
  
  const isPast = fromServerDate(item.date).isBefore(timeNow(), 'day')

  switch (item.payment_status) {
    case 'paid': return { label: 'Pagado', color: '#15803d', bg: '#dcfce7' }
    case 'pending': return { label: 'Por Pagar', color: '#a16207', bg: '#fef9c3' }
    default: 
      return isPast 
        ? { label: 'Concretada', color: '#475569', bg: '#f1f5f9' }
        : { label: 'Agendada', color: '#1e3a8a', bg: '#eff6ff' }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitleContainer: {
    borderLeftWidth: 1,
    borderLeftColor: '#e2e8f0',
    paddingLeft: 12,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e2937',
  },
  logoButton: {
    paddingVertical: 4,
  },
  logo: {
    width: 100,
    height: 38,
    resizeMode: 'contain',
  },
  addButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#4338ca',
  },
  listContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBadge: {
    width: 48,
    height: 48,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  cardMainInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e2937',
    marginBottom: 4,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 6,
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4b5563',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 20,
    fontStyle: 'italic',
  },
  pendingFooter: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#854d0e',
  },
  pendingAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#a16207',
  }
})
