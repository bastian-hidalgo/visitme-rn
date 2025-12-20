// components/resident/PackageExpandableCard.tsx
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { useResidentContext } from '@/components/contexts/ResidentContext'

export type PackageStatusLabel = 'Recibida' | 'Retirada' | 'Esperando' | 'Anulada'

export type PackageExpandableCardProps = {
  id: string
  imageUrl: string
  status: PackageStatusLabel
  apartment?: string
  date: string
  receivedAtLabel?: string
  receivedRelativeLabel?: string
  pickedUpAtLabel?: string | null
  pickedUpRelativeLabel?: string | null
  signatureImageUrl?: string | null
  signatureCompleted?: boolean
  onClose?: () => void
  statusIcon?: ReactNode
  statusBadgeColor?: string
  statusTextColor?: string
  detailDescription?: string
  scrollX?: any
  index?: number
  cardWidth?: number
  cardHeight?: number
}

export default function PackageExpandableCard({
  id,
  imageUrl,
  status,
  apartment,
  date,
  receivedAtLabel,
  receivedRelativeLabel,
  pickedUpAtLabel,
  pickedUpRelativeLabel,
  signatureImageUrl,
  signatureCompleted,
  onClose,
  statusIcon,
  statusBadgeColor,
  statusTextColor,
  detailDescription,
}: PackageExpandableCardProps) {
  const { setParcelDetail } = useResidentContext()

  const openSheet = useCallback(() => {
    setParcelDetail({
      id,
      imageUrl,
      status,
      department: apartment ? { number: apartment } : undefined,
      created_at: receivedAtLabel || '', // Approximation for types
      picked_up_at: pickedUpAtLabel,
      photo_url: imageUrl,
      signature_url: signatureImageUrl,
      description: detailDescription,
    } as any)
  }, [id, imageUrl, status, apartment, receivedAtLabel, pickedUpAtLabel, signatureImageUrl, detailDescription, setParcelDetail])

  const statusBadgeColors = useMemo(() => {
    const palette: Record<PackageStatusLabel, { backgroundColor: string; text: string }> = {
      Recibida: { backgroundColor: '#3b82f6', text: '#fff' },
      Retirada: { backgroundColor: '#10b981', text: '#fff' },
      Esperando: { backgroundColor: '#f59e0b', text: '#fff' },
      Anulada: { backgroundColor: '#6b7280', text: '#fff' },
    }
    const baseColors = palette[status] ?? { backgroundColor: '#6B4EFF', text: '#fff' }
    return {
      backgroundColor: statusBadgeColor ?? baseColors.backgroundColor,
      text: statusTextColor ?? baseColors.text,
    }
  }, [status, statusBadgeColor, statusTextColor])

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={openSheet}>
      <View style={[styles.card]}>
        <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent']} style={styles.overlay} />
        <View style={styles.cardContent}>
          <View style={[styles.statusBadge, { backgroundColor: statusBadgeColors.backgroundColor }]}>
            {statusIcon ? <View style={styles.statusIcon}>{statusIcon}</View> : null}
            <Text style={[styles.statusText, { color: statusBadgeColors.text }]}>{status}</Text>
          </View>
          {apartment ? <Text style={styles.apartmentText}>Depto. {apartment}</Text> : null}
          <Text style={styles.dateText}>{date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    gap: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  statusIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  apartmentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    color: '#f3f4f6',
    fontSize: 11,
  },
  sheetBackground: {
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: '#cbd5e1',
    width: 40,
  },
  sheetBody: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sheetImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  sheetHeader: {
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#6B4EFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sheetSubTitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  sheetDate: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionBody: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  timeline: {
    gap: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: '#6B4EFF',
  },
  timelineDotCompleted: {
    backgroundColor: '#10b981',
  },
  timelineDotPending: {
    backgroundColor: '#f59e0b',
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  timelineValue: {
    fontSize: 14,
    color: '#374151',
  },
  timelineHint: {
    fontSize: 12,
    color: '#6B7280',
  },
  signaturePlaceholder: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(107, 78, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 78, 255, 0.05)',
  },
  signatureText: {
    color: '#6B4EFF',
    fontSize: 14,
    fontWeight: '600',
  },
  signatureContainer: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  signatureImage: {
    width: '100%',
    height: 120,
  },
  signatureConfirmedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
  },
  signatureCaption: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
})
