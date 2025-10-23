import { useResidentContext } from '@/components/contexts/ResidentContext'
import { Bell, Calendar, Package, Users } from 'lucide-react-native'
import { MotiPressable } from 'moti/interactions'
import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

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
    <View style={styles.container}>
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
              <View style={styles.iconWrapper}>
                <Icon size={22} color="#6d28d9" />
              </View>
              {showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingPackages}
                  </Text>
                </View>
              )}
              <Text style={styles.actionLabel}>
                {action.label}
              </Text>
            </View>
          </MotiPressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 16,
    shadowColor: '#111827',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 72,
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: 0,
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
    fontSize: 12,
    marginTop: 8,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'center',
  },
})
