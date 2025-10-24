import { useResidentContext } from '@/components/contexts/ResidentContext'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ArrowLeftRight, Camera, Lightbulb, LogOut } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { SharedValue } from 'react-native-reanimated'

import SidePanelContainer from './SidePanelContainer'

type MenuItem = {
  id: string
  text: string
  icon: React.ReactNode
  onPress: () => Promise<void> | void
  isLogout?: boolean
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
  const [activeItem, setActiveItem] = useState('home')

  useEffect(() => {
    if (!id) return
    let alive = true
    supabase
      .from('user_communities')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .then(({ count }) => {
        if (alive && count && count > 1) setHasMultipleCommunities(true)
      })
    return () => {
      alive = false
    }
  }, [id])

  return (
    <SidePanelContainer
      isOpen={isOpen}
      onClose={onClose}
      progress={progress}
      widthFactor={0.75}
      backdropOpacity={0.3}
    >
      {({ close }) => {
        const handleEditPhoto = async () => {
          await close()
          router.push('/profile/edit-avatar' as any)
        }

        const handleFeedback = async () => {
          await close()
          openFeedbackPanel()
        }

        const handleChangeCommunity = async () => {
          await close()
          router.replace('/choose-community')
        }

        const handleLogout = async () => {
          await logout()
        }

        const menuItems: MenuItem[] = [
          {
            id: 'photo',
            text: 'Editar foto',
            icon: <Camera size={18} color="#fff" />,
            onPress: handleEditPhoto,
          },
          {
            id: 'suggest',
            text: 'Realizar una sugerencia',
            icon: <Lightbulb size={18} color="#fff" />,
            onPress: handleFeedback,
          },
          ...(hasMultipleCommunities
            ? [
                {
                  id: 'change',
                  text: 'Cambiar comunidad',
                  icon: <ArrowLeftRight size={18} color="#fff" />,
                  onPress: handleChangeCommunity,
                },
              ]
            : []),
          {
            id: 'logout',
            text: 'Cerrar sesión',
            icon: <LogOut size={18} color="#fff" />,
            onPress: handleLogout,
            isLogout: true,
          },
        ]

        return (
          <LinearGradient
            colors={['#7C3AED', '#5B21B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.panel}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={avatarUrl ? { uri: avatarUrl } : require('@/assets/img/avatar.webp')}
                    style={styles.avatar}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.communityLabel}>Tu comunidad</Text>
                  <Text style={styles.communityName}>{communityName || 'Sin nombre'}</Text>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.menu}>
                {menuItems.map((item) => {
                  const isActive = activeItem === item.id
                  const isLogout = item.isLogout
                  return (
                    <React.Fragment key={item.id}>
                      {isLogout && <View style={styles.separator} />}
                      <Pressable
                        onPress={async () => {
                          setActiveItem(item.id)
                          await item.onPress()
                        }}
                        style={[styles.menuItem, isActive && styles.menuItemActive]}
                      >
                        <View style={[styles.menuIcon, isActive && styles.menuIconActive]}>
                          {item.icon}
                        </View>
                        <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                          {item.text}
                        </Text>
                      </Pressable>
                    </React.Fragment>
                  )
                })}
              </View>
            </ScrollView>
          </LinearGradient>
        )
      }}
    </SidePanelContainer>
  )
}

const styles = StyleSheet.create({
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
