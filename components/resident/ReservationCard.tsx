import dayjs from 'dayjs'
import 'dayjs/locale/es'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import type { ReservationWithWeather } from '@/lib/useWeatherForReservations'

// 📅 Configuración de dayjs
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('es')
const tz = dayjs.tz.guess()

export interface ReservationCardProps {
  data: ReservationWithWeather
  onPress?: (reservation: ReservationWithWeather) => void
}

export default function ReservationCard({ data, onPress }: ReservationCardProps) {
  const dateObj = dayjs.utc(data.date).tz(tz, true)
  const day = dateObj.format('DD')
  const month = dateObj.format('MMM').toUpperCase()
  const title = data.common_space_name || 'Espacio común'
  const timeBlock =
    data.block === 'morning' ? 'Bloque AM' : data.block === 'afternoon' ? 'Bloque PM' : 'Horario sin asignar'
  const finalImageUrl = data.common_space_image_url || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511'
  const departmentNumber = data.department_number || 'Sin departamento'

  const weatherIcon = useMemo(() => {
    switch (data.weather) {
      case 'rainy':
        return <CloudRain size={18} color="#fff" />
      case 'cloudy':
        return <Cloud size={18} color="#fff" />
      case 'windy':
        return <Wind size={18} color="#fff" />
      default:
        return <Sun size={18} color="#fff" />
    }
  }, [data.weather])

  const statusPill = useMemo(() => {
    if (data.status === 'cancelado') {
      return { label: 'Cancelada', textColor: '#FEE2E2', background: 'rgba(239,68,68,0.32)' }
    }
    return { label: 'Confirmada', textColor: '#DCFCE7', background: 'rgba(34,197,94,0.32)' }
  }, [data.status])

  return (
    <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} style={styles.wrapper}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
        onPress={() => onPress?.(data)}
      >
        <Image source={{ uri: finalImageUrl }} style={styles.image} contentFit="cover" />
        <LinearGradient
          colors={['rgba(15,23,42,0.85)', 'rgba(15,23,42,0.55)', 'rgba(30,41,59,0.35)']}
          style={styles.overlay}
        />

        <View style={styles.topRow}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{day}</Text>
            <Text style={styles.dateMonth}>{month}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusPill.background }]}>
            <Text style={[styles.statusText, { color: statusPill.textColor }]}>{statusPill.label}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text numberOfLines={2} style={styles.title}>
              {title}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Departamento</Text>
              <Text style={styles.metaValue}>{departmentNumber}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Horario</Text>
              <Text style={styles.metaValue}>{timeBlock}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.weatherBadge}>
              {weatherIcon}
              <Text style={styles.weatherLabel}>
                {data.weather_description || 'Clima estimado'}
              </Text>
            </View>
            <Text style={styles.ctaText}>Ver detalle</Text>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  card: {
    height: 228,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#111827',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 22,
    justifyContent: 'space-between',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: 16,
    alignItems: 'center',
    width: 48,
  },
  dateDay: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  dateMonth: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  content: {
    marginTop: 16,
  },
  titleRow: {
    marginBottom: 14,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.55)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metaValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  metaDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  footer: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  weatherLabel: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '600',
  },
  ctaText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '700',
  },
})
