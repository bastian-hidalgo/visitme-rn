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
          <Image
            source={{
              uri: parcel.photo_url
                ? getUrlImageFromStorage(parcel.photo_url, 'parcel-photos')
                : 'https://www.visitme.cl/img/placeholder-package.webp',
            }}
            style={styles.image}
            resizeMode="cover"
          />
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
    borderRadius: 16,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  touchable: {
    width: '100%',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    height: 160,
    backgroundColor: '#e5e7eb',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  dateBadge: {
    backgroundColor: '#c4b5fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5b21b6',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    marginTop: 4,
  },
})
