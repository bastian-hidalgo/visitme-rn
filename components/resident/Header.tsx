import { getGreeting } from '@/lib/greetings'
import { useUser } from '@/providers/user-provider'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Building2 } from 'lucide-react-native'
import React from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

interface Props {
  onToggleMenu: () => void
  progress: SharedValue<number>
}

export default function Header({ onToggleMenu, progress }: Props) {
  const greeting = getGreeting()
  const router = useRouter()
  const { name, avatarUrl, communityName } = useUser()

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - progress.value * 0.05 },
    ],
  }))

  const handleNavigate = (path: string) => {
    setTimeout(() => router.push(path as any), 250)
  }

  return (
    <View style={styles.container}>
      {/* 🔹 Fila 1: Logo centrado */}
      <View style={styles.logoRow}>
        <Image
          source={require('@/assets/logo.png')}
          style={styles.logo}
        />
      </View>

      {/* 🔹 Fila 2: Comunidad a la izquierda, info usuario a la derecha */}
      <View style={styles.bottomRow}>
        {/* Comunidad */}
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.communityBadge}
        >
          <Building2 size={16} color="#FDE68A" style={{ marginRight: 8 }} />
          <Pressable onPress={() => handleNavigate('/choose-community')}>
            <Text style={styles.communityBadgeLabel}>Tu comunidad</Text>
            <Text style={styles.communityBadgeText} numberOfLines={1}>
              {communityName}
            </Text>
          </Pressable>
        </LinearGradient>

        {/* Usuario */}
        <View style={styles.infoSection}>
          <View style={styles.textContainer}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.name}>{name}</Text>
          </View>

          <Animated.View style={avatarStyle}>
            <Pressable onPress={onToggleMenu}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={avatarUrl ? { uri: avatarUrl } : require('@/assets/img/avatar.webp')}
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingVertical: 0,
    paddingBottom: 16,
    gap: 10,
  },
  logoRow: {
    alignItems: 'center', // centra el logo horizontalmente
  },
  logo: {
    width: 120,
    height: 48,
    resizeMode: 'contain',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  communityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
    shadowColor: 'rgba(91, 33, 182, 0.25)',
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    maxWidth: 220,
  },
  communityBadgeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  communityBadgeText: {
    fontSize: 13,
    color: '#fef3c7',
    fontWeight: '600',
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
  avatarWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 64,
    height: 64,
    backgroundColor: '#e5e7eb',
  },
})
