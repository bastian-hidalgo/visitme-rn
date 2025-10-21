import { LinearGradient } from 'expo-linear-gradient'
import { Image as ImageIcon } from 'lucide-react-native'
import { MotiView } from 'moti'
import React from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'

interface SkeletonCardProps {
  height?: string | number
  width?: string | number
  variant?: 'image' | 'card'
}

export default function SkeletonCard({
  height = 160,
  width = Dimensions.get('window').width - 40,
  variant = 'card',
}: SkeletonCardProps) {
  // Ensure width and height are valid DimensionValue types (number or percentage string)
  const getDimensionValue = (value: string | number): number | `${number}%` => {
    if (typeof value === 'number') return value
    if (/^\d+%$/.test(value)) return value as `${number}%`
    return 0
  }

  return (
    <View
      style={[
        styles.container,
        { width: getDimensionValue(width), height: getDimensionValue(height) },
      ]}
    >
      {/* 💫 Efecto shimmer con Moti */}
      <MotiView
        from={{ translateX: -width }}
        animate={{ translateX: width }}
        transition={{
          loop: true,
          duration: 1200,
          type: 'timing',
        }}
        style={StyleSheet.absoluteFillObject}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.25)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </MotiView>

      {/* 💡 Contenido simulado */}
      {variant === 'card' && (
        <View style={styles.cardContent}>
          <View style={styles.lineLarge} />
          <View style={styles.lineSmall} />
        </View>
      )}

      {variant === 'image' && (
        <View style={styles.imageContainer}>
          <ImageIcon size={60} color="#A1A1AA" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E5E5',
  },
  gradient: {
    width: '50%',
    height: '100%',
  },
  cardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  lineLarge: {
    height: 10,
    width: '50%',
    backgroundColor: '#D4D4D8',
    borderRadius: 4,
    marginBottom: 6,
  },
  lineSmall: {
    height: 8,
    width: '30%',
    backgroundColor: '#D4D4D8',
    borderRadius: 4,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
