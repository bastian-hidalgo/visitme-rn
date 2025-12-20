import NewsDetailSheet from '@/components/resident/NewsDetailSheet'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'

export default function AlertScreen() {
  const router = useRouter()
  // type is optional in search params but used in component logic
  const { title, message, type, id, created_at, image_url } = useLocalSearchParams<{
    id?: string
    title?: string
    message?: string
    type?: string
    created_at?: string
    image_url?: string
  }>()

  const bottomSheetRef = useRef<BottomSheetModal>(null)

  // Construct the alert object from URL params
  const alertDetail = useMemo(() => ({
    id: id ? Number(id) : 0, // Mock ID if not provided, though usually not crucial for display
    title,
    message,
    type: type || 'comunicado',
    created_at: created_at || new Date().toISOString(), // Fallback to now if missing
    image_url,
    tags: [] // Tags might not be passed via deep link easily, can be empty
  }), [id, title, message, type, created_at, image_url])

  useEffect(() => {
    // Open sheet automatically
    setTimeout(() => {
        bottomSheetRef.current?.present()
    }, 100)
  }, [])

  return (
    <View style={styles.container}>
      <NewsDetailSheet
        ref={bottomSheetRef}
        alert={alertDetail}
        onClose={() => {
            if (router.canGoBack()) {
                router.back()
            } else {
                router.push('/')
            }
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Transparent because the Sheet has its own backdrop
    backgroundColor: 'transparent',
  },
})
