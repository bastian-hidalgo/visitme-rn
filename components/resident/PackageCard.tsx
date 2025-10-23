import { useResidentContext } from '@/components/contexts/ResidentContext'
import getUrlImageFromStorage from '@/lib/getUrlImageFromStorage'
import { format, formatDate } from '@/lib/time'
import type { Parcel } from '@/types/parcel'
import { PackageCheck, PackageSearch, PackageX } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function PackageCard({ parcel }: { parcel: Parcel }) {
  const { openPackagesPanel, setParcelDetail } = useResidentContext()
  type ParcelStatus = 'received' | 'pending' | 'picked_up' | 'cancelled'

  const status: ParcelStatus = (parcel.status ?? 'received') as ParcelStatus

  const iconByStatus: Record<ParcelStatus, React.ReactNode> = {
    received: <PackageSearch size={24} color="#3b82f6" />,
    pending: <PackageX size={24} color="#f59e0b" />,
    picked_up: <PackageCheck size={24} color="#10b981" />,
    cancelled: <PackageX size={24} color="#6b7280" />,
  }

  const handleOpenDetails = (parcel: Parcel) => {
    openPackagesPanel()
    setParcelDetail(parcel)
  }

  const fallbackImage = 'https://www.visitme.cl/img/placeholder-package.webp'
  const resolvedPhoto = parcel.photo_url
    ? getUrlImageFromStorage(parcel.photo_url, 'parcel-photos') || fallbackImage
    : fallbackImage

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 500 }}
      style={styles.container}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleOpenDetails(parcel)}
        style={styles.touchable}
      >
        {/* 🔹 Foto */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: resolvedPhoto }} style={styles.image} resizeMode="cover" />
        </View>

        {/* 🔹 Información */}
        <View style={styles.info}>
          {/* Fecha */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>
              {formatDate(parcel.created_at)}
            </Text>
          </View>

          {/* Estado */}
          <View style={styles.statusRow}>
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

          {/* Fecha de retiro */}
          {parcel.picked_up_at && (
            <Text style={styles.pickupText}>
              Retirada {format(parcel.picked_up_at, 'DD/MM/YYYY HH:mm')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  touchable: {
    width: '100%',
    alignItems: 'stretch',
  },
  imageWrapper: {
    width: '100%',
    height: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    alignItems: 'flex-start',
  },
  dateBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6d28d9',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#1f2937',
  },
  pickupText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
})
