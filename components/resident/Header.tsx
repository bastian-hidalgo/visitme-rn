import UserMenuPanel from '@/components/resident/sidepanels/UserMenuPanel'
import { getGreeting } from '@/lib/greetings'
import { useUser } from '@/providers/user-provider'
import { MotiView } from 'moti'
import React, { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Building2 } from 'lucide-react-native'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const greeting = getGreeting()
  const { name, avatarUrl, communityName } = useUser()

  return (
    <View style={styles.container}>
      {/* 🔹 Logo */}
      <View style={styles.logoWrapper}>
        <Image
          source={require('@/assets/logo.png')}
          style={{ width: 100, height: 40, resizeMode: 'contain' }}
        />
      </View>

      {/* 🔹 Greeting + Avatar */}
      <View style={styles.infoSection}>
        {/* Textos */}
        <View style={styles.textContainer}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.name}>{name}</Text>
          <LinearGradient
            colors={["#7C3AED", "#5B21B6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.communityBadge}
          >
            <Building2 size={16} color="#FDE68A" />
            <View style={styles.communityBadgeTextWrapper}>
              <Text style={styles.communityBadgeLabel}>Tu Comunidad</Text>
              <Text style={styles.communityBadgeText} numberOfLines={1}>
                {communityName}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Avatar con animación */}
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: isMenuOpen ? 0.95 : 1 }}
          transition={{ type: 'timing', duration: 150 }}
        >
          <Pressable onPress={() => setIsMenuOpen(true)}>
            <View style={styles.avatarWrapper}>
              <Image
                source={
                  avatarUrl
                    ? { uri: avatarUrl }
                    : require('@/assets/img/avatar.webp')
                }
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          </Pressable>
        </MotiView>
      </View>

      {/* 🔹 Menú lateral del usuario */}
      <UserMenuPanel isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textContainer: {
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
    color: '#0f172a',
  },
  communityBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 10,
    shadowColor: 'rgba(91, 33, 182, 0.25)',
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    maxWidth: 220,
  },
  communityBadgeTextWrapper: {
    flex: 1,
  },
  communityBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  communityBadgeText: {
    fontSize: 13,
    color: '#fef3c7',
    fontWeight: '600',
  },
  avatarWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 64,
    height: 64,
    backgroundColor: '#e5e7eb',
  },
})
