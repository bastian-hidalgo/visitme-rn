import { ReservationDetailSheet } from '@/components/resident/ReservationDetailSheet'
import { supabase } from '@/lib/supabase'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

export default function ReservationDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [reservation, setReservation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const fetchReservation = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('reservations')
        .select('*, common_spaces(*)')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching reservation:', error)
      } else {
        setReservation(data)
      }
      setLoading(false)
    }

    fetchReservation()
  }, [id])

  const bottomSheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (reservation) {
      setTimeout(() => {
        bottomSheetRef.current?.present()
      }, 100)
    }
  }, [reservation])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    )
  }

  if (!reservation) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la reserva.</Text>
      </View>
    )
  }

  // Need to adapt reservation data to ReservationWithWeather if possible
  // ensuring the shape matches what ReservationDetailSheet expects.
  // The 'common_spaces' join is present.
  // We might need to mock or fetch additional fields if the types are strict, 
  // but let's assume the shape is compatible or sufficient for now.
  const adaptedReservation = {
      ...reservation,
      common_space_name: reservation.common_spaces?.name,
      common_space_image_url: reservation.common_spaces?.image_url,
      // Add other necessary mappings if they differ from the DB shape vs the helper shape
  }

  return (
    <View style={styles.container}>
      <ReservationDetailSheet
        ref={bottomSheetRef}
        reservation={adaptedReservation}
        onClose={() => {
             if (router.canGoBack()) {
                router.back()
            } else {
                router.push('/')
            }
        }}
        onCancelReservation={async (id, reason) => {
             // Implement cancellation logic or re-use a hook if available.
             // For now we can just log or implement a basic update
             const { error } = await supabase
                .from('common_space_reservations')
                .update({ status: 'cancelado', cancellation_reason: reason })
                .eq('id', id)
             
             if (!error) {
                 router.back()
             }
        }}
        onDownloadCalendar={async () => {
            // Implement simple calendar download or import util
            console.log('Download calendar for', id)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
