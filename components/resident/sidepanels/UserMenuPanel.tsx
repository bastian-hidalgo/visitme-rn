import { useResidentContext } from '@/components/contexts/ResidentContext'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ArrowLeftRight, Camera, Lightbulb, LogOut, X } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function UserMenuPanel({ isOpen, onClose }: Props) {
  const router = useRouter()
  const { avatarUrl, communityName, id, logout } = useUser()
  const { openFeedbackPanel } = useResidentContext()
  const [hasMultipleCommunities, setHasMultipleCommunities] = useState(false)
  const [activeItem, setActiveItem] = useState<string>('home')

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
    onClose()
    router.push('/profile/edit-avatar' as any)
  }

  const handleFeedback = () => {
    onClose()
    openFeedbackPanel()
  }

  const handleChangeCommunity = () => {
    onClose()
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

  return (
    <Modal
      isVisible={isOpen}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={["right"]}
      animationIn="slideInRight"
      animationOut="slideOutRight"
      backdropOpacity={0.3}
      backdropTransitionOutTiming={0}
      style={{ margin: 0 }}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.panel}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 🟣 Header con avatar */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
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
              <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar panel de usuario">
                <View style={styles.closeButton}>
                  <X size={20} color="#fff" />
                </View>
              </Pressable>
            </View>

            {/* Separador */}
            <View style={styles.separator} />

            {/* 🔹 Menú principal + logout */}
            <View style={styles.menu}>
              {MENU_ITEMS.map((item, index) => {
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
      </View>
    </Modal>
  )
}

/* 🎨 Estilos */
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    height: '100%',
    width: '75%',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    boxShadow: '0 40px 12px rgba(139, 92, 246, 1)',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    flex: 1,
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
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
