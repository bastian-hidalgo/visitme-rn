import BaseSidePanel from '@/components/common/BaseSidePanel'
import { useResidentContext } from '@/components/contexts/ResidentContext'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/providers/user-provider'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ArrowLeftRight, Camera, Lightbulb, LogOut } from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SharedValue } from 'react-native-reanimated'

type UserMenuPanelProps = {
  isOpen: boolean
  onClose: () => void
  progress: SharedValue<number>
}


export default function UserMenuPanel({ isOpen, onClose, progress }: UserMenuPanelProps) {
  const router = useRouter()
  const { avatarUrl, communityName, id, logout } = useUser()
  const { openFeedbackPanel } = useResidentContext()
  const [hasMultipleCommunities, setHasMultipleCommunities] = useState(false)
  const [activeItem, setActiveItem] = useState('home')

  useEffect(() => {
    if (!id) return
    supabase
      .from('user_communities')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .then(({ count }) => {
        if (count && count > 1) setHasMultipleCommunities(true)
      })
  }, [id])

  const handleNavigate = (path: string) => {
    onClose()
    setTimeout(() => router.push(path as any), 250)
  }

  const MENU_ITEMS = [
    { id: 'photo', text: 'Editar foto', icon: <Camera size={18} color="#fff" />, onPress: () => handleNavigate('/profile/edit-avatar') },
    { id: 'suggest', text: 'Realizar una sugerencia', icon: <Lightbulb size={18} color="#fff" />, onPress: () => openFeedbackPanel() },
    ...(hasMultipleCommunities
      ? [{ id: 'change', text: 'Cambiar comunidad', icon: <ArrowLeftRight size={18} color="#fff" />, onPress: () => handleNavigate('/choose-community') }]
      : []),
    { id: 'logout', text: 'Cerrar sesión', icon: <LogOut size={18} color="#fff" />, onPress: logout, isLogout: true },
  ]

  return (
    <BaseSidePanel isOpen={isOpen} onClose={onClose} progress={progress}>
      <LinearGradient colors={['#7C3AED', '#5B21B6']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.panel}>
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
            {MENU_ITEMS.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setActiveItem(item.id)
                  item.onPress()
                }}
                style={[styles.menuItem, activeItem === item.id && styles.menuItemActive]}
              >
                <View style={styles.menuIcon}>{item.icon}</View>
                <Text style={styles.menuText}>{item.text}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </BaseSidePanel>
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
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
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
  },
  avatar: { width: 66, height: 66, borderRadius: 33 },
  headerText: { alignItems: 'flex-start' },
  communityLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 2 },
  communityName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 24, width: '100%' },
  menu: { gap: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  menuItemActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  menuIcon: { marginRight: 14, opacity: 0.9, color: '#fff' },
  menuText: { color: '#fff', fontSize: 15, fontWeight: '500' },
})
