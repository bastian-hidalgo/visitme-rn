import type { Database } from '@/types/supabase'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { Cloud, CloudRain, MoreVertical, Sun, Wind } from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useState } from 'react'
import { ActionSheetIOS, Alert, Image, Text, TouchableOpacity, View } from 'react-native'

// 📅 Configuración de dayjs
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('es')
const tz = dayjs.tz.guess()

type Reservation = Database['public']['Views']['common_space_reservations_with_user']['Row']

export interface ReservationCardProps {
  data: Reservation
  onCancel: (id: string) => void
  onViewReason: (reason: string) => void
}

export default function ReservationCard({ data, onCancel, onViewReason }: ReservationCardProps) {
  const [backgroundColor, setBackgroundColor] = useState<string>('rgba(109,40,217,1)')

  const dateObj = dayjs.utc(data.date).tz(tz, true)
  const day = dateObj.format('D')
  const month = dateObj.format('MMM')
  const title = data.common_space_name || 'Sin nombre'
  const timeBlock = data.block === 'morning' ? 'AM' : 'PM'
  const finalImageUrl = data.common_space_image_url || 'https://via.placeholder.com/300x200'
  type ExtendedReservation = Reservation & { weather?: 'sunny' | 'rainy' | 'cloudy' | 'windy' }
  const extendedData = data as ExtendedReservation
  const finalWeather: 'sunny' | 'rainy' | 'cloudy' | 'windy' = extendedData.weather || 'sunny'
  const departmentNumber = data.department_number || 'Sin departamento'

  const cardBg = data.status === 'cancelado' ? '#555' : backgroundColor

  const weatherIcon = () => {
    switch (finalWeather) {
      case 'sunny': return <Sun size={22} color="#fff" />
      case 'rainy': return <CloudRain size={22} color="#fff" />
      case 'cloudy': return <Cloud size={22} color="#fff" />
      case 'windy': return <Wind size={22} color="#fff" />
      default: return <Sun size={22} color="#fff" />
    }
  }

  const handleMenu = () => {
    const options: string[] = []
    const actions: (() => void)[] = []

    if (data.status !== 'cancelado') {
      options.push('Anular reserva')
      actions.push(() => onCancel(data.id ?? ''))

      options.push('Agregar a calendario')
      actions.push(() => {
        Alert.alert('📅 Calendario', 'Funcionalidad próximamente disponible en la app.')
      })
    }

    if (data.status === 'cancelado' && data.cancellation_reason) {
      options.push('Ver motivo')
      actions.push(() => onViewReason(data.cancellation_reason!))
    }

    options.push('Cancelar')

    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        userInterfaceStyle: 'light',
      },
      (index) => {
        if (index < actions.length) actions[index]()
      }
    )
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 500 }}
      style={{
        width: 200,
        height: 220,
        marginRight: 16,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <View style={{ backgroundColor: cardBg, flex: 1, borderRadius: 16 }}>
        {/* Etiqueta Cancelada */}
        {data.status === 'cancelado' && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'red',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12 }}>Cancelada</Text>
          </View>
        )}

        {/* Clima */}
        <View style={{ position: 'absolute', top: 8, left: 8 }}>
          {weatherIcon()}
        </View>

        {/* Imagen */}
        <Image
          source={{ uri: finalImageUrl }}
          style={{
            width: '100%',
            height: 120,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            opacity: data.status === 'cancelado' ? 0.6 : 1,
          }}
          resizeMode="cover"
        />

        {/* Información */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
          <View
            style={{
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.25)',
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 8,
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{day}</Text>
            <Text style={{ color: '#fff', fontSize: 10 }}>
              {month.charAt(0).toUpperCase() + month.slice(1)}
            </Text>
          </View>

          <View>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>{title}</Text>
            <Text style={{ color: '#fff', fontSize: 11 }}>Depto: {departmentNumber}</Text>
            <Text style={{ color: '#fff', fontSize: 11 }}>Horario: {timeBlock}</Text>
          </View>
        </View>

        {/* Menú */}
        <TouchableOpacity
          onPress={handleMenu}
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.4)',
            padding: 6,
            borderRadius: 20,
          }}
        >
          <MoreVertical size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </MotiView>
  )
}
