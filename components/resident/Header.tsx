import { getGreeting } from '@/lib/greetings'
import { useUser } from '@/providers/user-provider'
import { LinearGradient } from 'expo-linear-gradient'
import { Building2, Menu } from 'lucide-react-native'
import React from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated'

interface Props {
  onToggleMenu: () => void
  progress: SharedValue<number>
}

export default function Header({ onToggleMenu, progress }: Props) {
  const greeting = getGreeting()
  const { name, avatarUrl, communityName } = useUser()

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - progress.value * 0.04 },
      { translateX: -progress.value * 6 },
    ],
  }))

  const menuButtonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - progress.value * 0.08 },
      { rotate: `${progress.value * 90}deg` },
    ],
    opacity: 1 - progress.value * 0.1,
  }))

  return (
    <View style={styles.container}>
      <View style={styles.shell}>
        <LinearGradient
          colors={['rgba(124, 58, 237, 0.16)', 'rgba(91, 33, 182, 0.04)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGlow}
        />

        <View style={styles.card}>
          <Animated.View style={avatarStyle}>
            <View style={styles.avatarOuter}>
              <LinearGradient
                colors={['#A78BFA', '#7C3AED', '#4C1D95']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Image
                  source={avatarUrl ? { uri: avatarUrl } : require('@/assets/img/avatar.webp')}
                  style={styles.avatarImage}
                />
              </LinearGradient>
            </View>
          </Animated.View>

          <View style={styles.copyBlock}>
            <View style={styles.copyTopRow}>
              <Text style={styles.greeting}>{greeting}</Text>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Dashboard</Text>
              </View>
            </View>

            <Text style={styles.name} numberOfLines={1}>
              {name || 'Sin nombre'}
            </Text>

            <View style={styles.communityRow}>
              <Building2 size={13} color="#6d28d9" />
              <Text style={styles.communityText} numberOfLines={1}>
                {communityName || 'Sin comunidad'}
              </Text>
            </View>
          </View>

          <Animated.View style={menuButtonStyle}>
            <Pressable onPress={onToggleMenu} style={styles.menuButton} hitSlop={8}>
              <LinearGradient
                colors={['#111827', '#1f2937']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuButtonInner}
              >
                <Menu size={22} color="#ffffff" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  shell: {
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: 8,
    left: 10,
    right: 10,
    bottom: -2,
    borderRadius: 30,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  avatarOuter: {
    width: 62,
    height: 62,
    borderRadius: 22,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  avatarGradient: {
    flex: 1,
    borderRadius: 22,
    padding: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  copyBlock: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  copyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#f5f3ff',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7c3aed',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6d28d9',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    fontWeight: '800',
    fontSize: 22,
    lineHeight: 26,
    color: '#0f172a',
    marginBottom: 6,
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  communityText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
  },
  menuButton: {
    borderRadius: 18,
  },
  menuButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
})
