import { useResidentContext } from '@/components/contexts/ResidentContext'
import { useWeatherForReservations } from '@/lib/useWeatherForReservations'
import { CalendarDays } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'

import EmptyActionCard from '@/components/ui/EmptyActionCard'
import ReservationCard from './ReservationCard'

const { width } = Dimensions.get('window')

interface Props {
  onCancel: (id: string) => void
  onViewReason: (reason: string) => void
}

export default function ReservationsSlider({ onCancel, onViewReason }: Props) {
  const { reservations, openReservationPanel } = useResidentContext()
  const reservationsWithWeather = useWeatherForReservations(reservations)
  const colorScheme = useColorScheme()

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 600 }}
      style={styles.container}
    >
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, colorScheme === 'dark' && styles.headerTitleDark]}>
          Tus Reservas
        </Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={openReservationPanel}
          style={styles.ctaButton}
        >
          <CalendarDays size={18} color="#fff" />
          <Text style={styles.ctaButtonText}>Reservar</Text>
        </TouchableOpacity>
      </View>

      {/* Slider horizontal */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[...reservationsWithWeather, { id: 'new' }]}
        keyExtractor={(item) => item.id ?? 'new'}
        renderItem={({ item }) =>
          item.id === 'new' ? (
            <View style={{ width: width * 0.7, marginRight: 16 }}>
              <EmptyActionCard
                onCreate={openReservationPanel}
                width="w-full"
                height="h-[220px]"
              >
                Agendar nueva{'\n'}reserva
              </EmptyActionCard>
            </View>
          ) : (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 400 }}
              style={{ width: width * 0.7, marginRight: 16 }}
            >
              {/* Type guard to ensure only valid reservations are passed */}
              {'block' in item ? (
                <ReservationCard
                  data={item}
                  onCancel={onCancel}
                  onViewReason={onViewReason}
                />
              ) : null}
            </MotiView>
          )
        }
        contentContainerStyle={{ paddingLeft: 0, paddingRight: 16, paddingBottom: 10 }}
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerTitleDark: {
    color: '#ffffff',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ctaButtonText: {
    marginLeft: 8,
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
})
