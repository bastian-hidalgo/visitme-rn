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
      { scale: 1 - progress.value * 0.04 },
      { rotate: `${progress.value * 18}deg` },
    ],
    opacity: 1 - progress.value * 0.06,
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
                colors={['rgba(255,255,255,0.92)', 'rgba(248,250,252,0.88)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.menuButtonInner}
              >
                <Menu size={18} color="#475569" />
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
    borderRadius: 16,
  },
  menuButtonInner: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
    shadowColor: '#cbd5e1',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
})
