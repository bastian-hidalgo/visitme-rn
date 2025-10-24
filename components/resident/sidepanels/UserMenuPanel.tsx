import { useResidentContext } from '@/components/contexts/ResidentContext'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ArrowLeftRight, Camera, Lightbulb, LogOut } from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { BackHandler, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
  withTiming,
} from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

type GestureContext = {
  start: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  progress: SharedValue<number>
}

export default function UserMenuPanel({ isOpen, onClose, progress }: Props) {
  const router = useRouter()
  const { avatarUrl, communityName, id, logout } = useUser()
  const { openFeedbackPanel } = useResidentContext()
  const [hasMultipleCommunities, setHasMultipleCommunities] = useState(false)
  const [activeItem, setActiveItem] = useState<string>('home')
  const { width } = useWindowDimensions()
  const panelWidth = useMemo(() => width * 0.75, [width])
  const [isVisible, setIsVisible] = useState(isOpen)

  const requestClose = useCallback(() => {
    progress.value = withTiming(0, { duration: 250 })
    onClose()
  }, [onClose, progress])

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    const handleBack = () => {
      requestClose()
      return true
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBack)
    return () => {
      subscription.remove()
    }
  }, [isVisible, requestClose])

  useDerivedValue(() => {
    if (!isOpen && progress.value <= 0.01 && isVisible) {
      runOnJS(setIsVisible)(false)
    }
  }, [isOpen, isVisible])

  useEffect(() => {
    if (!id) return
    let mounted = true
    supabase
      .from('user_communities')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .then(({ count }) => {
        if (mounted && count && count > 1) setHasMultipleCommunities(true)
      })
    return () => {
      mounted = false
    }
  }, [id])

  const handleEditPhoto = () => {
    requestClose()
    router.push('/profile/edit-avatar' as any)
  }

  const handleFeedback = () => {
    requestClose()
    openFeedbackPanel()
  }

  const handleChangeCommunity = () => {
    requestClose()
    router.replace('/choose-community')
  }

  const handleLogout = async () => {
    await logout()
  }

  const MENU_ITEMS = [
    { id: 'photo', text: 'Editar foto', icon: <Camera size={18} color="#fff" />, onPress: handleEditPhoto },
    { id: 'suggest', text: 'Realizar una sugerencia', icon: <Lightbulb size={18} color="#fff" />, onPress: handleFeedback },
    ...(hasMultipleCommunities
      ? [{ id: 'change', text: 'Cambiar comunidad', icon: <ArrowLeftRight size={18} color="#fff" />, onPress: handleChangeCommunity }]
      : []),
    // logout agregado al mismo nivel, con separador arriba
    { id: 'logout', text: 'Cerrar sesión', icon: <LogOut size={18} color="#fff" />, onPress: handleLogout, isLogout: true },
  ]

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value * 0.3,
  }))

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: (1 - progress.value) * panelWidth },
    ],
  }))

  const panGesture = Gesture.Pan<GestureContext>()
    .onStart((_, context) => {
      context.start = progress.value
    })
    .onChange((event, context) => {
      const next = context.start - event.translationX / panelWidth
      const clamped = Math.min(Math.max(next, 0), 1)
      progress.value = clamped
    })
    .onEnd((event) => {
      const shouldClose = progress.value < 0.5 || event.velocityX > 500
      if (shouldClose) {
        progress.value = withTiming(0, { duration: 250 })
        runOnJS(onClose)()
      } else {
        progress.value = withTiming(1, { duration: 250 })
      }
    })

  if (!isVisible) {
    return null
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <AnimatedPressable
        onPress={requestClose}
        style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]}
      />

      <View pointerEvents="box-none" style={styles.overlay}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.panelWrapper, { width: panelWidth }, panelStyle]}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.panel}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 🟣 Header con avatar */}
                <View style={styles.header}>
                  <View style={styles.avatarWrapper}>
                    <Image
                      source={
                        avatarUrl
                          ? { uri: avatarUrl }
                          : require('@/assets/img/avatar.webp')
                      }
                      style={styles.avatar}
                    />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.communityLabel}>Tu comunidad</Text>
                    <Text style={styles.communityName}>
                      {communityName || 'Sin nombre'}
                    </Text>
                  </View>
                </View>

                {/* Separador */}
                <View style={styles.separator} />

                {/* 🔹 Menú principal + logout */}
                <View style={styles.menu}>
                  {MENU_ITEMS.map((item) => {
                    const isActive = activeItem === item.id
                    const isLogout = item.isLogout

                    return (
                      <React.Fragment key={item.id}>
                        {isLogout && <View style={styles.separator} />}
                        <Pressable
                          onPress={() => {
                            setActiveItem(item.id)
                            item.onPress()
                          }}
                          style={[
                            styles.menuItem,
                            isActive && styles.menuItemActive,
                          ]}
                        >
                          <View
                            style={[styles.menuIcon, isActive && styles.menuIconActive]}
                          >
                            {item.icon}
                          </View>
                          <Text
                            style={[
                              styles.menuText,
                              isActive && styles.menuTextActive,
                            ]}
                          >
                            {item.text}
                          </Text>
                        </Pressable>
                      </React.Fragment>
                    )
                  })}
                </View>
              </ScrollView>
            </LinearGradient>
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  )
}

/* 🎨 Estilos */
const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  panelWrapper: {
    height: '100%',
  },
  panel: {
    height: '100%',
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowColor: 'rgba(15, 23, 42, 0.35)',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: -4, height: 12 },
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 15,
    marginBottom: 0,
  },
  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(139, 92, 246, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginLeft: 10,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  headerText: {
    alignItems: 'flex-start',
  },
  communityLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginBottom: 2,
  },
  communityName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 24,
    width: '100%',
  },
  menu: {
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 30,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  menuIcon: {
    marginRight: 14,
    opacity: 0.9,
    color: '#fff',
  },
  menuIconActive: {
    opacity: 1,
  },
  menuText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  menuTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
})
