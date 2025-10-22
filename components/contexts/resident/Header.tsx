import UserMenuPanel from '@/components/resident/sidepanels/UserMenuPanel'
import { getGreeting } from '@/lib/greetings'
import { useUser } from '@/providers/UserProvider'
import { MotiView } from 'moti'
import React, { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const greeting = getGreeting()
  const { name, avatarUrl, communityName } = useUser()
  const colorScheme = useColorScheme()

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
          <Text style={[styles.greeting, colorScheme === 'dark' && styles.greetingDark]}>{greeting}</Text>
          <Text style={[styles.name, colorScheme === 'dark' && styles.nameDark]}>{name}</Text>
          <View style={styles.communityBadge}>
            <Text style={styles.communityBadgeText}>{communityName}</Text>
          </View>
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
    paddingHorizontal: 16,
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
  greetingDark: {
    color: '#d1d5db',
  },
  name: {
    fontWeight: '600',
    lineHeight: 18,
    color: '#0f172a',
  },
  nameDark: {
    color: '#f8fafc',
  },
  communityBadge: {
    backgroundColor: 'rgba(126, 34, 206, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  communityBadgeText: {
    fontSize: 12,
    color: '#7e22ce',
    fontWeight: '500',
  },
  avatarWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 64,
    height: 64,
    backgroundColor: '#e5e7eb',
  },
})
