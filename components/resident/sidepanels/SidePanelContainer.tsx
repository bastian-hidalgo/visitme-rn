import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BackHandler,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated'

type CloseFunction = () => Promise<void>

interface SidePanelContainerProps {
  isOpen: boolean
  onClose: () => void
  children: (helpers: {
    close: CloseFunction
    progress: SharedValue<number>
    panelWidth: number
  }) => React.ReactNode
  progress?: SharedValue<number>
  widthFactor?: number
  backdropColor?: string
  backdropOpacity?: number
  enablePanToClose?: boolean
  enableBackHandler?: boolean
  panelWrapperStyle?: StyleProp<ViewStyle>
  openDuration?: number
  closeDuration?: number
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
const DEFAULT_OPEN_DURATION = 300
const DEFAULT_CLOSE_DURATION = 250

export default function SidePanelContainer({
  isOpen,
  onClose,
  children,
  progress: externalProgress,
  widthFactor = 0.85,
  backdropColor = 'rgba(15, 23, 42, 0.6)',
  backdropOpacity = 0.3,
  enablePanToClose = true,
  enableBackHandler = true,
  panelWrapperStyle,
  openDuration = DEFAULT_OPEN_DURATION,
  closeDuration = DEFAULT_CLOSE_DURATION,
}: SidePanelContainerProps) {
  const { width } = useWindowDimensions()
  const panelWidth = useMemo(() => width * widthFactor, [width, widthFactor])

  const localProgress = useSharedValue(0)
  const progress = externalProgress ?? localProgress
  const startSV = useSharedValue(0)
  const [isMounted, setIsMounted] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      progress.value = withTiming(1, { duration: openDuration })
    } else {
      progress.value = withTiming(0, { duration: closeDuration }, (finished) => {
        if (finished) {
          runOnJS(setIsMounted)(false)
        }
      })
    }
  }, [closeDuration, isOpen, openDuration, progress])

  const close = useCallback<CloseFunction>(() => {
    return new Promise<void>((resolve) => {
      progress.value = withTiming(0, { duration: closeDuration }, () => {
        runOnJS(onClose)()
        runOnJS(resolve)()
      })
    })
  }, [closeDuration, onClose, progress])

  useEffect(() => {
    if (!enableBackHandler || !isMounted) return

    const handleBack = () => {
      void close()
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack)
    return () => subscription.remove()
  }, [close, enableBackHandler, isMounted])

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * backdropOpacity,
    backgroundColor: backdropColor,
  }))

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - progress.value) * panelWidth }],
  }))

  const panGesture = useMemo(() => {
    if (!enablePanToClose) return Gesture.Pan().onStart(() => {})

    return Gesture.Pan()
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
          void close()
        } else {
          progress.value = withTiming(1, { duration: openDuration })
        }
      })
  }, [close, enablePanToClose, openDuration, panelWidth, progress, startSV])

  if (!isMounted && !isOpen) {
    return null
  }

  const content = (
    <Animated.View style={[styles.panelWrapper, { width: panelWidth }, panelStyle, panelWrapperStyle]}>
      {children({ close, progress, panelWidth })}
    </Animated.View>
  )

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <AnimatedPressable
        onPress={() => {
          void close()
        }}
        style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]}
      />

      <View pointerEvents="box-none" style={styles.overlay}>
        {enablePanToClose ? (
          <GestureDetector gesture={panGesture}>{content}</GestureDetector>
        ) : (
          content
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  panelWrapper: {
    height: '100%',
  },
})
