import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Calendar, CheckCircle2, Clock, Cloud, CloudRain, Sun, Wind, XCircle } from 'lucide-react-native'
import { MotiView } from 'moti'
import { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { fromServerDate } from '@/lib/time'
import type { ReservationWithWeather } from '@/lib/useWeatherForReservations'

export interface ReservationCardProps {
  data: ReservationWithWeather
  onPress?: (reservation: ReservationWithWeather) => void
}

export default function ReservationCard({ data, onPress }: ReservationCardProps) {
  const dateObj = fromServerDate(data.date)
  const formattedDate = dateObj.format('DD [de] MMM')
  const title = data.common_space_name || 'Espacio común'
  const timeBlock =
    data.block === 'morning' ? 'Mañana' : data.block === 'afternoon' ? 'Tarde' : 'Todo el día'
  const finalImageUrl = data.common_space_image_url || 'https://images.unsplash.com/photo-1505691938895-1758d7feb511'

  const isPast = useMemo(() => dateObj.isBefore(fromServerDate(), 'day'), [dateObj])

  const statusInfo = useMemo(() => {
    if (data.status === 'cancelado') {
      return { 
        icon: <XCircle size={20} color="#EF4444" />, 
        background: 'rgba(254, 226, 226, 0.9)',
        label: 'Cancelada'
      }
    }
    if (isPast) {
      return { 
        icon: <Clock size={20} color="#64748B" />, 
        background: 'rgba(241, 245, 249, 0.9)',
        label: 'Pasada'
      }
    }
    return { 
      icon: <CheckCircle2 size={20} color="#22C55E" />, 
      background: 'rgba(220, 252, 231, 0.9)',
      label: 'Confirmada'
    }
  }, [data.status, isPast])

  const weatherIcon = useMemo(() => {
    switch (data.weather) {
      case 'rainy':
        return <CloudRain size={14} color="rgba(255,255,255,0.9)" />
      case 'cloudy':
        return <Cloud size={14} color="rgba(255,255,255,0.9)" />
      case 'windy':
        return <Wind size={14} color="rgba(255,255,255,0.9)" />
      default:
        return <Sun size={14} color="#FBBF24" />
    }
  }, [data.weather])

  return (
    <MotiView 
      from={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }} 
      style={styles.wrapper}
    >
      <TouchableOpacity 
        activeOpacity={0.9} 
        style={styles.card} 
        onPress={() => onPress?.(data)}
      >
        <Image 
          source={{ uri: finalImageUrl }} 
          style={[styles.image, (isPast || data.status === 'cancelado') && { opacity: 0.4 }]} 
          contentFit="cover" 
          transition={500}
        />
        
        <LinearGradient 
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']} 
          style={styles.overlay} 
        />

        {/* Status Icon - Top Right */}
        <View style={styles.header}>
          <View style={[styles.statusCircle, { backgroundColor: statusInfo.background }]}>
            {statusInfo.icon}
          </View>
        </View>

        <View style={styles.content}>
          <Text numberOfLines={2} style={styles.title}>
            {title}
          </Text>
          
          <View style={styles.infoRow}>
            <Calendar size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.subtitle}>
              {formattedDate} • {timeBlock}
            </Text>
          </View>

          {data.weather && (
            <View style={styles.weatherLine}>
              {weatherIcon}
              <Text style={styles.weatherText}>
                {data.weather_description}
              </Text>
            </View>
          )}
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
    height: 320, // Más alto para ser portrait
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#94a3b8', // Gray background to help desaturation look
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    padding: 16,
    alignItems: 'flex-end',
  },
  statusCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 20,
    gap: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontWeight: '600',
  },
  weatherLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  weatherText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
})
