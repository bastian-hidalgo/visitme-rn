import { useResidentContext } from '@/components/contexts/ResidentContext'
import { Bell, Calendar, Package, Users } from 'lucide-react-native'
import { MotiPressable } from 'moti/interactions'
import React, { useMemo } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

const QUICK_ACTIONS = [
  { id: 'news', label: 'Noticias', icon: Bell },
  { id: 'reservations', label: 'Reservas', icon: Calendar },
  { id: 'invited', label: 'Invitados', icon: Users },
  { id: 'packages', label: 'Encomiendas', icon: Package },
] as const

interface QuickAccessProps {
  onNavigate: (sectionId: (typeof QUICK_ACTIONS)[number]['id']) => void
}

export default function QuickAccessBottom({ onNavigate }: QuickAccessProps) {
  const { packages } = useResidentContext()

  const pendingPackages = useMemo(
    () => packages.filter(pkg => pkg.status === 'pending' || pkg.status === 'received').length,
    [packages]
  )

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.92)', 'rgba(245, 240, 255, 0.88)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, Platform.OS === 'android' && styles.containerAndroid]}
    >
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon
        const showBadge = action.id === 'packages' && pendingPackages > 0

        return (
          <MotiPressable
            key={action.id}
            onPress={() => onNavigate(action.id)}
            animate={({ pressed }) => ({
              scale: pressed ? 0.9 : 1,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View style={styles.action}>
              <LinearGradient
                colors={['#ede9fe', '#e0e7ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconWrapper}
              >
                <Icon size={18} color="#6d28d9" />
              </LinearGradient>
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingPackages}
                  </Text>
                </View>
              )}
              <Text style={styles.actionLabel}>{action.label}</Text>
            </View>
          </MotiPressable>
        )
      })}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    borderRadius: 26,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    shadowColor: 'rgba(17, 24, 39, 0.18)',
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  containerAndroid: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flex: 1,
    minWidth: 62,
    gap: 4,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 14,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    height: 16,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  actionLabel: {
    fontSize: 11,
    color: '#4338ca',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
})
