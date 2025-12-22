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

  const isPast = useMemo(() => dayjs(data.date).isBefore(dayjs(), 'day'), [data.date])

  const statusPill = useMemo(() => {
    if (data.status === 'cancelado') {
      return { label: 'Cancelada', textColor: '#FEE2E2', background: 'rgba(239,68,68,0.42)' }
    }
    if (isPast) {
      return { label: 'Concretada', textColor: '#E2E8F0', background: 'rgba(71,85,105,0.5)' }
    }
    return { label: 'Confirmada', textColor: '#DCFCE7', background: 'rgba(34,197,94,0.4)' }
  }, [data.status, isPast])

  return (
    <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} style={styles.wrapper}>
      <TouchableOpacity activeOpacity={0.9} style={styles.card} onPress={() => onPress?.(data)}>
        <Image 
          source={{ uri: finalImageUrl }} 
          style={[styles.image, isPast && { opacity: 0.55 }]} 
          contentFit="cover" 
        />
        <LinearGradient 
          colors={isPast ? ['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)'] : ['rgba(15,23,42,0.05)', 'rgba(15,23,42,0.6)', 'rgba(15,23,42,0.95)']} 
          style={styles.overlay} 
        />
        {isPast && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.1)', mixBlendMode: 'saturation' } as any]} />}

        <View style={styles.header}>
          <View style={[styles.statusBadge, { backgroundColor: statusPill.background }]}>
            <Text style={[styles.statusText, { color: statusPill.textColor }]}>{statusPill.label}</Text>
          </View>
        </View>

        <View style={styles.bottomContent}>
          <View style={styles.mainInfo}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateDay}>{day}</Text>
              <Text style={styles.dateMonth}>{month}</Text>
            </View>
            <View style={styles.titleBlock}>
              <Text numberOfLines={2} style={styles.title}>
                {title}
              </Text>
              <Text style={styles.subtitle}>{timeBlock}</Text>
              <Text style={styles.metaValue}>Depto. {departmentNumber}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.weatherBadge}>
              {weatherIcon}
              <Text style={styles.weatherLabel} numberOfLines={1}>
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
    height: 272,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingTop: 18,
    paddingHorizontal: 18,
  },
  statusBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 18,
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  dateBadge: {
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    minWidth: 56,
  },
  dateDay: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    lineHeight: 20,
  },
  dateMonth: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  subtitle: {
    color: 'rgba(226,232,240,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  metaValue: {
    color: 'rgba(226,232,240,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  weatherLabel: {
    color: '#E0F2FE',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 120,
  },
  ctaText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '700',
  },
})
