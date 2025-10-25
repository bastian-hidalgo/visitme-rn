import React, { ReactNode, useCallback, useMemo, useRef, useState } from 'react'
import { useWindowDimensions, View, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'

export type PackageStatusLabel = 'Recibida' | 'Retirada' | 'Esperando' | 'Anulada'

export type PackageExpandableCardProps = {
  id: string
  imageUrl: string
  status: PackageStatusLabel
  apartment?: string
  date: string
  onClose?: () => void
  statusIcon?: ReactNode
  statusBadgeColor?: string
  statusTextColor?: string
  detailDescription?: string
  scrollX?: SharedValue<number>
  index?: number
  cardWidth?: number
  cardHeight?: number
}

const SPRING_OPEN_CONFIG = {
  damping: 12,
  stiffness: 120,
}

const SPRING_CLOSE_CONFIG = {
  damping: 14,
  stiffness: 180,
}

const clamp = (value: number, lowerBound: number, upperBound: number) => {
  'worklet'
  return Math.min(Math.max(value, lowerBound), upperBound)
}

const SMALL_CARD_WIDTH = 150
const SMALL_CARD_HEIGHT = 180
const SMALL_CARD_RADIUS = 20

export const PackageExpandableCard: React.FC<PackageExpandableCardProps> = ({
  id,
  imageUrl,
  status,
  apartment,
  date,
  onClose,
  statusIcon,
  statusBadgeColor,
  statusTextColor,
  detailDescription,
  scrollX,
  index,
  cardWidth,
  cardHeight,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardRef = useRef<View>(null)
  const animation = useSharedValue(0)
  const originX = useSharedValue(0)
  const originY = useSharedValue(0)
  const originWidth = useSharedValue(0)
  const originHeight = useSharedValue(0)
  const { width: screenWidth, height: screenHeight } = useWindowDimensions()
  const collapsedWidth = cardWidth ?? SMALL_CARD_WIDTH
  const collapsedHeight = cardHeight ?? SMALL_CARD_HEIGHT

  const handleOpen = useCallback(() => {
    cardRef.current?.measureInWindow((x, y, width, height) => {
      originX.value = x
      originY.value = y
      originWidth.value = width
      originHeight.value = height
      animation.value = 0
      setIsExpanded(true)
      animation.value = withSpring(1, SPRING_OPEN_CONFIG)
    })
  }, [animation, originHeight, originWidth, originX, originY])

  const finishClosing = useCallback(() => {
    setIsExpanded(false)
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const closeCard = useCallback(() => {
    animation.value = withSpring(0, SPRING_CLOSE_CONFIG, (finished) => {
      if (finished) {
        runOnJS(finishClosing)()
      }
    })
  }, [animation, finishClosing])

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onUpdate((event) => {
        const progress = clamp(1 - event.translationY / screenHeight, 0, 1)
        animation.value = progress
      })
      .onEnd((event) => {
        const shouldClose = event.translationY > screenHeight * 0.18 || event.velocityY > 800
        if (shouldClose) {
          animation.value = withSpring(0, SPRING_CLOSE_CONFIG, (finished) => {
            if (finished) {
              runOnJS(finishClosing)()
            }
          })
        } else {
          animation.value = withSpring(1, SPRING_OPEN_CONFIG)
        }
      })
  }, [animation, finishClosing, screenHeight])

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animation.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }))

  const animatedCardStyle = useAnimatedStyle(() => {
    const top = interpolate(animation.value, [0, 1], [originY.value, 0], Extrapolation.CLAMP)
    const left = interpolate(animation.value, [0, 1], [originX.value, 0], Extrapolation.CLAMP)
    const width = interpolate(animation.value, [0, 1], [originWidth.value, screenWidth], Extrapolation.CLAMP)
    const height = interpolate(animation.value, [0, 1], [originHeight.value, screenHeight], Extrapolation.CLAMP)
    const borderRadius = interpolate(animation.value, [0, 1], [SMALL_CARD_RADIUS, 0], Extrapolation.CLAMP)

    return {
      top,
      left,
      width,
      height,
      borderRadius,
    }
  })

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(animation.value, [0, 1], [1, 1.05], Extrapolation.CLAMP),
      },
    ],
  }))

  const collapsedImageParallaxStyle = useAnimatedStyle(() => {
    if (!scrollX || index === undefined) {
      return { transform: [{ translateX: 0 }] }
    }

    const translate = interpolate(
      scrollX.value,
      [(index - 1) * collapsedWidth, index * collapsedWidth, (index + 1) * collapsedWidth],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    )

    const collapseFactor = 1 - animation.value

    return {
      transform: [{ translateX: translate * collapseFactor }],
    }
  }, [collapsedWidth, index, scrollX])

  const detailAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animation.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(animation.value, [0, 1], [16, 0], Extrapolation.CLAMP),
      },
    ],
  }))

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
    <>
      <TouchableOpacity activeOpacity={0.92} onPress={handleOpen}>
        <View
          ref={cardRef}
          style={[styles.card, { width: collapsedWidth, height: collapsedHeight }]}
        >
          <Animated.View style={[styles.thumbnailWrapper, collapsedImageParallaxStyle]}>
            <Image source={{ uri: imageUrl }} style={styles.thumbnail} contentFit="cover" />
          </Animated.View>
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.0)']}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={styles.thumbnailGradient}
          />
          <View style={styles.cardContent}>
            <View style={[styles.statusBadge, { backgroundColor: statusBadgeColors.backgroundColor }]}>
              {statusIcon ? <View style={styles.statusIcon}>{statusIcon}</View> : null}
              <Text style={[styles.statusText, { color: statusBadgeColors.text }]}>{status}</Text>
            </View>
            {apartment ? (
              <Text style={styles.apartmentText}>Depto. {apartment}</Text>
            ) : null}
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}>
          <GestureDetector gesture={panGesture}>
            <Animated.View style={[styles.expandedCard, animatedCardStyle]}>
              <Animated.View style={[styles.expandedImageWrapper, imageAnimatedStyle]}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.expandedImage}
                  contentFit="cover"
                />
              </Animated.View>
              <LinearGradient
                colors={["rgba(0,0,0,0.5)", 'transparent']}
                start={{ x: 0.5, y: 1 }}
                end={{ x: 0.5, y: 0 }}
                style={styles.expandedGradient}
              />

              <Animated.View style={[styles.detailContainer, detailAnimatedStyle]}>
                <View style={styles.headerRow}>
                  <View>
                    <Text style={styles.expandedStatus}>{status}</Text>
                    {apartment ? (
                      <Text style={styles.expandedApartment}>Departamento {apartment}</Text>
                    ) : (
                      <Text style={styles.expandedApartment}>Encomienda</Text>
                    )}
                    <Text style={styles.expandedDate}>{date}</Text>
                  </View>
                  <TouchableOpacity onPress={closeCard} style={styles.closeButton} activeOpacity={0.8}>
                    <Text style={styles.closeText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Detalles de la encomienda</Text>
                  <Text style={styles.sectionBody}>
                    {detailDescription ?? `ID #${id} • Estado ${status.toLowerCase()}${
                      apartment ? ` • Depto. ${apartment}` : ''
                    }.`}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Firma</Text>
                  <View style={styles.signaturePlaceholder}>
                    <Text style={styles.signatureText}>Firma pendiente</Text>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  card: {
    height: SMALL_CARD_HEIGHT,
    width: SMALL_CARD_WIDTH,
    borderRadius: SMALL_CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginVertical: 8,
    marginHorizontal: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  thumbnailWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  thumbnailGradient: {
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
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    zIndex: 20,
  },
  expandedCard: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  expandedImageWrapper: {
    height: '60%',
    width: '100%',
  },
  expandedImage: {
    width: '100%',
    height: '100%',
  },
  expandedGradient: {
    position: 'absolute',
    bottom: '40%',
    left: 0,
    right: 0,
    height: 180,
  },
  detailContainer: {
    position: 'absolute',
    top: '60%',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expandedStatus: {
    color: '#6B4EFF',
    fontSize: 18,
    fontWeight: '700',
  },
  expandedApartment: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  expandedDate: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108, 82, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 28,
    color: '#6B4EFF',
    marginTop: -4,
  },
  section: {
    gap: 8,
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
})

export default PackageExpandableCard
