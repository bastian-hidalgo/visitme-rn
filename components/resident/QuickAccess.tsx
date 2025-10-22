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

export default function QuickAccessBottom() {
  const { packages } = useResidentContext()

  const pendingPackages = useMemo(
    () => packages.filter(pkg => pkg.status === 'pending' || pkg.status === 'received').length,
    [packages]
  )

  const handleScrollToSection = (sectionId: string) => {
    // 👇 En RN podrías navegar o hacer scroll si usas react-navigation o un ScrollRef
    console.log(`Scroll/navigate to ${sectionId}`)
  }

  return (
    <View style={styles.container}>
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon
        const showBadge = action.id === 'packages' && pendingPackages > 0

        return (
          <MotiPressable
            key={action.id}
            onPress={() => handleScrollToSection(action.id)}
            animate={({ pressed }) => ({
              scale: pressed ? 0.9 : 1,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View style={styles.action}>
              <Icon size={26} color="#6d28d9" /> {/* violet-700 */}
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
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
    marginTop: 4,
    color: '#374151',
    fontWeight: '500',
  },
})
