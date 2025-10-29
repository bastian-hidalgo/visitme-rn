import { Plus } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface EmptyActionCardProps {
  onCreate: () => void
  children: React.ReactNode
  width?: number | string
  height?: number | string
  icon?: React.ReactNode
}

export default function EmptyActionCard({
  children,
  onCreate,
  icon,
  width = 'w-[200px]',
  height = 'h-[220px]',
}: EmptyActionCardProps) {
  const resolveSize = (value?: number | string) => {
    if (typeof value === 'number') {
      return value
    }

    if (!value) {
      return undefined
    }

    if (value === 'w-full' || value === 'h-full') {
      return '100%'
    }

    const numeric = parseInt(value.replace(/[^0-9]/g, ''), 10)
    return Number.isNaN(numeric) ? undefined : numeric
  }

  const resolvedWidth = resolveSize(width)
  const resolvedHeight = resolveSize(height)

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 500 }}
      style={[
        styles.container,
        resolvedWidth ? { width: resolvedWidth } : null,
        resolvedHeight ? { height: resolvedHeight } : null,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onCreate}
        style={styles.touchable}
      >
        <View style={styles.iconWrapper}>
          {icon || <Plus size={28} color="#4c1d95" />}
        </View>
        <Text style={styles.text}>
          {children}
        </Text>
      </TouchableOpacity>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchable: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#c4b5fd',
    marginBottom: 8,
  },
  text: {
    color: '#5b21b6',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
})
