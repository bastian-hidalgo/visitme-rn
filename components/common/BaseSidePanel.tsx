import React, { ReactNode, useEffect, useMemo } from 'react'
import {
  BackHandler,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

interface BaseSidePanelProps {
  isOpen: boolean
  onClose: () => void
  progress: SharedValue<number>
  backdropOpacity?: number
  widthFactor?: number
  children: ReactNode
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function BaseSidePanel({
  isOpen,
  onClose,
  progress,
  children,
  backdropOpacity = 0.3,
  widthFactor = 0.75,
}: BaseSidePanelProps) {
  const { width } = useWindowDimensions()
  const panelWidth = useMemo(() => width * widthFactor, [width, widthFactor])
  const startSV = useSharedValue(0)

  useEffect(() => {
    const handleBack = () => {
      if (!isOpen) return false
      progress.value = withTiming(0, { duration: 250 }, () => runOnJS(onClose)())
      return true
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', handleBack)
    return () => sub.remove()
  }, [isOpen, onClose, progress])

  const closeWithAnim = () => {
    progress.value = withTiming(0, { duration: 250 }, () => runOnJS(onClose)())
  }

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * backdropOpacity,
  }))

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * panelWidth }],
  }))

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startSV.value = progress.value
    })
    .onChange((event) => {
      const next = startSV.value - event.translationX / panelWidth
      progress.value = Math.min(Math.max(next, 0), 1)
    })
    .onEnd((event) => {
      const shouldClose = progress.value < 0.5 || event.velocityX > 500
      if (shouldClose) {
        progress.value = withTiming(0, { duration: 250 }, () => runOnJS(onClose)())
      } else {
        progress.value = withTiming(1, { duration: 250 })
      }
    })

  if (!isOpen) return null

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <AnimatedPressable
        onPress={closeWithAnim}
        style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]}
      />
      <View pointerEvents="box-none" style={styles.overlay}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.panelWrapper, { width: panelWidth }, panelStyle]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(15,23,42,0.6)' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  panelWrapper: { height: '100%' },
})
