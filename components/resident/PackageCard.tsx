// components/resident/PackageCard.tsx
import PackageExpandableCardComponent, { type PackageStatusLabel } from '@/components/resident/PackageExpandableCard'
import getUrlImageFromStorage from '@/lib/getUrlImageFromStorage'
import { format, fromNow } from '@/lib/time'
import { PackageCheck, PackageSearch, PackageX } from 'lucide-react-native'
import { type ReactNode } from 'react'
import type { SharedValue } from 'react-native-reanimated'

const CARD_WIDTH = 150
const CARD_HEIGHT = CARD_WIDTH * 1.2

type PackageCardProps = {
  parcel: any
  scrollX: SharedValue<number>
  index: number
}

const STATUS_CONFIG: Record<
  'received' | 'pending' | 'picked_up' | 'cancelled',
  { label: PackageStatusLabel; badge: string; icon: ReactNode }
> = {
  received: { label: 'Recibida', badge: '#3b82f6', icon: <PackageSearch size={16} color="#fff" /> },
  pending: { label: 'Esperando', badge: '#f59e0b', icon: <PackageX size={16} color="#fff" /> },
  picked_up: { label: 'Retirada', badge: '#10b981', icon: <PackageCheck size={16} color="#fff" /> },
  cancelled: { label: 'Anulada', badge: '#6b7280', icon: <PackageX size={16} color="#fff" /> },
}

export default function PackageCard({ parcel, scrollX, index }: PackageCardProps) {
  const statusKey = (parcel.status ?? 'received') as keyof typeof STATUS_CONFIG
  const statusConfig = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.received
  const fallbackImage = 'https://www.visitme.cl/img/placeholder-package.webp'
  const resolvedPhoto =
    parcel.photo_url
      ? getUrlImageFromStorage(parcel.photo_url, 'parcel-photos') || fallbackImage
      : fallbackImage
  const departmentNumber = parcel?.department?.number
  const receivedAtLabel = format(parcel.created_at, 'DD MMM YYYY • HH:mm')
  const receivedRelativeLabel = parcel.created_at ? fromNow(parcel.created_at) : undefined
  const pickedUpAtLabel = parcel.picked_up_at ? format(parcel.picked_up_at, 'DD MMM YYYY • HH:mm') : undefined
  const pickedUpRelativeLabel = parcel.picked_up_at ? fromNow(parcel.picked_up_at) : undefined
  const summaryBaseDate = parcel.picked_up_at || parcel.created_at
  const summaryDate = summaryBaseDate ? format(summaryBaseDate, 'DD MMM • HH:mm') : 'Sin fecha'
  const summaryPrefix = statusKey === 'picked_up' ? 'Retirada' : 'Recibida'
  const signatureCompleted = Boolean(parcel.signature_url)
  const signatureImageUrl = signatureCompleted
    ? getUrlImageFromStorage(parcel.signature_url, 'parcel-photos')
    : undefined

  return (
    <PackageExpandableCardComponent
      parcel={parcel}
      id={parcel.id?.toString?.() ?? String(parcel.id)}
      imageUrl={resolvedPhoto}
      status={statusConfig.label}
      statusIcon={statusConfig.icon}
      statusBadgeColor={statusConfig.badge}
      apartment={departmentNumber ? String(departmentNumber) : undefined}
      date={`${summaryPrefix} • ${summaryDate}`}
      receivedAtLabel={receivedAtLabel}
      receivedRelativeLabel={receivedRelativeLabel}
      pickedUpAtLabel={pickedUpAtLabel}
      pickedUpRelativeLabel={pickedUpRelativeLabel}
      signatureCompleted={signatureCompleted}
      signatureImageUrl={signatureImageUrl}
      scrollX={scrollX}
      index={index}
      cardWidth={CARD_WIDTH}
      cardHeight={CARD_HEIGHT}
    />
  )
}
