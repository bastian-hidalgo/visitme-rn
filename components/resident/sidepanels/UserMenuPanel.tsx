import { useResidentContext } from '@/components/contexts/ResidentContext'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import { useRouter } from 'expo-router'
import { ArrowLeftRight, Camera, Lightbulb, LogOut } from 'lucide-react-native'
import { MotiView } from 'moti'
import React, { useEffect, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native'
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
  const colorScheme = useColorScheme()

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
    // aquí podrías abrir tu panel o pantalla de edición de avatar
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

  return (
    <Modal
      isVisible={isOpen}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      animationIn="slideInRight"
      animationOut="slideOutRight"
      backdropTransitionOutTiming={0}
      style={{ margin: 0, justifyContent: 'flex-end' }}
    >
      <MotiView
        from={{ translateX: 300 }}
        animate={{ translateX: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={[
          styles.panel,
          colorScheme === 'dark' && styles.panelDark,
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <Image
                source={
                  avatarUrl
                    ? { uri: avatarUrl }
                    : require('@/assets/img/avatar.webp')
                }
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            {communityName ? (
              <View style={styles.communityBadge}>
                <Text style={styles.communityBadgeText}>
                  {communityName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Opciones */}
          <View style={styles.options}>
            <MenuItem
              icon={<Camera size={18} />}
              text="Editar foto"
              onPress={handleEditPhoto}
            />
            <MenuItem
              icon={<Lightbulb size={18} />}
              text="Realizar una sugerencia"
              onPress={handleFeedback}
            />
            {hasMultipleCommunities && (
              <MenuItem
                icon={<ArrowLeftRight size={18} />}
                text="Cambiar comunidad"
                onPress={handleChangeCommunity}
              />
            )}
          </View>

          {/* Logout */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutButton}
            >
              <LogOut color="#fff" size={18} />
              <Text style={styles.logoutText}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </MotiView>
    </Modal>
  )
}

/* 🔹 Componente auxiliar para cada item */
const MenuItem = ({
  icon,
  text,
  onPress,
}: {
  icon: React.ReactNode
  text: string
  onPress: () => void
}) => {
  const colorScheme = useColorScheme()

  return (
    <Pressable onPress={onPress}>
      <MotiView
        from={{ opacity: 0, translateX: 20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        style={[
          styles.menuItem,
          colorScheme === 'dark' ? styles.menuItemDark : styles.menuItemLight,
        ]}
      >
        {icon}
        <Text
          style={[
            styles.menuItemText,
            colorScheme === 'dark' && styles.menuItemTextDark,
          ]}
        >
          {text}
        </Text>
      </MotiView>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: '#ffffff',
    height: '100%',
    width: '80%',
    marginLeft: 'auto',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    padding: 20,
  },
  panelDark: {
    backgroundColor: '#111827',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  communityBadge: {
    backgroundColor: 'rgba(126, 34, 206, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  communityBadgeText: {
    color: '#7e22ce',
    fontSize: 12,
    fontWeight: '500',
  },
  options: {
    gap: 12,
  },
  logoutContainer: {
    marginTop: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7e22ce',
    paddingVertical: 12,
    borderRadius: 16,
  },
  logoutText: {
    color: '#ffffff',
    marginLeft: 8,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 80,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 0,
  },
  menuItemLight: {
    borderBottomColor: '#f3f4f6',
  },
  menuItemDark: {
    borderBottomColor: '#1f2937',
  },
  menuItemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  menuItemTextDark: {
    color: '#f3f4f6',
  },
})
