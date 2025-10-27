import BaseSidePanel from '@/components/common/BaseSidePanel'
import ReservationWizard from '@/components/resident/reservations/ReservationWizard'
import { X } from 'lucide-react-native'
import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { SharedValue } from 'react-native-reanimated'

interface ReservationPanelProps {
  isOpen: boolean
  onClose: () => void
  progress: SharedValue<number>
}

export default function ReservationPanel({ isOpen, onClose, progress }: ReservationPanelProps) {
  if (!isOpen) return null

  return (
    <BaseSidePanel isOpen={isOpen} onClose={onClose} progress={progress} widthFactor={0.92} backdropOpacity={0.35}>
      <View style={styles.container}>
        <View style={styles.closeWrapper}>
          <Pressable onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Cerrar panel">
            <X size={18} color="#4c1d95" />
          </Pressable>
        </View>
        <ReservationWizard isOpen={isOpen} onClose={onClose} />
      </View>
    </BaseSidePanel>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  closeWrapper: {
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
