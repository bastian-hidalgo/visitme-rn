import { PackageDetailSheet } from '@/components/resident/PackageDetailSheet'
import { PackageExpandableCardProps } from '@/components/resident/PackageExpandableCard'
import getUrlImageFromStorage from '@/lib/getUrlImageFromStorage'
import { supabase } from '@/lib/supabase'
import { format, fromNow } from '@/lib/time'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

export default function PackageDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [pkg, setPkg] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[PackageDetailModal] Mounted. Params ID:', id)
    if (!id) return

    const fetchPackage = async () => {
      console.log('[PackageDetailModal] Fetching package...', id)
      setLoading(true)
      const { data, error } = await supabase
        .from('parcels')
        .select('*, department:departments(number)') // Fetch department number too
        .eq('id', id)
        .single()

      if (error) {
        console.error('[PackageDetailModal] Error fetching package:', error)
      } else {
        console.log('[PackageDetailModal] Package fetched successfully')
        setPkg(data)
      }
      setLoading(false)
    }

    fetchPackage()
  }, [id])

  const bottomSheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => {
    if (pkg) {
      console.log('[PackageDetailModal] Presenting BottomSheet...')
      // Small delay to ensure mount
      setTimeout(() => {
        bottomSheetRef.current?.present()
      }, 100)
    }
  }, [pkg])

  const sheetProps = React.useMemo<PackageExpandableCardProps | null>(() => {
    if (!pkg) return null

    const statusKey = (pkg.status ?? 'received') as 'received' | 'pending' | 'picked_up' | 'cancelled'
    
    // Status config (Simplified version of PackageCard logic since we don't have the icon components here easily usually, 
    // but the sheet actually only needs the label text string for 'status' prop)
    const STATUS_LABELS: Record<string, string> = {
      received: 'Recibida',
      pending: 'Esperando',
      picked_up: 'Retirada',
      cancelled: 'Anulada',
    }
    const statusLabel = (STATUS_LABELS[statusKey] ?? 'Recibida') as any

    const fallbackImage = 'https://www.visitme.cl/img/placeholder-package.webp'
    
    // Logic from PackageCard.tsx
    // The photo_url field name might be different in Supabase query depending on schema. 
    // The previous code used pkg.image_url, PackageCard uses parcel.photo_url. 
    // I need to be careful here. Step 298 showed `pkg.image_url`. PackageCard shows `parcel.photo_url`.
    // I will check both to be safe.
    const rawPhotoUrl = pkg.image_url || pkg.photo_url
    const imageUrl = rawPhotoUrl
          ? getUrlImageFromStorage(rawPhotoUrl, 'parcel-photos') 
          : fallbackImage

    const departmentNumber = pkg?.department?.number
    
    // Format helpers from lib/time
    const receivedAtLabel = format(pkg.created_at, 'DD MMM YYYY • HH:mm')
    const receivedRelativeLabel = pkg.created_at ? fromNow(pkg.created_at) : undefined
    
    const pickedUpAtLabel = pkg.picked_up_at ? format(pkg.picked_up_at, 'DD MMM YYYY • HH:mm') : undefined
    const pickedUpRelativeLabel = pkg.picked_up_at ? fromNow(pkg.picked_up_at) : undefined

    const summaryBaseDate = pkg.picked_up_at || pkg.created_at
    const summaryDate = summaryBaseDate ? format(summaryBaseDate, 'DD MMM • HH:mm') : 'Sin fecha'
    const summaryPrefix = statusKey === 'picked_up' ? 'Retirada' : 'Recibida'

    const signatureCompleted = Boolean(pkg.signature_url)
    const signatureImageUrl = signatureCompleted
      ? getUrlImageFromStorage(pkg.signature_url, 'parcel-photos')
      : undefined

    return {
      id: pkg.id,
      imageUrl,
      status: statusLabel,
      apartment: departmentNumber ? String(departmentNumber) : undefined,
      date: `${summaryPrefix} • ${summaryDate}`,
      receivedAtLabel,
      receivedRelativeLabel,
      pickedUpAtLabel,
      pickedUpRelativeLabel,
      signatureCompleted,
      signatureImageUrl,
      detailDescription: pkg.description,
    }
  }, [pkg])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    )
  }

  if (!pkg) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la encomienda.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {sheetProps && (
        <PackageDetailSheet
          ref={bottomSheetRef}
          {...sheetProps}
          onClose={() => {
            if (router.canGoBack()) {
              router.back()
            } else {
              router.push('/')
            }
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // Darker dim for better contrast if no home screen
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
