import { useResidentContext } from '@/components/contexts/ResidentContext'
import getUrlImageFromStorage from '@/lib/getUrlImageFromStorage'
import { format, formatDate } from '@/lib/time'
import type { Parcel } from '@/types/parcel'
import { PackageCheck, PackageSearch, PackageX } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { Image } from 'expo-image'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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

  const departmentNumber = (parcel as unknown as { department?: { number?: string | null } })
    ?.department?.number

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
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: resolvedPhoto }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
          />
        </View>

        <View style={styles.info}>
          <View style={styles.topRow}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{formatDate(parcel.created_at)}</Text>
            </View>

            {departmentNumber ? (
              <View style={styles.departmentBadge}>
                <Text style={styles.departmentText}>Depto. {departmentNumber}</Text>
              </View>
            ) : null}
          </View>

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

          {parcel.picked_up_at ? (
            <Text style={styles.pickupText}>
              Retirada {format(parcel.picked_up_at, 'DD/MM/YYYY HH:mm')}
            </Text>
          ) : (
            <Text style={styles.pendingText}>Retírala con tu credencial</Text>
          )}
        </View>
      </TouchableOpacity>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    width: '100%',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  touchable: {
    width: '100%',
    alignItems: 'stretch',
    gap: 12,
  },
  imageWrapper: {
    width: '100%',
    height: 124,
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    alignItems: 'flex-start',
    gap: 10,
  },
  topRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  dateBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6d28d9',
  },
  departmentBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  departmentText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730a3',
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
  },
  pendingText: {
    fontSize: 12,
    color: '#4338ca',
    fontWeight: '500',
  },
})
