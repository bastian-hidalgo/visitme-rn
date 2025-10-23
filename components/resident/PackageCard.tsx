import { useResidentContext } from '@/components/contexts/ResidentContext'
import getUrlImageFromStorage from '@/lib/getUrlImageFromStorage'
import { formatDate } from '@/lib/time'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { PackageCheck, PackageSearch, PackageX } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const CARD_WIDTH = 150
const CARD_HEIGHT = CARD_WIDTH * 1.2

export default function PackageCard({ parcel, scrollX, index }: any) {
  const { openPackagesPanel, setParcelDetail } = useResidentContext()

  const handlePress = () => {
    openPackagesPanel()
    setParcelDetail(parcel)
  }

  const status = (parcel.status ?? 'received') as
    | 'received'
    | 'pending'
    | 'picked_up'
    | 'cancelled'

  const iconByStatus = {
    received: <PackageSearch size={16} color="#fff" />,
    pending: <PackageX size={16} color="#fff" />,
    picked_up: <PackageCheck size={16} color="#fff" />,
    cancelled: <PackageX size={16} color="#fff" />,
  }

  const fallbackImage = 'https://www.visitme.cl/img/placeholder-package.webp'
  const resolvedPhoto =
    parcel.photo_url
      ? getUrlImageFromStorage(parcel.photo_url, 'parcel-photos') || fallbackImage
      : fallbackImage

  const departmentNumber = (parcel as any)?.department?.number

  // Parallax: ampliamos el rango pero mantenemos dentro del marco
  const inputRange = [(index - 1) * CARD_WIDTH, index * CARD_WIDTH, (index + 1) * CARD_WIDTH]
  const translateX = scrollX.interpolate({
    inputRange,
    outputRange: [-15, 0, 15],
  })

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <MotiView
        style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
        from={{ opacity: 0, translateY: 60 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 500 }}
      >
        {/* Imagen ampliada para no dejar zonas negras */}
        <Animated.View style={[styles.imageWrapper, { transform: [{ translateX }] }]}>
          <Image
            source={{ uri: resolvedPhoto }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        </Animated.View>

        {/* Gradiente para texto */}
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.0)']}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.gradient}
        />

        {/* Texto superpuesto */}
        <View style={styles.info}>
          <View style={[styles.statusBadge, styles[`badge_${status}`]]}>
            {iconByStatus[status]}
            <Text style={styles.statusText}>
              {status === 'pending'
                ? 'Esperando'
                : status === 'picked_up'
                ? 'Retirada'
                : status === 'cancelled'
                ? 'Anulada'
                : 'Recibida'}
            </Text>
          </View>

          {departmentNumber ? (
            <Text style={styles.departmentText}>Depto. {departmentNumber}</Text>
          ) : null}

          <Text style={styles.dateText}>{formatDate(parcel.created_at)}</Text>
        </View>
      </MotiView>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 6,
    backgroundColor: '#000',
  },
  imageWrapper: {
    position: 'absolute',
    top: 0,
    left: '-10%',
    width: '120%', // imagen más grande para permitir movimiento
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  info: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  badge_received: { backgroundColor: '#3b82f6' },
  badge_pending: { backgroundColor: '#f59e0b' },
  badge_picked_up: { backgroundColor: '#10b981' },
  badge_cancelled: { backgroundColor: '#6b7280' },
  statusText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  departmentText: {
    color: '#f3f4f6',
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    color: '#d1d5db',
    fontSize: 11,
  },
})
