import { useResidentContext } from '@/components/contexts/ResidentContext'
import { useIsFocused } from '@react-navigation/native'
import * as FileSystem from 'expo-file-system/legacy'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack, useRouter } from 'expo-router'
import { Clock } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    Alert,
    FlatList,
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
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { cancelReservation as cancelReservationApi } from '../../lib/api/reservations'
import { useUser } from '../../providers/user-provider'

export default function ReservationsIndexPage() {
  const { 
    reservations, 
    fetchReservations, 
    selectedReservation, 
    setReservationDetail, 
    isReservationPanelOpen, 
    setReservationPanelOpen 
  } = useResidentContext()
  const { communitySlug } = useUser()
  const [isCancelling, setIsCancelling] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [justification, setJustification] = useState('')
  const [cancellationError, setCancellationError] = useState('')
  const [showCancellationForm, setShowCancellationForm] = useState(false)
  
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const isFocused = useIsFocused()
  const router = useRouter()

  // Sync modal with context
  useEffect(() => {
    if (isFocused && isReservationPanelOpen && selectedReservation) {
      bottomSheetRef.current?.present()
    } else {
      bottomSheetRef.current?.dismiss()
    }
  }, [isReservationPanelOpen, selectedReservation, isFocused])

  const openDetail = useCallback((res: any) => {
    setReservationDetail(res)
    setReservationPanelOpen(true)
  }, [setReservationDetail, setReservationPanelOpen])

  const closeDetail = useCallback(() => {
    setReservationPanelOpen(false)
    setTimeout(() => {
      setReservationDetail(null)
    }, 200)
  }, [setReservationDetail, setReservationPanelOpen])

  const escapeICS = useCallback((value: string) => {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  }, [])

  const handleDownloadCalendar = useCallback(async (res: any) => {
    try {
      setIsDownloading(true)
      const baseDate = fromServerDate(res.date)
      const startHour = res.block === 'morning' ? 9 : res.block === 'afternoon' ? 15 : 10
      const durationHours = res.duration_hours ?? 2
      const startDateTime = baseDate.hour(startHour).minute(0).second(0)
      const endDateTime = startDateTime.add(durationHours, 'hour')
      
      const summary = escapeICS(res.common_space_name ?? 'Reserva VisitMe')
      const description = escapeICS(`Bloque: ${res.block}\nDepartamento: ${res.department_number}`)
      const nowStamp = timeNow().utc().format('YYYYMMDD[T]HHmmss[Z]')
      const dtStart = startDateTime.format('YYYYMMDD[T]HHmmss')
      const dtEnd = endDateTime.format('YYYYMMDD[T]HHmmss')

      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n')

      const fileUri = `${FileSystem.cacheDirectory}reserva-${res.id}.ics`
      await FileSystem.writeAsStringAsync(fileUri, ics)

      await Share.share(
        { 
          url: Platform.OS === 'android' ? await FileSystem.getContentUriAsync(fileUri) : fileUri,
          title: summary,
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
      console.log(`[CancelReservation] 🚀 Using API for ID: ${id}`)
      setIsCancelling(true)
      
      const sessionToken = (await supabase.auth.getSession()).data.session?.access_token
      if (!sessionToken) throw new Error('No hay sesión')

      await cancelReservationApi(id, reason.trim(), sessionToken, communitySlug || undefined)

      console.log(`[CancelReservation] ✅ Success`)
      Toast.show({ type: 'success', text1: 'Reserva anulada correctamente' })
      
      await fetchReservations(true)
      closeDetail()
    } catch (error: any) {
      console.error('[CancelReservation] Error:', error)
      Alert.alert('Error', error.message || 'No se pudo anular la reserva. Intenta nuevamente.')
    } finally { setIsCancelling(false) }
  }, [fetchReservations, closeDetail])

  // Logic for list grouping
  const { totalPending } = useMemo(() => {
    const today = timeNow().startOf('day')
    return {
      totalPending: reservations.filter(res => res.status === 'activo' && fromServerDate(res.date).isSameOrAfter(today)).length
    }
  }, [reservations])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#f8fafc', '#f1f5f9']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.pillButton}>
           <Text style={styles.pillButtonText}>← Volver al inicio</Text>
        </Pressable>
        <Text style={styles.title}>Historial de Reservas</Text>
        <Text style={styles.subtitle}>
          {totalPending > 0 
            ? `${totalPending} reservas activas` 
            : 'No tienes reservas activas'}
        </Text>
      </View>

      <FlatList
        data={reservations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => openDetail(item)} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.common_space_name}</Text>
              <View style={[styles.badge, item.status === 'activo' ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Clock size={16} color="#64748b" />
                <Text style={styles.infoText}>{fromServerDate(item.date).format('DD MMM, YYYY')} - {item.block === 'morning' ? 'AM' : 'PM'}</Text>
              </View>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => fetchReservations(true)} />}
      />

      <ReservationDetailSheet
        ref={bottomSheetRef}
        reservation={selectedReservation}
        onClose={closeDetail}
        onCancelReservation={(id, reason) => performCancelReservation(id, reason)}
        onDownloadCalendar={handleDownloadCalendar}
        isCancelling={isCancelling}
        isDownloading={isDownloading}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 10 },
  pillButton: {
    backgroundColor: '#ede9fe', // Matching Invitations style
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  pillButtonText: {
    color: '#6d28d9', // Matching Invitations style
    fontWeight: '700',
    fontSize: 13,
  },
  title: { fontSize: 24, fontWeight: '800', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, fontWeight: '500' },
  list: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeActive: { backgroundColor: '#dcfce7' },
  badgeInactive: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#166534', textTransform: 'uppercase' },
  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 14, color: '#64748b' }
})
